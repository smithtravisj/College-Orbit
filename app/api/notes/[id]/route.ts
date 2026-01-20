import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { extractPlainText } from '@/lib/tiptapUtils';

// GET single note
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const note = await prisma.note.findFirst({
      where: { id, userId: token.id },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deadline: { select: { id: true, title: true } },
        exam: { select: { id: true, title: true } },
        recurringTaskPattern: { select: { id: true, taskTemplate: true } },
        recurringDeadlinePattern: { select: { id: true, deadlineTemplate: true } },
        recurringExamPattern: { select: { id: true, examTemplate: true } },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// PATCH update note
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
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: token.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Extract plain text from content if provided
    const plainText = 'content' in data ? extractPlainText(data.content) : existingNote.plainText;

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingNote.title,
        content: 'content' in data ? data.content : existingNote.content,
        plainText,
        folderId: 'folderId' in data ? data.folderId : existingNote.folderId,
        courseId: 'courseId' in data ? data.courseId : existingNote.courseId,
        taskId: 'taskId' in data ? data.taskId : existingNote.taskId,
        deadlineId: 'deadlineId' in data ? data.deadlineId : existingNote.deadlineId,
        examId: 'examId' in data ? data.examId : existingNote.examId,
        recurringTaskPatternId: 'recurringTaskPatternId' in data ? data.recurringTaskPatternId : existingNote.recurringTaskPatternId,
        recurringDeadlinePatternId: 'recurringDeadlinePatternId' in data ? data.recurringDeadlinePatternId : existingNote.recurringDeadlinePatternId,
        recurringExamPatternId: 'recurringExamPatternId' in data ? data.recurringExamPatternId : existingNote.recurringExamPatternId,
        tags: 'tags' in data ? data.tags : existingNote.tags,
        isPinned: 'isPinned' in data ? data.isPinned : existingNote.isPinned,
        links:
          'links' in data
            ? (data.links || [])
                .filter((l: any) => l.url)
                .map((l: any) => ({
                  label: l.label || new URL(l.url).hostname,
                  url: l.url.startsWith('http') ? l.url : `https://${l.url}`,
                }))
            : existingNote.links,
        files: 'files' in data ? data.files : existingNote.files,
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deadline: { select: { id: true, title: true } },
        exam: { select: { id: true, title: true } },
        recurringTaskPattern: { select: { id: true, taskTemplate: true } },
        recurringDeadlinePattern: { select: { id: true, deadlineTemplate: true } },
        recurringExamPattern: { select: { id: true, examTemplate: true } },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: token.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
