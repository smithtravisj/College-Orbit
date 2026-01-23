import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, decryptToken, CanvasAuthError } from '@/lib/canvas';

// Separators for notes sections
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const CANVAS_SEPARATOR = '\n\n─── From Canvas ───\n';

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

/**
 * Extracts links from HTML content.
 * Returns array of { label, url } objects, deduplicated by URL.
 */
function extractLinksFromHtml(html: string | null): Array<{ label: string; url: string }> {
  if (!html) return [];

  const links: Array<{ label: string; url: string }> = [];
  const seenUrls = new Set<string>();
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const label = match[2].trim() || url;
    const urlLower = url.toLowerCase();

    // Skip empty urls, anchors, javascript links, and duplicates
    if (url && !url.startsWith('#') && !url.startsWith('javascript:') && !seenUrls.has(urlLower)) {
      links.push({ label, url });
      seenUrls.add(urlLower);
    }
  }

  // Also extract YouTube video links from iframes
  const iframeRegex = /<iframe[^>]*src="([^"]*youtube[^"]*)"/gi;
  while ((match = iframeRegex.exec(html)) !== null) {
    const url = match[1];
    const urlLower = url.toLowerCase();
    if (!seenUrls.has(urlLower)) {
      links.push({ label: 'Video', url });
      seenUrls.add(urlLower);
    }
  }

  return links;
}

/**
 * Merges existing links with Canvas-extracted links.
 * Canvas links (including "View on Canvas") come first, then user's existing links.
 * Avoids duplicates by URL comparison.
 */
function mergeLinks(
  existingLinks: Array<{ label: string; url: string }> | null,
  canvasLinks: Array<{ label: string; url: string }>
): Array<{ label: string; url: string }> {
  const existing = existingLinks || [];
  const canvasUrls = new Set(canvasLinks.map(l => l.url.toLowerCase()));

  // Keep existing links that aren't duplicates of Canvas links
  const userLinks = existing.filter(l => !canvasUrls.has(l.url.toLowerCase()));

  // Canvas links first (including "View on Canvas"), then user's custom links
  return [...canvasLinks, ...userLinks];
}

/**
 * Merges user notes with Canvas description.
 * User notes (above "From Canvas" separator) are preserved, Canvas section is updated.
 * Adds "Your Notes" header above user content for clarity.
 */
function mergeNotes(existingNotes: string | null, canvasDescription: string | null): string {
  // Convert HTML to plain text
  const canvasContent = htmlToPlainText(canvasDescription);

  if (!existingNotes || existingNotes.trim() === '') {
    // No existing notes - include "Your Notes" header so users know where to add their notes
    return canvasContent ? `${USER_NOTES_HEADER}\n${CANVAS_SEPARATOR}${canvasContent}` : '';
  }

  // Check if "From Canvas" separator exists
  const canvasSeparatorIndex = existingNotes.indexOf('─── From Canvas ───');
  // Check if "Your Notes" header exists
  const userNotesHeaderIndex = existingNotes.indexOf('─── Your Notes ───');

  let userNotes = '';

  if (canvasSeparatorIndex !== -1) {
    // Canvas separator exists - extract user notes (between Your Notes header and Canvas separator)
    if (userNotesHeaderIndex !== -1 && userNotesHeaderIndex < canvasSeparatorIndex) {
      // Both headers exist - user notes are between them
      const afterUserHeader = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length);
      const beforeCanvasSeparator = afterUserHeader.substring(0, afterUserHeader.indexOf('─── From Canvas ───'));
      userNotes = beforeCanvasSeparator.trim();
    } else {
      // Only Canvas separator exists - everything before it is user notes
      userNotes = existingNotes.substring(0, canvasSeparatorIndex).trim();
    }
  } else if (userNotesHeaderIndex !== -1) {
    // Only user notes header exists (no canvas content yet)
    userNotes = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length).trim();
  } else {
    // No separators - check if notes are just old Canvas content
    if (existingNotes.trim() === canvasContent) {
      return canvasContent ? `${USER_NOTES_HEADER}\n${CANVAS_SEPARATOR}${canvasContent}` : '';
    }
    // User has their own notes without any headers
    userNotes = existingNotes.trim();
  }

  // Build the final notes
  // Always include "Your Notes" header when there's Canvas content so users know where to add their notes
  if (!userNotes && !canvasContent) {
    return '';
  }

  if (!userNotes) {
    // Include empty "Your Notes" section so users know where to add their notes
    return canvasContent ? `${USER_NOTES_HEADER}\n${CANVAS_SEPARATOR}${canvasContent}` : '';
  }

  if (!canvasContent) {
    return `${USER_NOTES_HEADER}${userNotes}`;
  }

  return `${USER_NOTES_HEADER}${userNotes}${CANVAS_SEPARATOR}${canvasContent}`;
}

