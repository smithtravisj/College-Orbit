import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';

// GET single course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH update course
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership
    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        code: data.code ?? existingCourse.code,
        name: data.name ?? existingCourse.name,
        term: data.term ?? existingCourse.term,
        credits: data.credits !== undefined ? data.credits : existingCourse.credits,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : existingCourse.startDate,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existingCourse.endDate,
        meetingTimes: data.meetingTimes ?? existingCourse.meetingTimes,
        links: data.links ?? existingCourse.links,
        files: data.files ?? (existingCourse.files as any) ?? [],
        colorTag: data.colorTag ?? existingCourse.colorTag,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and get Canvas ID if present
    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        canvasCourseId: true,
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // If this is a Canvas course, track the deletion to prevent re-sync
    if (existingCourse.canvasCourseId) {
      await prisma.deletedCanvasItem.upsert({
        where: {
          userId_canvasId_type: {
            userId,
            canvasId: existingCourse.canvasCourseId,
            type: 'course',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId,
          canvasId: existingCourse.canvasCourseId,
          type: 'course',
        },
      });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
