import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all folders for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, code: true, name: true } },
        children: {
          select: {
            id: true,
            name: true,
            parentId: true,
            colorTag: true,
            order: true,
          },
        },
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to load folders' },
      { status: 500 }
    );
  }
});

// POST create new folder
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Check for duplicate folder names at the same level (parent)
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId,
        name: data.name.trim(),
        parentId: data.parentId || null,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists at this level' },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it belongs to the user and is not a nested-3 level
    if (data.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: data.parentId, userId },
        include: { parent: true },
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }

      // Prevent 3-level nesting
      if (parentFolder.parent) {
        return NextResponse.json(
          { error: 'Cannot nest folders more than 2 levels deep' },
          { status: 400 }
        );
      }
    }

    const folder = await prisma.folder.create({
      data: {
        userId,
        name: data.name.trim(),
        parentId: data.parentId || null,
        courseId: data.courseId || null,
        colorTag: data.colorTag || null,
        order: data.order || 0,
      },
      include: {
        course: { select: { id: true, code: true, name: true } },
        children: {
          select: {
            id: true,
            name: true,
            parentId: true,
            colorTag: true,
            order: true,
          },
        },
        _count: {
          select: { notes: true },
        },
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
});
