import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all shopping items for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const listType = url.searchParams.get('listType');
    const category = url.searchParams.get('category');

    const items = await prisma.shoppingItem.findMany({
      where: {
        userId: token.id,
        ...(listType && { listType }),
        ...(category && { category }),
      },
      orderBy: [
        { checked: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    return NextResponse.json(
      { error: 'Failed to load shopping items' },
      { status: 500 }
    );
  }
});

// POST create new shopping item
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

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    if (!data.listType) {
      return NextResponse.json({ error: 'List type is required' }, { status: 400 });
    }

    const item = await prisma.shoppingItem.create({
      data: {
        userId: token.id,
        listType: data.listType,
        name: data.name.trim(),
        quantity: data.quantity || 1,
        unit: data.unit || null,
        category: data.category || 'Other',
        notes: data.notes || '',
        checked: false,
        priority: data.priority || null,
        price: data.price || null,
        perishable: data.perishable ?? false,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating shopping item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
});

// DELETE all checked items for a list type
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const url = new URL(req.url);
    const listType = url.searchParams.get('listType');

    if (!listType) {
      return NextResponse.json({ error: 'List type is required' }, { status: 400 });
    }

    await prisma.shoppingItem.deleteMany({
      where: {
        userId: token.id,
        listType,
        checked: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checked items:', error);
    return NextResponse.json(
      { error: 'Failed to delete items' },
      { status: 500 }
    );
  }
});
