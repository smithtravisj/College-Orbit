import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import type { AppData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: AppData = await req.json();
    const userId = session.user.id;

    // Create courses
    if (data.courses && data.courses.length > 0) {
      await prisma.course.createMany({
        data: data.courses.map((course) => ({
          id: course.id,
          userId,
          code: course.code,
          name: course.name,
          term: course.term,
          meetingTimes: course.meetingTimes,
          links: course.links,
          colorTag: course.colorTag,
        })),
      });
    }

    // Create deadlines
    if (data.deadlines && data.deadlines.length > 0) {
      await prisma.deadline.createMany({
        data: data.deadlines.map((deadline) => ({
          id: deadline.id,
          userId,
          title: deadline.title,
          courseId: deadline.courseId || null,
          dueAt: deadline.dueAt ? new Date(deadline.dueAt) : null,
          notes: deadline.notes,
          links: deadline.links || [],
          status: deadline.status,
          createdAt: new Date(deadline.createdAt),
        })),
      });
    }

    // Create tasks
    if (data.tasks && data.tasks.length > 0) {
      await prisma.task.createMany({
        data: data.tasks.map((task) => ({
          id: task.id,
          userId,
          title: task.title,
          courseId: task.courseId || null,
          dueAt: task.dueAt ? new Date(task.dueAt) : null,
          pinned: task.pinned,
          checklist: task.checklist,
          notes: task.notes,
          links: task.links || [],
          status: task.status,
          createdAt: new Date(task.createdAt),
        })),
      });
    }

    // Update settings if they exist
    if (data.settings) {
      await prisma.settings.update({
        where: { userId },
        data: {
          weekStartsOn: data.settings.weekStartsOn,
          theme: data.settings.theme,
          enableNotifications: data.settings.enableNotifications,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate data' },
      { status: 500 }
    );
  }
}
