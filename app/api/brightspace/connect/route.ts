import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { createBrightspaceClient, getAccessToken, encryptToken } from '@/lib/brightspace';

// POST - Connect to Brightspace LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { instanceUrl, clientId, clientSecret } = await req.json();

    // Validate required fields
    if (!instanceUrl || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Brightspace instance URL, client ID, and client secret are required' },
        { status: 400 }
      );
    }

    // Get OAuth access token
    let accessToken: string;
    let refreshToken: string | undefined;
    let tokenExpiresAt: Date;
    try {
      const tokenResult = await getAccessToken(instanceUrl, clientId, clientSecret);
      accessToken = tokenResult.accessToken;
      refreshToken = tokenResult.refreshToken;
      tokenExpiresAt = tokenResult.expiresAt;
    } catch (error) {
      console.error('[Brightspace Connect] Failed to get OAuth token:', error);
      return NextResponse.json(
        {
          error: 'Failed to authenticate with Brightspace. Please check your client ID and secret.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Test the connection by fetching the current user
    const client = createBrightspaceClient(instanceUrl, accessToken);

    let brightspaceUser;
    try {
      brightspaceUser = await client.testConnection();
    } catch (error) {
      console.error('[Brightspace Connect] Failed to connect:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to Brightspace. Please check your instance URL and credentials.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Encrypt the credentials before storing
    const encryptionSecret = process.env.BRIGHTSPACE_ENCRYPTION_SECRET ||
      process.env.CANVAS_ENCRYPTION_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret';
    const encryptedClientId = encryptToken(clientId, encryptionSecret);
    const encryptedClientSecret = encryptToken(clientSecret, encryptionSecret);
    const encryptedAccessToken = encryptToken(accessToken, encryptionSecret);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken, encryptionSecret) : null;

    // Normalize the instance URL
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Update settings with Brightspace connection info
    await prisma.settings.upsert({
      where: { userId },
      update: {
        brightspaceInstanceUrl: normalizedUrl,
        brightspaceClientId: encryptedClientId,
        brightspaceClientSecret: encryptedClientSecret,
        brightspaceAccessToken: encryptedAccessToken,
        brightspaceRefreshToken: encryptedRefreshToken,
        brightspaceTokenExpiresAt: tokenExpiresAt,
        brightspaceUserId: brightspaceUser.Identifier,
        brightspaceUserName: brightspaceUser.DisplayName,
        brightspaceSyncEnabled: true,
      },
      create: {
        userId,
        brightspaceInstanceUrl: normalizedUrl,
        brightspaceClientId: encryptedClientId,
        brightspaceClientSecret: encryptedClientSecret,
        brightspaceAccessToken: encryptedAccessToken,
        brightspaceRefreshToken: encryptedRefreshToken,
        brightspaceTokenExpiresAt: tokenExpiresAt,
        brightspaceUserId: brightspaceUser.Identifier,
        brightspaceUserName: brightspaceUser.DisplayName,
        brightspaceSyncEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: brightspaceUser.Identifier,
        name: brightspaceUser.DisplayName,
        email: brightspaceUser.EmailAddress,
      },
      message: `Successfully connected to Brightspace as ${brightspaceUser.DisplayName}`,
    });
  } catch (error) {
    console.error('[Brightspace Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Brightspace. Please try again.' },
      { status: 500 }
    );
  }
});
