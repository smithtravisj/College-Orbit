import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { createMoodleClient, encryptToken } from '@/lib/moodle';

// POST - Connect to Moodle LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { instanceUrl, token } = await req.json();

    // Validate required fields
    if (!instanceUrl || !token) {
      return NextResponse.json(
        { error: 'Moodle instance URL and web service token are required' },
        { status: 400 }
      );
    }

    // Test the connection by fetching site info
    const client = createMoodleClient(instanceUrl, token);

    let siteInfo;
    try {
      siteInfo = await client.testConnection();
    } catch (error) {
      console.error('[Moodle Connect] Failed to connect:', error);
      return NextResponse.json(
        {
          error: 'Failed to connect to Moodle. Please check your instance URL and token.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Encrypt the token before storing
    const encryptionSecret = process.env.MOODLE_ENCRYPTION_SECRET ||
      process.env.CANVAS_ENCRYPTION_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret';
    const encryptedToken = encryptToken(token, encryptionSecret);

    // Normalize the instance URL
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Update settings with Moodle connection info
    await prisma.settings.upsert({
      where: { userId: userId },
      update: {
        moodleInstanceUrl: normalizedUrl,
        moodleAccessToken: encryptedToken,
        moodleUserId: String(siteInfo.userid),
        moodleUserName: siteInfo.fullname,
        moodleSyncEnabled: true,
      },
      create: {
        userId: userId,
        moodleInstanceUrl: normalizedUrl,
        moodleAccessToken: encryptedToken,
        moodleUserId: String(siteInfo.userid),
        moodleUserName: siteInfo.fullname,
        moodleSyncEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: siteInfo.userid,
        name: siteInfo.fullname,
        username: siteInfo.username,
      },
      site: {
        name: siteInfo.sitename,
        url: siteInfo.siteurl,
      },
      message: `Successfully connected to Moodle as ${siteInfo.fullname}`,
    });
  } catch (error) {
    console.error('[Moodle Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Moodle. Please try again.' },
      { status: 500 }
    );
  }
});
