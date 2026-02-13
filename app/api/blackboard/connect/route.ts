import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { createBlackboardClient, getAccessToken, encryptToken } from '@/lib/blackboard';

// POST - Connect to Blackboard LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { instanceUrl, applicationKey, applicationSecret } = await req.json();

    // Validate required fields
    if (!instanceUrl || !applicationKey || !applicationSecret) {
      return NextResponse.json(
        { error: 'Blackboard instance URL, application key, and application secret are required' },
        { status: 400 }
      );
    }

    // Get OAuth access token using client credentials
    let accessToken: string;
    let tokenExpiresAt: Date;
    try {
      const tokenResult = await getAccessToken(instanceUrl, applicationKey, applicationSecret);
      accessToken = tokenResult.token;
      tokenExpiresAt = tokenResult.expiresAt;
    } catch (error) {
      console.error('[Blackboard Connect] Failed to get OAuth token:', error);
      return NextResponse.json(
        {
          error: 'Failed to authenticate with Blackboard. Please check your application key and secret.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Test the connection by fetching the current user
    const client = createBlackboardClient(instanceUrl, accessToken);

    let blackboardUser;
    try {
      blackboardUser = await client.testConnection();
    } catch (error) {
      console.error('[Blackboard Connect] Failed to connect:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to Blackboard. Please check your instance URL and credentials.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Encrypt the credentials before storing
    const encryptionSecret = process.env.BLACKBOARD_ENCRYPTION_SECRET || process.env.CANVAS_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';
    const encryptedKey = encryptToken(applicationKey, encryptionSecret);
    const encryptedSecret = encryptToken(applicationSecret, encryptionSecret);
    const encryptedAccessToken = encryptToken(accessToken, encryptionSecret);

    // Normalize the instance URL (remove protocol for storage, add back https)
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Build user display name
    const userName = blackboardUser.name
      ? `${blackboardUser.name.given} ${blackboardUser.name.family}`.trim()
      : blackboardUser.userName;

    // Update settings with Blackboard connection info
    await prisma.settings.upsert({
      where: { userId },
      update: {
        blackboardInstanceUrl: normalizedUrl,
        blackboardApplicationKey: encryptedKey,
        blackboardApplicationSecret: encryptedSecret,
        blackboardAccessToken: encryptedAccessToken,
        blackboardTokenExpiresAt: tokenExpiresAt,
        blackboardUserId: blackboardUser.id,
        blackboardUserName: userName,
        blackboardSyncEnabled: true,
      },
      create: {
        userId,
        blackboardInstanceUrl: normalizedUrl,
        blackboardApplicationKey: encryptedKey,
        blackboardApplicationSecret: encryptedSecret,
        blackboardAccessToken: encryptedAccessToken,
        blackboardTokenExpiresAt: tokenExpiresAt,
        blackboardUserId: blackboardUser.id,
        blackboardUserName: userName,
        blackboardSyncEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: blackboardUser.id,
        name: userName,
        email: blackboardUser.contact?.email,
      },
      message: `Successfully connected to Blackboard as ${userName}`,
    });
  } catch (error) {
    console.error('[Blackboard Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Blackboard. Please try again.' },
      { status: 500 }
    );
  }
});
