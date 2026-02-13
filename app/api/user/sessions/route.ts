import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { getToken } from 'next-auth/jwt';

// GET /api/user/sessions - List all active sessions
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current session token from the JWT (for identifying which session is "current")
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const currentSessionToken = token?.sessionToken as string | undefined;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only non-expired sessions
        revokedAt: null, // Only non-revoked sessions
      },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        sessionToken: true,
        browser: true,
        os: true,
        device: true,
        ipAddress: true,
        city: true,
        country: true,
        lastActivityAt: true,
        createdAt: true,
      },
    });

    // Mark which session is current
    const sessionsWithCurrent = sessions.map(s => ({
      ...s,
      isCurrent: s.sessionToken === currentSessionToken,
      // Don't expose full session token to client
      sessionToken: undefined,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/user/sessions - Invalidate all sessions (log out everywhere)
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set sessionInvalidatedAt to now - this will invalidate all existing JWT tokens
    await prisma.user.update({
      where: { id: userId },
      data: { sessionInvalidatedAt: new Date() },
    });

    // Mark all session records as revoked
    await prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'All sessions have been invalidated' });
  } catch (error) {
    console.error('Error invalidating sessions:', error);
    return NextResponse.json({ error: 'Failed to invalidate sessions' }, { status: 500 });
  }
}

// DELETE /api/user/sessions - Revoke a specific session
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify the session belongs to the user and mark it as revoked
    const revokedSession = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null, // Only revoke if not already revoked
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokedSession.count === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
