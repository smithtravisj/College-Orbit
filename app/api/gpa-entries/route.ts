import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET all GPA entries for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.gpaEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching GPA entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GPA entries' },
      { status: 500 }
    );
  }
}

// POST create new GPA entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const entry = await prisma.gpaEntry.create({
      data: {
        userId: session.user.id,
        courseId: data.courseId || null,
        courseName: data.courseName,
        grade: data.grade,
        credits: parseFloat(data.credits),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating GPA entry:', error);
    return NextResponse.json(
      { error: 'Failed to create GPA entry' },
      { status: 500 }
    );
  }
}
