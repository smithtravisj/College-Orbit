import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';

// Valid priorities
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

// GET single work item
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId(_request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workItem = await prisma.workItem.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        recurringPattern: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            colorTag: true,
          },
        },
      },
    });

    if (!workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    return NextResponse.json({ workItem });
  } catch (error) {
    console.error('Error fetching work item:', error);
    return NextResponse.json({ error: 'Failed to fetch work item' }, { status: 500 });
  }
}

// PATCH update work item
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    console.log('[PATCH /work/:id] ID:', id);
    console.log('[PATCH /work/:id] Request body:', JSON.stringify(data, null, 2));

    // Verify ownership
    const existingItem = await prisma.workItem.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingItem) {
      console.error('[PATCH /work/:id] Work item not found:', id);
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // Validate priority if provided
    if ('priority' in data && data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle dueAt update with proper null handling
    let updateDueAt = existingItem.dueAt;
    if ('dueAt' in data) {
      console.log('[PATCH /work/:id] dueAt in data, value:', data.dueAt);
      if (data.dueAt) {
        try {
          updateDueAt = new Date(data.dueAt);
          if (isNaN(updateDueAt.getTime())) {
            console.warn('[PATCH /work/:id] Invalid date received:', data.dueAt);
            updateDueAt = null;
          } else {
            console.log('[PATCH /work/:id] Valid dueAt:', updateDueAt.toISOString());
          }
        } catch (dateError) {
          console.error('[PATCH /work/:id] Date parsing error:', dateError);
          updateDueAt = null;
        }
      } else {
        console.log('[PATCH /work/:id] dueAt is null/empty, clearing');
        updateDueAt = null;
      }
    }

    const workItem = await prisma.workItem.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingItem.title,
        type: 'type' in data ? data.type : existingItem.type,
        courseId: 'courseId' in data ? data.courseId : existingItem.courseId,
        dueAt: 'dueAt' in data ? updateDueAt : existingItem.dueAt,
        priority: 'priority' in data ? data.priority || null : existingItem.priority,
        effort: 'effort' in data ? data.effort || null : existingItem.effort,
        pinned: 'pinned' in data ? data.pinned : existingItem.pinned,
        checklist: 'checklist' in data ? data.checklist : existingItem.checklist,
        notes: 'notes' in data ? data.notes : existingItem.notes,
        tags: 'tags' in data ? data.tags : existingItem.tags,
        links:
          'links' in data
            ? (data.links || [])
                .filter((l: any) => l.url)
                .map((l: any) => {
                  let label = l.label;
                  if (!label) {
                    try {
                      label = new URL(l.url).hostname;
                    } catch {
                      label = l.url;
                    }
                  }
                  return { label, url: l.url };
                })
            : existingItem.links,
        files:
          'files' in data
            ? (data.files || [])
                .filter((f: any) => f.url)
                .map((f: any) => ({
                  name: f.name,
                  url: f.url,
                  size: f.size || 0,
                }))
            : (existingItem.files as any) || [],
        status: 'status' in data ? data.status : existingItem.status,
        workingOn: 'workingOn' in data ? data.workingOn : existingItem.workingOn,
      },
      include: {
        recurringPattern: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            colorTag: true,
          },
        },
      },
    });

    console.log('[PATCH /work/:id] Work item updated successfully:', workItem.id);
    console.log('[PATCH /work/:id] Final dueAt:', workItem.dueAt);
    return NextResponse.json({ workItem });
  } catch (error) {
    console.error('[PATCH /work/:id] Error updating work item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update work item', details: errorMessage }, { status: 500 });
  }
}

// DELETE work item
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId(_request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and get details
    const existingItem = await prisma.workItem.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        recurringPatternId: true,
        canvasAssignmentId: true,
        googleCalendarEventId: true,
        dueAt: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    // If this is a Canvas assignment, track the deletion to prevent re-sync
    if (existingItem.canvasAssignmentId) {
      await prisma.deletedCanvasItem.upsert({
        where: {
          userId_canvasId_type: {
            userId,
            canvasId: existingItem.canvasAssignmentId,
            type: 'assignment',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId,
          canvasId: existingItem.canvasAssignmentId,
          type: 'assignment',
        },
      });
    }

    // If exported to Google Calendar, queue deletion from Google
    if (existingItem.googleCalendarEventId) {
      await prisma.deletedGoogleCalendarItem.upsert({
        where: {
          userId_googleEventId_type: {
            userId,
            googleEventId: existingItem.googleCalendarEventId,
            type: 'pending_google_delete',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId,
          googleEventId: existingItem.googleCalendarEventId,
          type: 'pending_google_delete',
        },
      });
    }

    // If this is a recurring item, delete all instances and deactivate the pattern
    if (existingItem.recurringPatternId) {
      console.log(
        `[DELETE /api/work/${id}] Deleting all instances of recurring pattern ${existingItem.recurringPatternId}`
      );

      // Delete all items for this pattern
      await prisma.workItem.deleteMany({
        where: {
          recurringPatternId: existingItem.recurringPatternId,
        },
      });

      // Mark the pattern as inactive so no new instances are generated
      await prisma.recurringWorkPattern.update({
        where: { id: existingItem.recurringPatternId },
        data: { isActive: false },
      });
    } else {
      // For non-recurring items, just delete the single item
      await prisma.workItem.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work item:', error);
    return NextResponse.json({ error: 'Failed to delete work item' }, { status: 500 });
  }
}
