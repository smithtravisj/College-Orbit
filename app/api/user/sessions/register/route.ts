import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { parseUserAgent } from '@/lib/userAgent';
import { getToken } from 'next-auth/jwt';

// POST /api/user/sessions/register - Register a new session with device info
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the session token from the JWT
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sessionToken) {
      return NextResponse.json({ error: 'No session token found' }, { status: 400 });
    }

    const sessionToken = token.sessionToken as string;

    // Get client-provided browser name (for browsers like Brave that hide in UA)
    let clientBrowser: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      clientBrowser = body.browser || null;
    } catch {
      // No body provided, that's fine
    }

    // Check if this session is already registered
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionToken },
    });

    if (existingSession) {
      // Re-parse user agent to fix any previous detection issues
      const userAgent = req.headers.get('user-agent');
      const { browser: parsedBrowser, os, device } = parseUserAgent(userAgent);
      const browser = clientBrowser || parsedBrowser;

      // Update last activity, browser, OS, and device info
      await prisma.userSession.update({
        where: { sessionToken },
        data: {
          lastActivityAt: new Date(),
          browser,
          os,
          device,
          userAgent,
        },
      });
      return NextResponse.json({ success: true, message: 'Session already registered' });
    }

    // Parse user agent
    const userAgent = req.headers.get('user-agent');
    const { browser: parsedBrowser, os, device } = parseUserAgent(userAgent);

    // Use client-provided browser if available, otherwise use parsed
    const browser = clientBrowser || parsedBrowser;

    // Get IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'Unknown';

    // Try to get location from IP (simplified - in production you'd use a geolocation service)
    let city = null;
    let country = null;

    // Calculate expiry (30 days from now to match JWT maxAge)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session record
    await prisma.userSession.create({
      data: {
        userId: session.user.id,
        sessionToken,
        userAgent,
        browser,
        os,
        device,
        ipAddress: ip,
        city,
        country,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, message: 'Session registered successfully' });
  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json({ error: 'Failed to register session' }, { status: 500 });
  }
}
