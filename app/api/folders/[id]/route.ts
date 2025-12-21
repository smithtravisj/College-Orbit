import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET single folder
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

    const folder = await prisma.folder.findFirst({
      where: { id, userId: token.id },
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

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    );
  }
}

// PATCH update folder
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
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId: token.id },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // If updating name, check for duplicates at same level
    if ('name' in data && data.name !== existingFolder.name) {
      const duplicate = await prisma.folder.findFirst({
        where: {
          userId: token.id,
          name: data.name.trim(),
          parentId: existingFolder.parentId,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A folder with this name already exists at this level' },
          { status: 400 }
        );
      }
    }

    // If updating parentId, verify it belongs to user and prevent 3-level nesting
    if ('parentId' in data && data.parentId !== existingFolder.parentId) {
      if (data.parentId) {
        const parentFolder = await prisma.folder.findFirst({
          where: { id: data.parentId, userId: token.id },
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

        // Prevent moving a folder to one of its children (would create cycle)
        const childIds = await getDescendantIds(data.parentId);
        if (childIds.includes(id)) {
          return NextResponse.json(
            { error: 'Cannot move folder to its own subfolder' },
            { status: 400 }
          );
        }
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name: 'name' in data ? data.name.trim() : existingFolder.name,
        parentId: 'parentId' in data ? data.parentId : existingFolder.parentId,
        courseId: 'courseId' in data ? data.courseId : existingFolder.courseId,
        colorTag: 'colorTag' in data ? data.colorTag : existingFolder.colorTag,
        order: 'order' in data ? data.order : existingFolder.order,
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

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE folder (notes will be unfiled)
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
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId: token.id },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // In a transaction: unfile notes and delete folder
    await prisma.$transaction([
      // Move notes from this folder to unfiled
      prisma.note.updateMany({
        where: { folderId: id },
        data: { folderId: null },
      }),
      // Delete the folder (child folders cascade delete)
      prisma.folder.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get all descendant folder IDs
 * Used to prevent circular references when moving folders
 */
async function getDescendantIds(folderId: string): Promise<string[]> {
  const descendants: string[] = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;

    const children = await prisma.folder.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}
