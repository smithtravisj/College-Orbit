import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Delete work items with "demo" tag
    await prisma.workItem.deleteMany({
      where: {
        userId,
        tags: { equals: ['demo'] },
      },
    });

    // Delete exams with "demo" tag
    await prisma.exam.deleteMany({
      where: {
        userId,
        tags: { equals: ['demo'] },
      },
    });

    // Delete courses that no longer have any associated work items or exams
    // These are the demo courses that were created during signup
    const coursesWithItems = await prisma.course.findMany({
      where: { userId },
      select: {
        id: true,
        _count: {
          select: {
            workItems: true,
            exams: true,
            deadlines: true,
            tasks: true,
            notes: true,
          },
        },
      },
    });

    const emptyCourseIds = coursesWithItems
      .filter(c =>
        c._count.workItems === 0 &&
        c._count.exams === 0 &&
        c._count.deadlines === 0 &&
        c._count.tasks === 0 &&
        c._count.notes === 0
      )
      .map(c => c.id);

    if (emptyCourseIds.length > 0) {
      await prisma.course.deleteMany({
        where: {
          id: { in: emptyCourseIds },
          userId,
        },
      });
    }

    // Mark demo data as cleared
    await prisma.settings.update({
      where: { userId },
      data: { hasDemoData: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return NextResponse.json(
      { error: 'Failed to clear demo data' },
      { status: 500 }
    );
  }
}
