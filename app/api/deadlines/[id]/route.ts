import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';


// GET single deadline
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deadline = await prisma.deadline.findFirst({
      where: {
        id,
        userId: token.id,
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
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
        userId: token.id,
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
        links: 'links' in data ? (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })) : existingDeadline.links,
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
    const token = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingDeadline = await prisma.deadline.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    // If this is a recurring deadline, delete this instance and all future instances
    if (existingDeadline.recurringPatternId) {
      const now = new Date();
      console.log(`[DELETE /api/deadlines/${id}] Deleting future instances of recurring pattern ${existingDeadline.recurringPatternId}`);

      // Delete this deadline and all future deadlines for this pattern
      await prisma.deadline.deleteMany({
        where: {
          recurringPatternId: existingDeadline.recurringPatternId,
          dueAt: {
            gte: now,
          },
        },
      });

      // Mark the pattern as inactive so no new instances are generated
      await prisma.recurringDeadlinePattern.update({
        where: { id: existingDeadline.recurringPatternId },
        data: { isActive: false },
      });
    } else {
      // For non-recurring deadlines, just delete the single deadline
      await prisma.deadline.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Failed to delete deadline' },
      { status: 500 }
    );
  }
}
