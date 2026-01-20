import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
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

// POST - Sync calendar events from Canvas
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get settings with Canvas credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        canvasInstanceUrl: true,
        canvasAccessToken: true,
        canvasUserId: true,
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

    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      // Get events for the next 3 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

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

      if (settings.canvasUserId) {
        contextCodes.push(`user_${settings.canvasUserId}`);
      }

      if (contextCodes.length === 0) {
        return NextResponse.json({
          success: true,
          result,
          message: 'No Canvas courses found. Please sync courses first.',
        });
      }

      const events = await client.getCalendarEvents({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        context_codes: contextCodes,
        type: 'event',
      });

      // Get existing calendar events with Canvas IDs
      const existingEvents = await prisma.calendarEvent.findMany({
        where: {
          userId,
          canvasEventId: { not: null },
        },
        select: { id: true, canvasEventId: true },
      });

      const existingEventMap = new Map(
        existingEvents.map(e => [e.canvasEventId, e.id])
      );

      for (const event of events) {
        try {
          const canvasEventIdStr = String(event.id);
          const existingEventId = existingEventMap.get(canvasEventIdStr);

          // Convert HTML description to plain text
          const cleanDescription = htmlToPlainText(event.description);

          if (existingEventId) {
            await prisma.calendarEvent.update({
              where: { id: existingEventId },
              data: {
                title: event.title,
                description: cleanDescription,
                startAt: new Date(event.start_at),
                endAt: event.end_at ? new Date(event.end_at) : null,
                allDay: event.all_day,
                location: event.location_name,
              },
            });
            result.updated++;
          } else {
            await prisma.calendarEvent.create({
              data: {
                userId,
                title: event.title,
                description: cleanDescription,
                startAt: new Date(event.start_at),
                endAt: event.end_at ? new Date(event.end_at) : null,
                allDay: event.all_day,
                location: event.location_name,
                canvasEventId: canvasEventIdStr,
              },
            });
            result.created++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync event ${event.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Synced ${result.created + result.updated} events (${result.created} new, ${result.updated} updated)`,
    });
  } catch (error) {
    console.error('[Canvas Sync Events] Error:', error);

    if (error instanceof CanvasAuthError) {
      const session = await getServerSession(authConfig);
      if (session?.user?.id) {
        const existingNotification = await prisma.notification.findFirst({
          where: { userId: session.user.id, type: 'canvas_token_expired', read: false },
        });
        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
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
      { error: 'Failed to sync calendar events from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
