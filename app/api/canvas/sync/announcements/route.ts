import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, decryptToken, CanvasAuthError } from '@/lib/canvas';

/**
 * Converts HTML content to clean plain text.
 * Strips tags, converts lists to bullets, preserves paragraph breaks.
 */
function htmlToPlainText(html: string | null): string {
  if (!html) return '';

  let text = html;

  // Remove script and style tags entirely (including content)
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<link[^>]*>/gi, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Add spacing around lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');

  // Remove iframe (embedded videos) but note their presence
  text = text.replace(/<iframe[^>]*src="([^"]*youtube[^"]*)"[^>]*>[\s\S]*?<\/iframe>/gi, '[Video: $1]\n');
  text = text.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '[Embedded content]\n');

  // Convert links to text with URL
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  text = text.replace(/\n[ \t]+/g, '\n'); // Remove leading whitespace on lines
  text = text.replace(/[ \t]+\n/g, '\n'); // Remove trailing whitespace on lines
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

  return text.trim();
}

// POST - Sync announcements from Canvas
export const POST = withRateLimit(async function(req: NextRequest) {
  const userId = await getAuthUserId(req);

  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
  }

  try {

    // Get settings with Canvas credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        canvasInstanceUrl: true,
        canvasAccessToken: true,
        canvasSyncEnabled: true,
      },
    });

    if (!settings?.canvasInstanceUrl || !settings?.canvasAccessToken || !settings?.canvasSyncEnabled) {
      return NextResponse.json(
        { error: 'Canvas is not connected. Please connect to Canvas first.' },
        { status: 400 }
      );
    }

    // Decrypt the access token
    const encryptionSecret = process.env.CANVAS_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';
    let accessToken: string;
    try {
      accessToken = decryptToken(settings.canvasAccessToken, encryptionSecret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Canvas. Please reconnect.' },
        { status: 400 }
      );
    }

    const client = createCanvasClient(settings.canvasInstanceUrl, accessToken);

    const result = { created: 0, errors: [] as string[] };

    try {
      // Get all courses with Canvas IDs for context codes
      const courses = await prisma.course.findMany({
        where: {
          userId,
          canvasCourseId: { not: null },
        },
        select: { canvasCourseId: true },
      });

      const contextCodes = courses
        .filter(c => c.canvasCourseId)
        .map(c => `course_${c.canvasCourseId}`);

      if (contextCodes.length === 0) {
        return NextResponse.json({
          success: true,
          result,
          message: 'No Canvas courses found. Please sync courses first.',
        });
      }

      // Get announcements from the last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const announcements = await client.getAnnouncements({
        context_codes: contextCodes,
        start_date: startDate.toISOString().split('T')[0],
        active_only: true,
      });

      // Get existing notifications with Canvas announcement IDs
      const existingNotifications = await prisma.notification.findMany({
        where: {
          userId,
          canvasAnnouncementId: { not: null },
        },
        select: { canvasAnnouncementId: true },
      });

      const existingAnnouncementIds = new Set(
        existingNotifications.map(n => n.canvasAnnouncementId)
      );

      for (const announcement of announcements) {
        try {
          const canvasAnnouncementIdStr = String(announcement.id);

          // Skip if we already have this announcement
          if (existingAnnouncementIds.has(canvasAnnouncementIdStr)) {
            continue;
          }

          // Create new notification for the announcement
          // Convert HTML to clean plain text
          const plainMessage = htmlToPlainText(announcement.message).substring(0, 500);

          await prisma.notification.create({
            data: {
              userId,
              title: announcement.title,
              message: `From ${announcement.user_name}: ${plainMessage}`,
              type: 'canvas_announcement',
              read: false,
              canvasAnnouncementId: canvasAnnouncementIdStr,
            },
          });
          result.created++;
        } catch (error) {
          result.errors.push(
            `Failed to sync announcement ${announcement.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to fetch announcements: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Created ${result.created} new announcement notifications`,
    });
  } catch (error) {
    console.error('[Canvas Sync Announcements] Error:', error);

    if (error instanceof CanvasAuthError) {
      if (userId) {
        const existingNotification = await prisma.notification.findFirst({
          where: { userId, type: 'canvas_token_expired', read: false },
        });
        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'Canvas Connection Expired',
              message: 'Your Canvas access token has expired. Please go to Settings to reconnect your Canvas account.',
              type: 'canvas_token_expired',
              read: false,
            },
          });
        }
      }
      return NextResponse.json(
        { error: 'Your Canvas access token has expired. Please reconnect your Canvas account in Settings.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync announcements from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
