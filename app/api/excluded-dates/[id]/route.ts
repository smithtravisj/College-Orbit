import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// PATCH update excluded date
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
    console.log('[PATCH /api/excluded-dates/:id] ID:', id);
    console.log('[PATCH /api/excluded-dates/:id] Request body:', JSON.stringify(data, null, 2));

    // Verify ownership
    const existingExcludedDate = await prisma.excludedDate.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingExcludedDate) {
      console.error('[PATCH /api/excluded-dates/:id] Excluded date not found:', id);
      return NextResponse.json(
        { error: 'Excluded date not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if ('description' in data) {
      if (!data.description || !data.description.trim()) {
        return NextResponse.json(
          { error: 'Description is required' },
          { status: 400 }
        );
      }
      updateData.description = data.description.trim();
    }

    if ('date' in data && data.date) {
      updateData.date = new Date(data.date);
    }

    if ('courseId' in data) {
      // If courseId is provided and not null, verify it belongs to the user
      if (data.courseId) {
        const course = await prisma.course.findFirst({
          where: {
            id: data.courseId,
            userId: token.id,
          },
        });

        if (!course) {
          return NextResponse.json(
            { error: 'Course not found or unauthorized' },
            { status: 404 }
          );
        }
      }
      updateData.courseId = data.courseId || null;
    }

    const excludedDate = await prisma.excludedDate.update({
      where: { id },
      data: updateData,
    });

    console.log('[PATCH /api/excluded-dates/:id] Excluded date updated successfully:', excludedDate.id);
    return NextResponse.json({ excludedDate });
  } catch (error) {
    console.error('[PATCH /api/excluded-dates/:id] Error updating excluded date:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update excluded date', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE excluded date
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingExcludedDate = await prisma.excludedDate.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingExcludedDate) {
      return NextResponse.json(
        { error: 'Excluded date not found' },
        { status: 404 }
      );
    }

    await prisma.excludedDate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/excluded-dates/:id] Error deleting excluded date:', error);
    return NextResponse.json(
      { error: 'Failed to delete excluded date' },
      { status: 500 }
    );
  }
}
