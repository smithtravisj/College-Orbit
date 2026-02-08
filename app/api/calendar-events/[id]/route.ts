import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET single calendar event
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

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PATCH update calendar event
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
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: token.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: 'title' in data ? data.title : existingEvent.title,
        description: 'description' in data ? data.description : existingEvent.description,
        startAt: 'startAt' in data ? new Date(data.startAt) : existingEvent.startAt,
        endAt: 'endAt' in data ? (data.endAt ? new Date(data.endAt) : null) : existingEvent.endAt,
        allDay: 'allDay' in data ? data.allDay : existingEvent.allDay,
        color: 'color' in data ? data.color : existingEvent.color,
        location: 'location' in data ? data.location : existingEvent.location,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE calendar event
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

    // Verify ownership and get LMS IDs if present
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: token.id,
      },
      select: {
        id: true,
        canvasEventId: true,
        blackboardEventId: true,
        moodleEventId: true,
        brightspaceEventId: true,
        googleEventId: true,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Track deletions for LMS-synced events to prevent re-sync
    if (existingEvent.canvasEventId) {
      await prisma.deletedCanvasItem.upsert({
        where: {
          userId_canvasId_type: {
            userId: token.id,
            canvasId: existingEvent.canvasEventId,
            type: 'event',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          canvasId: existingEvent.canvasEventId,
          type: 'event',
        },
      });
    }

    if (existingEvent.blackboardEventId) {
      await prisma.deletedBlackboardItem.upsert({
        where: {
          userId_blackboardId_type: {
            userId: token.id,
            blackboardId: existingEvent.blackboardEventId,
            type: 'event',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          blackboardId: existingEvent.blackboardEventId,
          type: 'event',
        },
      });
    }

    if (existingEvent.moodleEventId) {
      await prisma.deletedMoodleItem.upsert({
        where: {
          userId_moodleId_type: {
            userId: token.id,
            moodleId: existingEvent.moodleEventId,
            type: 'event',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          moodleId: existingEvent.moodleEventId,
          type: 'event',
        },
      });
    }

    if (existingEvent.brightspaceEventId) {
      await prisma.deletedBrightspaceItem.upsert({
        where: {
          userId_brightspaceId_type: {
            userId: token.id,
            brightspaceId: existingEvent.brightspaceEventId,
            type: 'event',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          brightspaceId: existingEvent.brightspaceEventId,
          type: 'event',
        },
      });
    }

    if (existingEvent.googleEventId) {
      // Track deletion to prevent re-import
      await prisma.deletedGoogleCalendarItem.upsert({
        where: {
          userId_googleEventId_type: {
            userId: token.id,
            googleEventId: existingEvent.googleEventId,
            type: 'event',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          googleEventId: existingEvent.googleEventId,
          type: 'event',
        },
      });
      // Also queue deletion from Google Calendar
      await prisma.deletedGoogleCalendarItem.upsert({
        where: {
          userId_googleEventId_type: {
            userId: token.id,
            googleEventId: existingEvent.googleEventId,
            type: 'pending_google_delete',
          },
        },
        update: { deletedAt: new Date() },
        create: {
          userId: token.id,
          googleEventId: existingEvent.googleEventId,
          type: 'pending_google_delete',
        },
      });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
