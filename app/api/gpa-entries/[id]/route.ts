import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';

// PATCH update a GPA entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify the entry belongs to the user
    const entry = await prisma.gpaEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updatedEntry = await prisma.gpaEntry.update({
      where: { id },
      data: {
        ...(data.courseName !== undefined && { courseName: data.courseName }),
        ...(data.grade !== undefined && { grade: data.grade }),
        ...(data.credits !== undefined && { credits: parseFloat(data.credits) }),
        ...(data.term !== undefined && { term: data.term }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Error updating GPA entry:', error);
    return NextResponse.json(
      { error: 'Failed to update GPA entry' },
      { status: 500 }
    );
  }
}

// DELETE a GPA entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify the entry belongs to the user
    const entry = await prisma.gpaEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.gpaEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting GPA entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete GPA entry' },
      { status: 500 }
    );
  }
}
