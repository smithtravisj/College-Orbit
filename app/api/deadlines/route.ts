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

    const deadline = await prisma.deadline.create({
      data: {
        userId: session.user.id,
        title: data.title.trim(),
        courseId: data.courseId || null,
        dueAt: dueAt,
        notes: data.notes || '',
        link: data.link || null,
        status: data.status || 'open',
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
}
