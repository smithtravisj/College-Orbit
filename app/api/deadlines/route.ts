import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all deadlines for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('[GET /api/deadlines] Token:', token ? { userId: token.id, email: token.email } : 'null');

    if (!token?.id) {
      console.log('[GET /api/deadlines] No user ID in token, returning 401');
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
    console.log('[GET /api/deadlines] Authorized user:', token.id);

    const deadlines = await prisma.deadline.findMany({
      where: { userId: token.id },
      orderBy: { dueAt: 'asc' },
    });

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your deadlines. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new deadline
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
    console.log('[POST /deadlines] Request body:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      console.error('[POST /deadlines] Missing title');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Handle dueAt - only convert to Date if it's not null/undefined
    let dueAt: Date | null = null;
    if (data.dueAt) {
      try {
        dueAt = new Date(data.dueAt);
        // Validate it's a valid date (not epoch)
        if (isNaN(dueAt.getTime())) {
          console.warn('[POST /deadlines] Invalid date received:', data.dueAt);
          dueAt = null;
        } else {
          console.log('[POST /deadlines] Valid dueAt:', dueAt.toISOString());
        }
      } catch (dateError) {
        console.error('[POST /deadlines] Date parsing error:', dateError);
        dueAt = null;
      }
    } else {
      console.log('[POST /deadlines] No dueAt provided, setting to null');
    }

    console.log('[POST /deadlines] Final dueAt value:', dueAt);

    const deadline = await prisma.deadline.create({
      data: {
        userId: token.id,
        title: data.title.trim(),
        courseId: data.courseId || null,
        dueAt: dueAt,
        notes: data.notes || '',
        links: (data.links || []).filter((l: any) => l.url).map((l: any) => ({
          label: l.label || new URL(l.url).hostname,
          url: l.url,
        })),
        status: data.status || 'open',
      },
    });

    console.log('[POST /deadlines] Deadline created successfully:', deadline.id);
    return NextResponse.json({ deadline }, { status: 201 });
  } catch (error) {
    console.error('[POST /deadlines] Error creating deadline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create deadline', details: errorMessage },
      { status: 500 }
    );
  }
});
