import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET single shopping item
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

    const item = await prisma.shoppingItem.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching shopping item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PATCH update shopping item
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
    const existingItem = await prisma.shoppingItem.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = await prisma.shoppingItem.update({
      where: { id },
      data: {
        name: 'name' in data ? data.name : existingItem.name,
        quantity: 'quantity' in data ? data.quantity : existingItem.quantity,
        unit: 'unit' in data ? data.unit : existingItem.unit,
        category: 'category' in data ? data.category : existingItem.category,
        notes: 'notes' in data ? data.notes : existingItem.notes,
        checked: 'checked' in data ? data.checked : existingItem.checked,
        priority: 'priority' in data ? data.priority : existingItem.priority,
        price: 'price' in data ? data.price : existingItem.price,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating shopping item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE shopping item
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
    const existingItem = await prisma.shoppingItem.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
