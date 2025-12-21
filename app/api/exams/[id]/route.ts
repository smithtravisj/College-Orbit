import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET single exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const exam = await prisma.exam.findFirst({
      where: {
        id,
        userId: token.id,
      },
      include: {
        course: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PATCH update exam
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
    const existingExam = await prisma.exam.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Handle examAt update
    let updateExamAt = existingExam.examAt;
    if ('examAt' in data && data.examAt) {
      try {
        updateExamAt = new Date(data.examAt);
        if (isNaN(updateExamAt.getTime())) {
          updateExamAt = existingExam.examAt;
        }
      } catch (dateError) {
        updateExamAt = existingExam.examAt;
      }
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingExam.title,
        courseId: 'courseId' in data ? data.courseId : existingExam.courseId,
        examAt: updateExamAt,
        location: 'location' in data ? data.location : existingExam.location,
        notes: 'notes' in data ? data.notes : existingExam.notes,
        links: 'links' in data ? (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })) : existingExam.links,
        status: 'status' in data ? data.status : existingExam.status,
      },
      include: {
        course: true,
      },
    });

    // If exam time changed significantly (>1 hour), delete old reminders
    if (Math.abs(updateExamAt.getTime() - existingExam.examAt.getTime()) > 3600000) {
      await prisma.examReminder.deleteMany({
        where: { examId: id },
      });
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingExam = await prisma.exam.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    await prisma.exam.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
