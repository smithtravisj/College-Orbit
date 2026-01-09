import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all calendar events for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: token.id,
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to load calendar events' },
      { status: 500 }
    );
  }
});

// POST create new calendar event
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
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }

    if (!data.startAt) {
      return NextResponse.json({ error: 'Start date/time is required' }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: token.id,
        title: data.title.trim(),
        description: data.description || '',
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        allDay: data.allDay || false,
        color: data.color || null,
        location: data.location || null,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
});
