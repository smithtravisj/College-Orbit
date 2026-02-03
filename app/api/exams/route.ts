import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all exams for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const exams = await prisma.exam.findMany({
      where: { userId: token.id },
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
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

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
        userId: token.id,
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
