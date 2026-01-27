import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkFeatureLimit } from '@/lib/subscription';

// GET all courses for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your courses. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new course
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Check courses limit for free users
    const limitCheck = await checkFeatureLimit(userId, 'courses');
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: limitCheck.message },
        { status: 403 }
      );
    }

    const data = await req.json();

    const course = await prisma.course.create({
      data: {
        userId: userId,
        code: data.code,
        name: data.name,
        term: data.term,
        credits: data.credits ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        meetingTimes: data.meetingTimes || [],
        links: data.links || [],
        files: data.files || [],
        colorTag: data.colorTag,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create course', details: errorMessage },
      { status: 500 }
    );
  }
});
