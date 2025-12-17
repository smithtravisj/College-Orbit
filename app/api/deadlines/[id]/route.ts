import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET single deadline
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deadline });
  } catch (error) {
    console.error('Error fetching deadline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deadline' },
      { status: 500 }
    );
  }
}

// PATCH update deadline
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    console.log('[PATCH /deadlines/:id] ID:', id);
    console.log('[PATCH /deadlines/:id] Request body:', JSON.stringify(data, null, 2));

    // Verify ownership
    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDeadline) {
      console.error('[PATCH /deadlines/:id] Deadline not found:', id);
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    // Handle dueAt update with proper null handling
    let updateDueAt = existingDeadline.dueAt;
    if ('dueAt' in data) {
      console.log('[PATCH /deadlines/:id] dueAt in data, value:', data.dueAt);
      if (data.dueAt) {
        try {
          updateDueAt = new Date(data.dueAt);
          if (isNaN(updateDueAt.getTime())) {
            console.warn('[PATCH /deadlines/:id] Invalid date received:', data.dueAt);
            updateDueAt = null;
          } else {
            console.log('[PATCH /deadlines/:id] Valid dueAt:', updateDueAt.toISOString());
          }
        } catch (dateError) {
          console.error('[PATCH /deadlines/:id] Date parsing error:', dateError);
          updateDueAt = null;
        }
      } else {
        console.log('[PATCH /deadlines/:id] dueAt is null/empty, clearing');
        updateDueAt = null;
      }
    }

    const deadline = await prisma.deadline.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingDeadline.title,
        courseId: 'courseId' in data ? data.courseId : existingDeadline.courseId,
        dueAt: 'dueAt' in data ? updateDueAt : existingDeadline.dueAt,
        notes: 'notes' in data ? data.notes : existingDeadline.notes,
        link: 'link' in data ? data.link : existingDeadline.link,
        status: 'status' in data ? data.status : existingDeadline.status,
      },
    });

    console.log('[PATCH /deadlines/:id] Deadline updated successfully:', deadline.id);
    console.log('[PATCH /deadlines/:id] Final dueAt:', deadline.dueAt);
    return NextResponse.json({ deadline });
  } catch (error) {
    console.error('[PATCH /deadlines/:id] Error updating deadline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update deadline', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE deadline
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    await prisma.deadline.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Failed to delete deadline' },
      { status: 500 }
    );
  }
}
