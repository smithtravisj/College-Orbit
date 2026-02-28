import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { generateAllUserRecurringExamInstances } from '@/lib/recurringExamUtils';
import { checkPremiumAccess } from '@/lib/subscription';

// GET all exams for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Generate recurring exam instances before fetching
    try {
      await generateAllUserRecurringExamInstances(userId);
    } catch (genError) {
      console.error('[GET /api/exams] Error generating recurring instances:', genError);
    }

    const exams = await prisma.exam.findMany({
      where: { userId },
      orderBy: { examAt: 'asc' },
      include: {
        course: true,
      },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to load exams' },
      { status: 500 }
    );
  }
});

// POST create new exam
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Handle recurring exam creation
    if (data.recurring) {
      const premiumCheck = await checkPremiumAccess(userId);
      if (!premiumCheck.allowed) {
        return NextResponse.json(
          {
            error: 'premium_required',
            message: 'Recurring exams are a Premium feature. Upgrade to create recurring exams.',
          },
          { status: 403 }
        );
      }

      try {
        // Build examAt for the template (used for time extraction)
        let templateExamAt: string | null = null;
        if (data.recurring.examTime && data.recurring.examTime.trim()) {
          const [hours, minutes] = data.recurring.examTime.split(':').map(Number);
          const tempDate = new Date();
          tempDate.setHours(hours, minutes, 0, 0);
          templateExamAt = tempDate.toISOString();
        } else if (data.examAt) {
          templateExamAt = data.examAt;
        }

        const pattern = await prisma.recurringExamPattern.create({
          data: {
            userId,
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
            examTemplate: {
              title: data.title.trim(),
              courseId: data.courseId || null,
              notes: data.notes || '',
              tags: data.tags || [],
              links: (data.links || [])
                .filter((l: any) => l.url)
                .map((l: any) => ({
                  label: l.label || '',
                  url: l.url,
                })),
              location: data.location || null,
              examAt: templateExamAt,
            },
            isActive: true,
          },
        });

        // Generate initial instances
        const { generateRecurringExamInstances } = await import('@/lib/recurringExamUtils');
        await generateRecurringExamInstances({
          patternId: pattern.id,
          userId,
        });

        // Fetch first exam to return
        const firstExam = await prisma.exam.findFirst({
          where: { recurringPatternId: pattern.id },
          orderBy: { instanceDate: 'asc' },
          include: { course: true },
        });

        return NextResponse.json({ exam: firstExam, patternId: pattern.id }, { status: 201 });
      } catch (error) {
        console.error('[POST /exams] Error creating recurring exam:', error);
        return NextResponse.json(
          { error: 'Failed to create recurring exam' },
          { status: 500 }
        );
      }
    }

    // Regular (non-recurring) exam creation
    if (!data.examAt) {
      return NextResponse.json({ error: 'Exam date and time is required' }, { status: 400 });
    }

    // Parse examAt
    let examAt: Date;
    try {
      examAt = new Date(data.examAt);
      if (isNaN(examAt.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (dateError) {
      return NextResponse.json({ error: 'Invalid exam date/time' }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        userId,
        title: data.title.trim(),
        courseId: data.courseId || null,
        examAt: examAt,
        location: data.location || null,
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
        status: data.status || 'scheduled',
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
});
