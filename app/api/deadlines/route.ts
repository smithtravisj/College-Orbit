import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET all deadlines for authenticated user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deadlines = await prisma.deadline.findMany({
      where: { userId: session.user.id },
      orderBy: { dueAt: 'asc' },
    });

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deadlines' },
      { status: 500 }
    );
  }
}

// POST create new deadline
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const deadline = await prisma.deadline.create({
      data: {
        userId: session.user.id,
        title: data.title,
        courseId: data.courseId || null,
        dueAt: new Date(data.dueAt),
        notes: data.notes || '',
        link: data.link || null,
        status: data.status || 'open',
      },
    });

    return NextResponse.json({ deadline }, { status: 201 });
  } catch (error) {
    console.error('Error creating deadline:', error);
    return NextResponse.json(
      { error: 'Failed to create deadline' },
      { status: 500 }
    );
  }
}
