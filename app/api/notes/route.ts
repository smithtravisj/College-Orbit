import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { extractPlainText } from '@/lib/tiptapUtils';
import { checkFeatureLimit } from '@/lib/subscription';

// GET all notes for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deadline: { select: { id: true, title: true } },
        exam: { select: { id: true, title: true } },
        workItem: { select: { id: true, title: true, type: true } },
        recurringTaskPattern: { select: { id: true, taskTemplate: true } },
        recurringDeadlinePattern: { select: { id: true, deadlineTemplate: true } },
        recurringExamPattern: { select: { id: true, examTemplate: true } },
        recurringWorkPattern: { select: { id: true, workItemTemplate: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to load notes' },
      { status: 500 }
    );
  }
});

// POST create new note
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Check notes limit for free users
    const limitCheck = await checkFeatureLimit(userId, 'notes');
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: limitCheck.message },
        { status: 403 }
      );
    }

    const data = await req.json();

    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate foreign key references exist
    if (data.taskId) {
      const task = await prisma.task.findFirst({ where: { id: data.taskId, userId } });
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 400 });
      }
    }
    if (data.deadlineId) {
      const deadline = await prisma.deadline.findFirst({ where: { id: data.deadlineId, userId } });
      if (!deadline) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 400 });
      }
    }
    if (data.recurringTaskPatternId) {
      const pattern = await prisma.recurringPattern.findFirst({ where: { id: data.recurringTaskPatternId, userId } });
      if (!pattern) {
        return NextResponse.json({ error: 'Recurring task pattern not found' }, { status: 400 });
      }
    }
    if (data.recurringDeadlinePatternId) {
      const pattern = await prisma.recurringDeadlinePattern.findFirst({ where: { id: data.recurringDeadlinePatternId, userId } });
      if (!pattern) {
        return NextResponse.json({ error: 'Recurring assignment pattern not found' }, { status: 400 });
      }
    }
    if (data.examId) {
      const exam = await prisma.exam.findFirst({ where: { id: data.examId, userId } });
      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 400 });
      }
    }
    if (data.recurringExamPatternId) {
      const pattern = await prisma.recurringExamPattern.findFirst({ where: { id: data.recurringExamPatternId, userId } });
      if (!pattern) {
        return NextResponse.json({ error: 'Recurring exam pattern not found' }, { status: 400 });
      }
    }
    if (data.workItemId) {
      const workItem = await prisma.workItem.findFirst({ where: { id: data.workItemId, userId } });
      if (!workItem) {
        return NextResponse.json({ error: 'Work item not found' }, { status: 400 });
      }
    }
    if (data.recurringWorkPatternId) {
      const pattern = await prisma.recurringWorkPattern.findFirst({ where: { id: data.recurringWorkPatternId, userId } });
      if (!pattern) {
        return NextResponse.json({ error: 'Recurring work pattern not found' }, { status: 400 });
      }
    }

    // Extract plain text from rich text content for search
    const plainText = extractPlainText(data.content);

    const note = await prisma.note.create({
      data: {
        userId,
        title: data.title.trim(),
        content: data.content || { type: 'doc', content: [] },
        plainText,
        folderId: data.folderId || null,
        courseId: data.courseId || null,
        taskId: data.taskId || null,
        deadlineId: data.deadlineId || null,
        examId: data.examId || null,
        workItemId: data.workItemId || null,
        recurringTaskPatternId: data.recurringTaskPatternId || null,
        recurringDeadlinePatternId: data.recurringDeadlinePatternId || null,
        recurringExamPatternId: data.recurringExamPatternId || null,
        recurringWorkPatternId: data.recurringWorkPatternId || null,
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        links: (data.links || [])
          .filter((l: any) => l.url)
          .map((l: any) => ({
            label: l.label || new URL(l.url).hostname,
            url: l.url.startsWith('http') ? l.url : `https://${l.url}`,
          })),
        files: data.files || [],
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deadline: { select: { id: true, title: true } },
        exam: { select: { id: true, title: true } },
        workItem: { select: { id: true, title: true, type: true } },
        recurringTaskPattern: { select: { id: true, taskTemplate: true } },
        recurringDeadlinePattern: { select: { id: true, deadlineTemplate: true } },
        recurringExamPattern: { select: { id: true, examTemplate: true } },
        recurringWorkPattern: { select: { id: true, workItemTemplate: true } },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
});
