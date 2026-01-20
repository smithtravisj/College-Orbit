import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all shopping items for authenticated user (supports filtering and purchase history)
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

    const includePurchased = url.searchParams.get('includePurchased') === 'true';

    const items = await prisma.shoppingItem.findMany({
      where: {
        userId: token.id,
        ...(listType && { listType }),
        ...(category && { category }),
        // By default, only return active (non-purchased) items
        ...(!includePurchased && { purchasedAt: null }),
      },
      orderBy: [
        { checked: 'asc' },
        { order: 'asc' },
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
        order: data.order || 0,
        purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null,
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

// DELETE shopping items
// - listType + checked items: Mark as purchased (for grocery) or delete (for others)
// - clearHistory=true: Permanently delete all purchased items
// - permanent=true: Permanently delete instead of marking as purchased
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
    const clearHistory = url.searchParams.get('clearHistory') === 'true';
    const permanent = url.searchParams.get('permanent') === 'true';

    // Clear purchase history (permanently delete all purchased items)
    if (clearHistory) {
      await prisma.shoppingItem.deleteMany({
        where: {
          userId: token.id,
          purchasedAt: { not: null },
        },
      });
      return NextResponse.json({ success: true });
    }

    if (!listType) {
      return NextResponse.json({ error: 'List type is required' }, { status: 400 });
    }

    // For grocery list without permanent flag, mark as purchased instead of deleting
    if (listType === 'grocery' && !permanent) {
      await prisma.shoppingItem.updateMany({
        where: {
          userId: token.id,
          listType,
          checked: true,
          purchasedAt: null, // Only mark active items as purchased
        },
        data: {
          purchasedAt: new Date(),
          checked: false, // Uncheck when marking as purchased
        },
      });
    } else {
      // For wishlist/pantry or permanent delete, actually delete
      await prisma.shoppingItem.deleteMany({
        where: {
          userId: token.id,
          listType,
          checked: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting/purchasing items:', error);
    return NextResponse.json(
      { error: 'Failed to process items' },
      { status: 500 }
    );
  }
});
