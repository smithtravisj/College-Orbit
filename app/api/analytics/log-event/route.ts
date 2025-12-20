import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, eventType, eventName, metadata } = body;

    // Validate required fields
    if (!sessionId || !eventType || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, eventType, eventName' },
        { status: 400 }
      );
    }

    // Log the event to database
    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        userId: userId || null,
        eventType,
        eventName,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