// POST - Sync assignments from Canvas
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
        canvasSyncEnabled: true,
        canvasAutoMarkComplete: true,
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

    // Fetch deleted Canvas assignments to skip during sync
    // Wrapped in try-catch in case migration hasn't been applied yet
    let deletedAssignmentIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedCanvasItem.findMany({
        where: { userId, type: 'assignment' },
        select: { canvasId: true },
      });
      deletedAssignmentIds = new Set(deletedItems.map(d => d.canvasId));
    } catch {
      // Table may not exist yet if migration hasn't been run
      console.log('[Canvas Sync Assignments] DeletedCanvasItem table not available, skipping deletion check');
    }

    // Get all courses with Canvas IDs
    const courses = await prisma.course.findMany({
      where: {
        userId,
        canvasCourseId: { not: null },
      },
      select: { id: true, canvasCourseId: true },
    });

    if (courses.length === 0) {
      return NextResponse.json({
        success: true,
        result,
        message: 'No Canvas courses found. Please sync courses first.',
      });
    }

    for (const course of courses) {
      if (!course.canvasCourseId) continue;

      try {
        const assignments = await client.getAssignments(course.canvasCourseId, {
          include: ['submission'],
          order_by: 'due_at',
        });

        // Get existing work items with Canvas IDs for this course (include notes, links, type for merging)
        const existingWorkItems = await prisma.workItem.findMany({
          where: {
            userId,
            courseId: course.id,
            canvasAssignmentId: { not: null },
          },
          select: { id: true, canvasAssignmentId: true, notes: true, links: true, status: true, type: true },
        });

        const existingWorkItemMap = new Map(
          existingWorkItems.map(d => [d.canvasAssignmentId, { id: d.id, notes: d.notes, links: d.links as Array<{ label: string; url: string }> | null, status: d.status, type: d.type }])
        );

        for (const assignment of assignments) {
          try {
            const canvasAssignmentIdStr = String(assignment.id);

            // Skip if user deleted this assignment
            if (deletedAssignmentIds.has(canvasAssignmentIdStr)) {
              continue;
            }

            const existingWorkItem = existingWorkItemMap.get(canvasAssignmentIdStr);

            // Extract links from Canvas description
            const canvasLinks = extractLinksFromHtml(assignment.description);

            // Add direct link to Canvas assignment
            const canvasAssignmentUrl = `https://${settings.canvasInstanceUrl}/courses/${course.canvasCourseId}/assignments/${assignment.id}`;
            canvasLinks.unshift({ label: 'View on Canvas', url: canvasAssignmentUrl });

            // Check if Canvas shows assignment as complete (submitted or graded)
            // Only consider it complete if auto-mark setting is enabled (defaults to true)
            const submission = assignment.submission;
            const autoMarkEnabled = settings.canvasAutoMarkComplete !== false;
            const isCanvasComplete = autoMarkEnabled && submission && (
              submission.workflow_state === 'submitted' ||
              submission.workflow_state === 'graded' ||
              submission.submitted_at != null
            );

            if (existingWorkItem) {
              // Merge user notes with Canvas description (preserves user notes)
              const mergedNotes = mergeNotes(existingWorkItem.notes, assignment.description);
              // Merge existing links with Canvas links (avoids duplicates)
              const mergedLinks = mergeLinks(existingWorkItem.links, canvasLinks);

              // Determine status update:
              // - If Canvas shows complete AND Orbit shows open → mark as done
              // - Otherwise keep existing status (don't override user's manual completion)
              const statusUpdate = isCanvasComplete && existingWorkItem.status === 'open'
                ? { status: 'done' as const }
                : {};

              // Don't override title or type - user may have customized them
              // Do update dueAt since professors often change due dates
              await prisma.workItem.update({
                where: { id: existingWorkItem.id },
                data: {
                  dueAt: assignment.due_at ? new Date(assignment.due_at) : null,
                  notes: mergedNotes,
                  links: mergedLinks,
                  canvasPointsPossible: assignment.points_possible,
                  ...statusUpdate,
                },
              });
              result.updated++;
            } else {
              // New assignment - use converted plain text for notes
              // Always include both sections so users know where to add their notes
              const canvasContent = htmlToPlainText(assignment.description);
              const initialNotes = canvasContent
                ? `${USER_NOTES_HEADER}\n${CANVAS_SEPARATOR}${canvasContent}`
                : `${USER_NOTES_HEADER}\n`;

              // Create new work item with status based on Canvas completion
              // Default type is 'assignment' for Canvas items
              await prisma.workItem.create({
                data: {
                  userId,
                  courseId: course.id,
                  title: assignment.name,
                  type: 'assignment',
                  dueAt: assignment.due_at ? new Date(assignment.due_at) : null,
                  notes: initialNotes,
                  canvasAssignmentId: canvasAssignmentIdStr,
                  canvasPointsPossible: assignment.points_possible,
                  status: isCanvasComplete ? 'done' : 'open',
                  workingOn: false,
                  pinned: false,
                  tags: [],
                  links: canvasLinks,
                  files: [],
                  checklist: [],
                },
              });
              result.created++;
            }
          } catch (error) {
            result.errors.push(
              `Failed to sync assignment ${assignment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.errors.push(
          `Failed to fetch assignments for course: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Synced ${result.created + result.updated} assignments (${result.created} new, ${result.updated} updated)`,
    });
  } catch (error) {
    console.error('[Canvas Sync Assignments] Error:', error);

    // Check if this is an authentication error (expired token)
    if (error instanceof CanvasAuthError) {
      const session = await getServerSession(authConfig);
      if (session?.user?.id) {
        // Check if we already have an unread token expiry notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            type: 'canvas_token_expired',
            read: false,
          },
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
      { error: 'Failed to sync assignments from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
