import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, encryptToken } from '@/lib/canvas';

// POST - Connect to Canvas LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { instanceUrl, accessToken } = await req.json();

    // Validate required fields
    if (!instanceUrl || !accessToken) {
      return NextResponse.json(
        { error: 'Canvas instance URL and access token are required' },
        { status: 400 }
      );
    }

    // Test the connection by fetching the current user
    const client = createCanvasClient(instanceUrl, accessToken);

    let canvasUser;
    try {
      canvasUser = await client.testConnection();
    } catch (error) {
      console.error('[Canvas Connect] Failed to connect:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to Canvas. Please check your instance URL and access token.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Encrypt the access token before storing
    const encryptionSecret = process.env.CANVAS_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';
    const encryptedToken = encryptToken(accessToken, encryptionSecret);

    // Normalize the instance URL (remove protocol for storage, add back https)
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Update settings with Canvas connection info
    await prisma.settings.upsert({
      where: { userId: userId },
      update: {
        canvasInstanceUrl: normalizedUrl,
        canvasAccessToken: encryptedToken,
        canvasUserId: String(canvasUser.id),
        canvasUserName: canvasUser.name,
        canvasSyncEnabled: true,
      },
      create: {
        userId: userId,
        canvasInstanceUrl: normalizedUrl,
        canvasAccessToken: encryptedToken,
        canvasUserId: String(canvasUser.id),
        canvasUserName: canvasUser.name,
        canvasSyncEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: canvasUser.id,
        name: canvasUser.name,
        email: canvasUser.email,
      },
      message: `Successfully connected to Canvas as ${canvasUser.name}`,
    });
  } catch (error) {
    console.error('[Canvas Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
