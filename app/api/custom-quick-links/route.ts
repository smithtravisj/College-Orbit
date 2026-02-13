import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all custom quick links for authenticated user (optionally filtered by university)
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const university = searchParams.get('university');

    const links = await prisma.customQuickLink.findMany({
      where: {
        userId,
        ...(university && { university }),
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching custom quick links:', error);
    return NextResponse.json(
      { error: 'Failed to load custom quick links' },
      { status: 500 }
    );
  }
});

// POST create new custom quick link
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.label || !data.url || !data.university) {
      return NextResponse.json(
        { error: 'Label, URL, and university are required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(data.url);
    } catch {
      return NextResponse.json(
        { error: 'Please enter a valid URL' },
        { status: 400 }
      );
    }

    const link = await prisma.customQuickLink.create({
      data: {
        userId,
        university: data.university,
        label: data.label,
        url: data.url,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Error creating custom quick link:', error);
    return NextResponse.json(
      { error: 'Failed to create custom quick link' },
      { status: 500 }
    );
  }
});
