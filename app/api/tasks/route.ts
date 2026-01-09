import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { generateAllUserRecurringInstances } from '@/lib/recurringTaskUtils';

// GET all tasks for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('[GET /api/tasks] Token:', token ? { userId: token.id, email: token.email } : 'null');

    if (!token?.id) {
      console.log('[GET /api/tasks] No user ID in token, returning 401');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    console.log('[GET /api/tasks] Authorized user:', token.id);

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const showAll = url.searchParams.get('showAll') === 'true'; // For calendar view
    const windowDays = showAll ? 365 : 60; // Generate 1 year for calendar, 60 days for task view

    // Generate recurring instances before fetching tasks
    try {
      await generateAllUserRecurringInstances(token.id, windowDays);
    } catch (genError) {
      console.error('[GET /api/tasks] Error generating recurring instances:', genError);
      // Continue even if generation fails
    }

    // Fetch all tasks with their recurring patterns
    const allTasks = await prisma.task.findMany({
      where: {
        userId: token.id,
        ...(status && { status }),
      },
      include: {
        recurringPattern: true,
      },
      orderBy: [
        { pinned: 'desc' },
        { instanceDate: 'asc' }, // For recurring tasks, order by instance date
        { dueAt: 'asc' }, // For other tasks, order by due date
        { createdAt: 'desc' }, // Fallback to creation date
      ],
    });

    // If showAll is true, return all tasks (for calendar/detailed views)
    if (showAll) {
      console.log('[GET /api/tasks] showAll=true, returning', allTasks.length, 'total tasks');
      const recurringCount = allTasks.filter(t => t.isRecurring).length;
      console.log('[GET /api/tasks] Recurring tasks:', recurringCount);
      return NextResponse.json({ tasks: allTasks });
    }

    // Filter to show only the next occurrence of each recurring pattern (only for open tasks)
    // For completed/done tasks, show all of them
    // Also show any overdue/past instances
    const recurringPatternMap = new Map<string, typeof allTasks[0]>();
    const filteredTasks = allTasks.filter((task) => {
      // Keep non-recurring tasks
      if (!task.recurringPatternId) {
        return true;
      }

      // For completed tasks, show all instances
      if (task.status === 'done') {
        return true;
      }

      // For open recurring tasks, keep the first occurrence (next OR overdue)
      if (!recurringPatternMap.has(task.recurringPatternId)) {
        recurringPatternMap.set(task.recurringPatternId, task);
        return true;
      }

      return false;
    });

    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your tasks. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new task
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    // Handle recurring task creation
    if (data.recurring) {
      try {
        // Create recurring pattern
        const pattern = await prisma.recurringPattern.create({
          data: {
            userId: token.id,
            recurrenceType: data.recurring.recurrenceType,
            intervalDays: data.recurring.customIntervalDays || null,
            daysOfWeek: data.recurring.daysOfWeek || [],
            daysOfMonth: data.recurring.daysOfMonth || [],
            startDate: data.recurring.startDate && data.recurring.startDate.trim() ? new Date(data.recurring.startDate) : null,
            endDate: data.recurring.endDate && data.recurring.endDate.trim() ? new Date(data.recurring.endDate) : null,
            occurrenceCount: data.recurring.occurrenceCount && data.recurring.occurrenceCount > 0 ? data.recurring.occurrenceCount : null,
            taskTemplate: {
              title: data.title,
              courseId: data.courseId || null,
              notes: data.notes || '',
              tags: data.tags || [],
              links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
                label: l.label || new URL(l.url).hostname,
                url: l.url,
              })),
              dueTime: data.recurring.dueTime || '23:59',
            },
            isActive: true,
          },
        });

        // Generate initial instances
        const { generateRecurringInstances } = await import('@/lib/recurringTaskUtils');
        await generateRecurringInstances({
          patternId: pattern.id,
          userId: token.id,
        });

        // Fetch first task to return
        const firstTask = await prisma.task.findFirst({
          where: { recurringPatternId: pattern.id },
          orderBy: { instanceDate: 'asc' },
        });

        return NextResponse.json({ task: firstTask, patternId: pattern.id }, { status: 201 });
      } catch (error) {
        console.error('Error creating recurring task:', error);
        return NextResponse.json(
          { error: `Failed to create recurring task: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // Handle regular task creation
    let dueAt: Date | null = null;
    if (data.dueAt) {
      try {
        dueAt = new Date(data.dueAt);
        // Validate it's a valid date (not epoch)
        if (isNaN(dueAt.getTime())) {
          dueAt = null;
        }
      } catch (dateError) {
        dueAt = null;
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: token.id,
        title: data.title,
        courseId: data.courseId || null,
        dueAt,
        pinned: data.pinned || false,
        importance: data.importance || null,
        checklist: data.checklist || [],
        notes: data.notes || '',
        tags: data.tags || [],
        links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })),
        status: data.status || 'open',
        isRecurring: false,
        recurringPatternId: null,
        instanceDate: null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
});
