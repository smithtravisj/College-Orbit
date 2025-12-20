import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all tasks for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('[GET /api/tasks] Token:', token ? { userId: token.id, email: token.email } : 'null');

    if (!token?.id) {
      console.log('[GET /api/tasks] No user ID in token, returning 401');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    console.log('[GET /api/tasks] Authorized user:', token.id);

    const tasks = await prisma.task.findMany({
      where: { userId: token.id },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your tasks. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new task
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    // Handle dueAt - only convert to Date if it's not null/undefined
    let dueAt: Date | null = null;
    if (data.dueAt) {
      try {
        dueAt = new Date(data.dueAt);
        // Validate it's a valid date (not epoch)
        if (isNaN(dueAt.getTime())) {
          dueAt = null;
        }
      } catch (dateError) {
        dueAt = null;
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: token.id,
        title: data.title,
        courseId: data.courseId || null,
        dueAt,
        pinned: data.pinned || false,
        checklist: data.checklist || [],
        notes: data.notes || '',
        links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })),
        status: data.status || 'open',
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
});
