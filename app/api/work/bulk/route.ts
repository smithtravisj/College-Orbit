import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

// Valid bulk operations
const VALID_OPERATIONS = ['update', 'delete', 'complete', 'reopen'] as const;
type BulkOperation = (typeof VALID_OPERATIONS)[number];

// POST bulk operations on work items
export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();
    console.log('[POST /work/bulk] Request body:', JSON.stringify(data, null, 2));

    const { operation, ids, updates } = data as {
      operation: BulkOperation;
      ids: string[];
      updates?: Record<string, any>;
    };

    // Validate required fields
    if (!operation || !VALID_OPERATIONS.includes(operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${VALID_OPERATIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }

    // Verify all items belong to user
    const existingItems = await prisma.workItem.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: {
        id: true,
        recurringPatternId: true,
        canvasAssignmentId: true,
      },
    });

    if (existingItems.length !== ids.length) {
      const foundIds = new Set(existingItems.map((i) => i.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: `Some work items not found or not owned by user: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    let result: any;

    switch (operation) {
      case 'delete': {
        // Track Canvas deletions to prevent re-sync
        const canvasItems = existingItems.filter((i) => i.canvasAssignmentId);
        for (const item of canvasItems) {
          await prisma.deletedCanvasItem.upsert({
            where: {
              userId_canvasId_type: {
                userId,
                canvasId: item.canvasAssignmentId!,
                type: 'assignment',
              },
            },
            update: { deletedAt: new Date() },
            create: {
              userId,
              canvasId: item.canvasAssignmentId!,
              type: 'assignment',
            },
          });
        }

        // Handle recurring items - deactivate patterns
        const recurringItems = existingItems.filter((i) => i.recurringPatternId);
        const patternIds = [...new Set(recurringItems.map((i) => i.recurringPatternId!))];

        if (patternIds.length > 0) {
          await prisma.recurringWorkPattern.updateMany({
            where: { id: { in: patternIds } },
            data: { isActive: false },
          });
        }

        // Delete all specified items
        result = await prisma.workItem.deleteMany({
          where: {
            id: { in: ids },
            userId,
          },
        });

        console.log(`[POST /work/bulk] Deleted ${result.count} work items`);
        return NextResponse.json({ success: true, deleted: result.count });
      }

      case 'complete': {
        result = await prisma.workItem.updateMany({
          where: {
            id: { in: ids },
            userId,
          },
          data: {
            status: 'done',
            workingOn: false,
          },
        });

        console.log(`[POST /work/bulk] Completed ${result.count} work items`);
        return NextResponse.json({ success: true, updated: result.count });
      }

      case 'reopen': {
        result = await prisma.workItem.updateMany({
          where: {
            id: { in: ids },
            userId,
          },
          data: {
            status: 'open',
          },
        });

        console.log(`[POST /work/bulk] Reopened ${result.count} work items`);
        return NextResponse.json({ success: true, updated: result.count });
      }

      case 'update': {
        if (!updates || typeof updates !== 'object') {
          return NextResponse.json({ error: 'updates object is required for update operation' }, { status: 400 });
        }

        // Build update data object with only allowed fields
        const updateData: Record<string, any> = {};

        if ('type' in updates) {
          updateData.type = updates.type;
        }
        if ('tags' in updates) {
          updateData.tags = updates.tags;
        }
        if ('priority' in updates) {
          updateData.priority = updates.priority || null;
        }
        if ('effort' in updates) {
          updateData.effort = updates.effort || null;
        }
        if ('courseId' in updates) {
          updateData.courseId = updates.courseId || null;
        }
        if ('status' in updates) {
          updateData.status = updates.status;
        }
        if ('workingOn' in updates) {
          updateData.workingOn = updates.workingOn;
        }
        if ('pinned' in updates) {
          updateData.pinned = updates.pinned;
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        result = await prisma.workItem.updateMany({
          where: {
            id: { in: ids },
            userId,
          },
          data: updateData,
        });

        console.log(`[POST /work/bulk] Updated ${result.count} work items with:`, updateData);
        return NextResponse.json({ success: true, updated: result.count });
      }

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('[POST /work/bulk] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to perform bulk operation', details: errorMessage }, { status: 500 });
  }
});
