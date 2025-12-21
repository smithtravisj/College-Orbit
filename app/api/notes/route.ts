import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { extractPlainText } from '@/lib/tiptapUtils';

// GET all notes for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: { userId: token.id },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
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
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Extract plain text from rich text content for search
    const plainText = extractPlainText(data.content);

    const note = await prisma.note.create({
      data: {
        userId: token.id,
        title: data.title.trim(),
        content: data.content || { type: 'doc', content: [] },
        plainText,
        folderId: data.folderId || null,
        courseId: data.courseId || null,
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        links: (data.links || [])
          .filter((l: any) => l.url)
          .map((l: any) => ({
            label: l.label || new URL(l.url).hostname,
            url: l.url.startsWith('http') ? l.url : `https://${l.url}`,
          })),
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
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
