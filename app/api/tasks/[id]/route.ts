import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';


// GET single task
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

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH update task
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

    // Verify ownership
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Handle dueAt update with proper null handling
    let updateDueAt = existingTask.dueAt;
    if ('dueAt' in data) {
      if (data.dueAt) {
        try {
          updateDueAt = new Date(data.dueAt);
          if (isNaN(updateDueAt.getTime())) {
            updateDueAt = null;
          }
        } catch (dateError) {
          updateDueAt = null;
        }
      } else {
        updateDueAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingTask.title,
        courseId: 'courseId' in data ? data.courseId : existingTask.courseId,
        dueAt: 'dueAt' in data ? updateDueAt : existingTask.dueAt,
        pinned: 'pinned' in data ? data.pinned : existingTask.pinned,
        checklist: 'checklist' in data ? data.checklist : existingTask.checklist,
        notes: 'notes' in data ? data.notes : existingTask.notes,
        links: 'links' in data ? (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })) : existingTask.links,
        status: 'status' in data ? data.status : existingTask.status,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE task
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
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If this is a recurring task, delete this instance and all future instances
    if (existingTask.recurringPatternId) {
      const now = new Date();
      console.log(`[DELETE /api/tasks/${id}] Deleting future instances of recurring pattern ${existingTask.recurringPatternId}`);

      // Delete this task and all future tasks for this pattern
      await prisma.task.deleteMany({
        where: {
          recurringPatternId: existingTask.recurringPatternId,
          dueAt: {
            gte: now,
          },
        },
      });

      // Mark the pattern as inactive so no new instances are generated
      await prisma.recurringPattern.update({
        where: { id: existingTask.recurringPatternId },
        data: { isActive: false },
      });
    } else {
      // For non-recurring tasks, just delete the single task
      await prisma.task.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
