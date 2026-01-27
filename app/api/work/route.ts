import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { generateAllUserRecurringWorkInstances } from '@/lib/recurringWorkUtils';
import { checkPremiumAccess } from '@/lib/subscription';

// Valid work item types
const VALID_TYPES = ['task', 'assignment', 'reading', 'project'] as const;
type WorkItemType = (typeof VALID_TYPES)[number];

// Valid priorities
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

// GET all work items for authenticated user
export const GET = withRateLimit(async function (request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    console.log('[GET /api/work] userId:', userId || 'null');

    if (!userId) {
      console.log('[GET /api/work] No user ID, returning 401');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    console.log('[GET /api/work] Authorized user:', userId);

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type') as WorkItemType | null;
    const showAll = url.searchParams.get('showAll') === 'true'; // For calendar view
    const windowDays = showAll ? 365 : 60; // Generate 1 year for calendar, 60 days for work view

    // Validate type parameter if provided
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate recurring instances before fetching work items
    try {
      await generateAllUserRecurringWorkInstances(userId, windowDays);
    } catch (genError) {
      console.error('[GET /api/work] Error generating recurring instances:', genError);
      // Continue even if generation fails
    }

    // Build where clause
    const whereClause: any = {
      userId: userId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    // Fetch all work items with their recurring patterns
    const allWorkItems = await prisma.workItem.findMany({
      where: whereClause,
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
      orderBy: [
        { pinned: 'desc' },
        { instanceDate: 'asc' }, // For recurring items, order by instance date
        { dueAt: 'asc' }, // For other items, order by due date
        { createdAt: 'desc' }, // Fallback to creation date
      ],
    });

    // If showAll is true, return all work items (for calendar/detailed views)
    if (showAll) {
      console.log('[GET /api/work] showAll=true, returning', allWorkItems.length, 'total work items');
      const recurringCount = allWorkItems.filter((w) => w.isRecurring).length;
      console.log('[GET /api/work] Recurring items:', recurringCount);
      return NextResponse.json({ workItems: allWorkItems });
    }

    // Filter to show only the next occurrence of each recurring pattern (only for open items)
    // For completed items, show all of them
    const recurringPatternMap = new Map<string, (typeof allWorkItems)[0]>();
    const filteredWorkItems = allWorkItems.filter((item) => {
      // Keep non-recurring items
      if (!item.recurringPatternId) {
        return true;
      }

      // For completed items, show all instances
      if (item.status === 'done') {
        return true;
      }

      // For open recurring items, keep the first occurrence (next OR overdue)
      if (!recurringPatternMap.has(item.recurringPatternId)) {
        recurringPatternMap.set(item.recurringPatternId, item);
        return true;
      }

      return false;
    });

    return NextResponse.json({ workItems: filteredWorkItems });
  } catch (error) {
    console.error('Error fetching work items:', error);
    return NextResponse.json(
      { error: "We couldn't load your work items. Please check your connection and try again." },
      { status: 500 }
    );
  }
});

// POST create new work item
export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();
    console.log('[POST /work] Request body:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      console.error('[POST /work] Missing title');
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate type
    const type = data.type || 'task';
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle recurring work item creation
    if (data.recurring) {
      // Recurring items require premium
      const premiumCheck = await checkPremiumAccess(userId);
      if (!premiumCheck.allowed) {
        return NextResponse.json(
          {
            error: 'premium_required',
            message: 'Recurring work items are a Premium feature. Upgrade to create recurring items.',
          },
          { status: 403 }
        );
      }

      try {
        // Create recurring pattern
        const pattern = await prisma.recurringWorkPattern.create({
          data: {
            userId: userId,
            recurrenceType: data.recurring.recurrenceType,
            intervalDays: data.recurring.customIntervalDays || null,
            daysOfWeek: data.recurring.daysOfWeek || [],
            daysOfMonth: data.recurring.daysOfMonth || [],
            startDate:
              data.recurring.startDate && data.recurring.startDate.trim()
                ? new Date(data.recurring.startDate)
                : null,
            endDate:
              data.recurring.endDate && data.recurring.endDate.trim()
                ? new Date(data.recurring.endDate)
                : null,
            occurrenceCount:
              data.recurring.endCondition === 'count' && data.recurring.occurrenceCount > 0
                ? data.recurring.occurrenceCount
                : null,
            workItemTemplate: {
              title: data.title.trim(),
              type: type,
              courseId: data.courseId || null,
              notes: data.notes || '',
              tags: data.tags || [],
              links: (data.links || [])
                .filter((l: any) => l.url)
                .map((l: any) => ({
                  label: l.label || new URL(l.url).hostname,
                  url: l.url,
                })),
              dueTime: data.recurring.dueTime || '23:59',
              priority: data.priority || null,
              effort: data.effort || null,
              pinned: data.pinned || false,
              checklist: data.checklist || [],
            },
            isActive: true,
          },
        });

        // Generate initial instances
        const { generateRecurringWorkInstances } = await import('@/lib/recurringWorkUtils');
        await generateRecurringWorkInstances({
          patternId: pattern.id,
          userId: userId,
        });

        // Fetch first work item to return
        const firstItem = await prisma.workItem.findFirst({
          where: { recurringPatternId: pattern.id },
          orderBy: { instanceDate: 'asc' },
          include: {
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

        return NextResponse.json({ workItem: firstItem, patternId: pattern.id }, { status: 201 });
      } catch (error) {
        console.error('[POST /work] Error creating recurring work item:', error);
        return NextResponse.json(
          {
            error: `Failed to create recurring work item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
          { status: 500 }
        );
      }
    }

    // Handle regular work item creation
    let dueAt: Date | null = null;
    if (data.dueAt) {
      try {
        dueAt = new Date(data.dueAt);
        // Validate it's a valid date (not epoch)
        if (isNaN(dueAt.getTime())) {
          console.warn('[POST /work] Invalid date received:', data.dueAt);
          dueAt = null;
        } else {
          console.log('[POST /work] Valid dueAt:', dueAt.toISOString());
        }
      } catch (dateError) {
        console.error('[POST /work] Date parsing error:', dateError);
        dueAt = null;
      }
    }

    const workItem = await prisma.workItem.create({
      data: {
        userId: userId,
        title: data.title.trim(),
        type: type,
        courseId: data.courseId || null,
        dueAt: dueAt,
        priority: data.priority || null,
        effort: data.effort || null,
        pinned: data.pinned || false,
        checklist: data.checklist || [],
        notes: data.notes || '',
        tags: data.tags || [],
        links: (data.links || [])
          .filter((l: any) => l.url)
          .map((l: any) => ({
            label: l.label || new URL(l.url).hostname,
            url: l.url,
          })),
        files: (data.files || [])
          .filter((f: any) => f.url)
          .map((f: any) => ({
            name: f.name,
            url: f.url,
            size: f.size || 0,
          })),
        status: data.status || 'open',
        workingOn: data.workingOn || false,
        isRecurring: false,
        recurringPatternId: null,
        instanceDate: null,
      },
      include: {
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

    console.log('[POST /work] Work item created successfully:', workItem.id);
    return NextResponse.json({ workItem }, { status: 201 });
  } catch (error) {
    console.error('[POST /work] Error creating work item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create work item', details: errorMessage }, { status: 500 });
  }
});
