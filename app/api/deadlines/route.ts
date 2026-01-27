import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { generateAllUserRecurringDeadlineInstances } from '@/lib/recurringDeadlineUtils';
import { generateRecurringDeadlineInstances } from '@/lib/recurringDeadlineUtils';
import { checkPremiumAccess } from '@/lib/subscription';

// GET all deadlines for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    console.log('[GET /api/deadlines] userId:', userId || 'null');

    if (!userId) {
      console.log('[GET /api/deadlines] No user ID, returning 401');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    console.log('[GET /api/deadlines] Authorized user:', userId);

    // Get query parameters
    const url = new URL(request.url);
    const showAll = url.searchParams.get('showAll') === 'true'; // For calendar view
    const windowDays = showAll ? 365 : 60; // Generate 1 year for calendar, 60 days for deadline view

    // Generate recurring deadline instances before fetching
    try {
      await generateAllUserRecurringDeadlineInstances(userId, windowDays);
    } catch (genError) {
      console.error('[GET /api/deadlines] Error generating recurring instances:', genError);
      // Continue even if generation fails
    }

    const allDeadlines = await prisma.deadline.findMany({
      where: { userId: userId },
      orderBy: [
        { instanceDate: 'asc' }, // For recurring deadlines, order by instance date
        { dueAt: 'asc' }, // For other deadlines, order by due date
        { createdAt: 'desc' }, // Fallback to creation date
      ],
      include: { recurringPattern: true },
    });

    // If showAll is true, return all deadlines (for calendar/detailed views)
    if (showAll) {
      console.log('[GET /api/deadlines] showAll=true, returning', allDeadlines.length, 'total deadlines');
      const recurringCount = allDeadlines.filter(d => d.isRecurring).length;
      console.log('[GET /api/deadlines] Recurring deadlines:', recurringCount);
      return NextResponse.json({ deadlines: allDeadlines });
    }

    // Filter to show only the next occurrence of each recurring pattern (only for open deadlines)
    // For completed deadlines, show all of them
    const recurringPatternMap = new Map<string, typeof allDeadlines[0]>();
    const filteredDeadlines = allDeadlines.filter((deadline) => {
      // Keep non-recurring deadlines
      if (!deadline.recurringPatternId) {
        return true;
      }

      // For completed deadlines, show all instances
      if (deadline.status === 'done') {
        return true;
      }

      // For open recurring deadlines, keep the first occurrence (next OR overdue)
      if (!recurringPatternMap.has(deadline.recurringPatternId)) {
        recurringPatternMap.set(deadline.recurringPatternId, deadline);
        return true;
      }

      return false;
    });

    return NextResponse.json({ deadlines: filteredDeadlines });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your deadlines. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new deadline
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();
    console.log('[POST /deadlines] Request body:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      console.error('[POST /deadlines] Missing title');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Handle dueAt - only convert to Date if it's not null/undefined
    let dueAt: Date | null = null;
    if (data.dueAt) {
      try {
        dueAt = new Date(data.dueAt);
        // Validate it's a valid date (not epoch)
        if (isNaN(dueAt.getTime())) {
          console.warn('[POST /deadlines] Invalid date received:', data.dueAt);
          dueAt = null;
        } else {
          console.log('[POST /deadlines] Valid dueAt:', dueAt.toISOString());
        }
      } catch (dateError) {
        console.error('[POST /deadlines] Date parsing error:', dateError);
        dueAt = null;
      }
    } else {
      console.log('[POST /deadlines] No dueAt provided, setting to null');
    }

    console.log('[POST /deadlines] Final dueAt value:', dueAt);

    // Check if this is a recurring deadline
    if (data.recurring) {
      // Recurring deadlines require premium
      const premiumCheck = await checkPremiumAccess(userId);
      if (!premiumCheck.allowed) {
        return NextResponse.json(
          { error: 'premium_required', message: 'Recurring assignments are a Premium feature. Upgrade to create recurring assignments.' },
          { status: 403 }
        );
      }

      const pattern = await prisma.recurringDeadlinePattern.create({
        data: {
          userId: userId,
          recurrenceType: data.recurring.recurrenceType,
          intervalDays: data.recurring.recurrenceType === 'custom' ? data.recurring.customIntervalDays : null,
          daysOfWeek: data.recurring.recurrenceType === 'weekly' ? data.recurring.daysOfWeek : [],
          daysOfMonth: data.recurring.recurrenceType === 'monthly' ? data.recurring.daysOfMonth : [],
          startDate: data.recurring.startDate ? new Date(data.recurring.startDate) : null,
          endDate: data.recurring.endCondition === 'date' ? new Date(data.recurring.endDate) : null,
          occurrenceCount: data.recurring.endCondition === 'count' ? data.recurring.occurrenceCount : null,
          deadlineTemplate: {
            title: data.title.trim(),
            courseId: data.courseId || null,
            notes: data.notes || '',
            tags: data.tags || [],
            links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
              label: l.label || new URL(l.url).hostname,
              url: l.url,
            })),
            effort: data.effort || null,
          },
        },
      });

      // Generate initial instances
      try {
        await generateRecurringDeadlineInstances({
          patternId: pattern.id,
          userId: userId,
          windowDays: 365,
        });
        console.log('[POST /deadlines] Recurring deadline pattern created successfully:', pattern.id);
      } catch (genError) {
        console.error('[POST /deadlines] Error generating instances:', genError);
        // Delete the pattern if instance generation fails
        await prisma.recurringDeadlinePattern.delete({ where: { id: pattern.id } });
        throw new Error(`Failed to generate deadline instances: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
      }

      return NextResponse.json({ patternId: pattern.id }, { status: 201 });
    }

    const deadline = await prisma.deadline.create({
      data: {
        userId: userId,
        title: data.title.trim(),
        courseId: data.courseId || null,
        dueAt: dueAt,
        priority: data.priority || null,
        effort: data.effort || null,
        notes: data.notes || '',
        tags: data.tags || [],
        links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })),
        files: (data.files || []).filter((f: any) => f.url).map((f: any) => ({
          name: f.name,
          url: f.url,
          size: f.size || 0,
        })),
        status: data.status || 'open',
        isRecurring: false,
      },
    });

    console.log('[POST /deadlines] Deadline created successfully:', deadline.id);
    return NextResponse.json({ deadline }, { status: 201 });
  } catch (error) {
    console.error('[POST /deadlines] Error creating deadline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create deadline', details: errorMessage },
      { status: 500 }
    );
  }
});
