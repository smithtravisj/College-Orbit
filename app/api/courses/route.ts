import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all courses for authenticated user
export const GET = withRateLimit(async function(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    const course = await prisma.course.create({
      data: {
        userId: session.user.id,
        code: data.code,
        name: data.name,
        term: data.term,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        meetingTimes: data.meetingTimes || [],
        links: data.links || [],
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
