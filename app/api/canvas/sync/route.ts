import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import { createCanvasClient, decryptToken, getCurrentTerm, CanvasAuthError } from '@/lib/canvas';

interface SyncResult {
  courses: { created: number; updated: number; errors: string[] };
  assignments: { created: number; updated: number; errors: string[] };
  grades: { updated: number; errors: string[] };
  events: { created: number; updated: number; errors: string[] };
  announcements: { created: number; errors: string[] };
}

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

// POST - Run a full sync from Canvas
export const POST = withRateLimit(async function(req: NextRequest) {
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
        canvasSyncCourses: true,
        canvasSyncAssignments: true,
        canvasSyncGrades: true,
        canvasSyncEvents: true,
        canvasSyncAnnouncements: true,
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
      console.error('[Canvas Sync] Failed to decrypt token:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Canvas. Please reconnect.' },
        { status: 400 }
      );
    }

    // Create Canvas client
    const client = createCanvasClient(settings.canvasInstanceUrl, accessToken);

    // Get request body for sync options
    const body = await req.json().catch(() => ({}));
    const syncOptions = {
      courses: body.syncCourses ?? settings.canvasSyncCourses ?? true,
      assignments: body.syncAssignments ?? settings.canvasSyncAssignments ?? true,
      grades: body.syncGrades ?? settings.canvasSyncGrades ?? true,
      events: body.syncEvents ?? settings.canvasSyncEvents ?? true,
      announcements: body.syncAnnouncements ?? settings.canvasSyncAnnouncements ?? true,
    };

    const result: SyncResult = {
      courses: { created: 0, updated: 0, errors: [] },
      assignments: { created: 0, updated: 0, errors: [] },
      grades: { updated: 0, errors: [] },
      events: { created: 0, updated: 0, errors: [] },
      announcements: { created: 0, errors: [] },
    };

    // Fetch deleted Canvas items to skip during sync
    // Wrapped in try-catch in case migration hasn't been applied yet
    let deletedCourseIds = new Set<string>();
    let deletedAssignmentIds = new Set<string>();
    let deletedEventIds = new Set<string>();
    let deletedAnnouncementIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedCanvasItem.findMany({
        where: { userId },
        select: { canvasId: true, type: true },
      });
      deletedCourseIds = new Set(deletedItems.filter(d => d.type === 'course').map(d => d.canvasId));
      deletedAssignmentIds = new Set(deletedItems.filter(d => d.type === 'assignment').map(d => d.canvasId));
      deletedEventIds = new Set(deletedItems.filter(d => d.type === 'event').map(d => d.canvasId));
      deletedAnnouncementIds = new Set(deletedItems.filter(d => d.type === 'announcement').map(d => d.canvasId));
    } catch {
      // Table may not exist yet if migration hasn't been run
      console.log('[Canvas Sync] DeletedCanvasItem table not available, skipping deletion check');
    }

    // Map of Canvas course IDs to College Orbit course IDs
    const courseIdMap = new Map<string, string>();

    // Step 1: Sync Courses
    if (syncOptions.courses) {
      try {
        const canvasCourses = await client.getCourses({
          enrollment_state: 'active',
          include: ['term', 'enrollments'],
        });

        // Get existing courses with Canvas IDs (include links for merging)
        const existingCourses = await prisma.course.findMany({
          where: {
            userId,
            canvasCourseId: { not: null },
          },
          select: { id: true, canvasCourseId: true, links: true },
        });

        const existingCourseMap = new Map(
          existingCourses.map(c => [c.canvasCourseId, { id: c.id, links: c.links as Array<{ label: string; url: string }> | null }])
        );

        for (const canvasCourse of canvasCourses) {
          try {
            const canvasCourseIdStr = String(canvasCourse.id);

            // Skip if user deleted this course
            if (deletedCourseIds.has(canvasCourseIdStr)) {
              continue;
            }

            const existingCourse = existingCourseMap.get(canvasCourseIdStr);

            // Determine term from Canvas or use current term
            const term = getCurrentTerm();

            // Create Canvas course link
            const canvasCourseUrl = `https://${settings.canvasInstanceUrl}/courses/${canvasCourse.id}`;
            const canvasLink = { label: 'View on Canvas', url: canvasCourseUrl };

            if (existingCourse) {
              // Course already exists - don't override user-edited fields (name, code, term, dates)
              // Only merge Canvas link with existing links
              const mergedLinks = mergeLinks(existingCourse.links, [canvasLink]);

              await prisma.course.update({
                where: { id: existingCourse.id },
                data: {
                  links: mergedLinks,
                },
              });
              courseIdMap.set(canvasCourseIdStr, existingCourse.id);
              result.courses.updated++;
            } else {
              // Create new course with Canvas link
              const newCourse = await prisma.course.create({
                data: {
                  userId,
                  name: canvasCourse.name,
                  code: canvasCourse.course_code,
                  term,
                  canvasCourseId: canvasCourseIdStr,
                  canvasEnrollmentId: canvasCourse.enrollments?.[0]?.id
                    ? String(canvasCourse.enrollments[0].id)
                    : null,
                  startDate: canvasCourse.start_at ? new Date(canvasCourse.start_at) : null,
                  endDate: canvasCourse.end_at ? new Date(canvasCourse.end_at) : null,
                  // No colorTag - Canvas courses use the default blue like regular courses
                  meetingTimes: [],
                  links: [canvasLink],
                  files: [],
                },
              });
              courseIdMap.set(canvasCourseIdStr, newCourse.id);
              result.courses.created++;
            }
          } catch (error) {
            result.courses.errors.push(
              `Failed to sync course ${canvasCourse.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.courses.errors.push(
          `Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Build course ID map from existing courses if we didn't sync courses
    if (!syncOptions.courses || courseIdMap.size === 0) {
      const existingCourses = await prisma.course.findMany({
        where: {
          userId,
          canvasCourseId: { not: null },
        },
        select: { id: true, canvasCourseId: true },
      });

      for (const course of existingCourses) {
        if (course.canvasCourseId) {
          courseIdMap.set(course.canvasCourseId, course.id);
        }
      }
    }

    // Step 2: Sync Assignments
    if (syncOptions.assignments && courseIdMap.size > 0) {
      for (const [canvasCourseId, courseId] of courseIdMap) {
        try {
          const assignments = await client.getAssignments(canvasCourseId, {
            include: ['submission'],
            order_by: 'due_at',
          });

          // Get existing deadlines with Canvas IDs for this course (include notes, links, and status for merging)
          const existingDeadlines = await prisma.deadline.findMany({
            where: {
              userId,
              courseId,
              canvasAssignmentId: { not: null },
            },
            select: { id: true, canvasAssignmentId: true, notes: true, links: true, status: true },
          });

          const existingDeadlineMap = new Map(
            existingDeadlines.map(d => [d.canvasAssignmentId, { id: d.id, notes: d.notes, links: d.links as Array<{ label: string; url: string }> | null, status: d.status }])
          );

          for (const assignment of assignments) {
            try {
              const canvasAssignmentIdStr = String(assignment.id);

              // Skip if user deleted this assignment
              if (deletedAssignmentIds.has(canvasAssignmentIdStr)) {
                continue;
              }

              const existingDeadline = existingDeadlineMap.get(canvasAssignmentIdStr);

              // Extract links from Canvas HTML description
              const canvasLinks = extractLinksFromHtml(assignment.description);

              // Add direct link to Canvas assignment
              const canvasAssignmentUrl = `https://${settings.canvasInstanceUrl}/courses/${canvasCourseId}/assignments/${assignment.id}`;
              canvasLinks.unshift({ label: 'View on Canvas', url: canvasAssignmentUrl });

              // Build submission data if syncing grades
              const gradeData = syncOptions.grades && assignment.submission
                ? {
                    canvasSubmissionId: String(assignment.submission.id),
                    canvasPointsEarned: assignment.submission.score,
                    canvasGradePostedAt: assignment.submission.graded_at
                      ? new Date(assignment.submission.graded_at)
                      : null,
                  }
                : {};

              // Check if Canvas shows assignment as complete (submitted or graded)
              const submission = assignment.submission;
              const isCanvasComplete = submission && (
                submission.workflow_state === 'submitted' ||
                submission.workflow_state === 'graded' ||
                submission.submitted_at != null
              );

              if (existingDeadline) {
                // Merge user notes with Canvas description (preserves user notes)
                const mergedNotesContent = mergeNotes(existingDeadline.notes, assignment.description);
                // Merge existing links with Canvas links (avoids duplicates)
                const mergedLinksContent = mergeLinks(existingDeadline.links, canvasLinks);

                // Determine status update:
                // - If Canvas shows complete AND Orbit shows open → mark as done
                // - Otherwise keep existing status (don't override user's manual completion)
                const statusUpdate = isCanvasComplete && existingDeadline.status === 'open'
                  ? { status: 'done' as const }
                  : {};

                // Don't override title - user may have customized it
                // Do update dueAt since professors often change due dates
                await prisma.deadline.update({
                  where: { id: existingDeadline.id },
                  data: {
                    dueAt: assignment.due_at ? new Date(assignment.due_at) : null,
                    notes: mergedNotesContent,
                    links: mergedLinksContent,
                    canvasPointsPossible: assignment.points_possible,
                    ...gradeData,
                    ...statusUpdate,
                  },
                });
                result.assignments.updated++;
                if (syncOptions.grades && assignment.submission?.score !== null) {
                  result.grades.updated++;
                }
              } else {
                // New assignment - use converted plain text for notes
                // Always include both sections so users know where to add their notes
                const canvasContent = htmlToPlainText(assignment.description);
                const initialNotes = canvasContent
                  ? `${USER_NOTES_HEADER}\n${CANVAS_SEPARATOR}${canvasContent}`
                  : `${USER_NOTES_HEADER}\n`;

                // Create new deadline with status based on Canvas completion
                await prisma.deadline.create({
                  data: {
                    userId,
                    courseId,
                    title: assignment.name,
                    dueAt: assignment.due_at ? new Date(assignment.due_at) : null,
                    notes: initialNotes,
                    canvasAssignmentId: canvasAssignmentIdStr,
                    canvasPointsPossible: assignment.points_possible,
                    status: isCanvasComplete ? 'done' : 'open',
                    workingOn: false,
                    tags: [],
                    links: canvasLinks,
                    files: [],
                    ...gradeData,
                  },
                });
                result.assignments.created++;
                if (syncOptions.grades && assignment.submission?.score !== null) {
                  result.grades.updated++;
                }
              }
            } catch (error) {
              result.assignments.errors.push(
                `Failed to sync assignment ${assignment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        } catch (error) {
          result.assignments.errors.push(
            `Failed to fetch assignments for course: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Step 3: Sync Calendar Events
    if (syncOptions.events) {
      try {
        // Get events for the next 3 months
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        const contextCodes = Array.from(courseIdMap.keys()).map(id => `course_${id}`);
        if (settings.canvasUserId) {
          contextCodes.push(`user_${settings.canvasUserId}`);
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

            // Skip if user deleted this event
            if (deletedEventIds.has(canvasEventIdStr)) {
              continue;
            }

            const existingEventId = existingEventMap.get(canvasEventIdStr);

            // Convert HTML description to plain text
            const cleanDescription = htmlToPlainText(event.description);

            if (existingEventId) {
              // Don't override title/description - user may have customized them
              // Do update times and location since those may change
              await prisma.calendarEvent.update({
                where: { id: existingEventId },
                data: {
                  startAt: new Date(event.start_at),
                  endAt: event.end_at ? new Date(event.end_at) : null,
                  allDay: event.all_day,
                  location: event.location_name,
                },
              });
              result.events.updated++;
            } else {
              // Create new event
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
              result.events.created++;
            }
          } catch (error) {
            result.events.errors.push(
              `Failed to sync event ${event.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.events.errors.push(
          `Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Step 4: Sync Announcements
    if (syncOptions.announcements && courseIdMap.size > 0) {
      try {
        const contextCodes = Array.from(courseIdMap.keys()).map(id => `course_${id}`);

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

            // Skip if user deleted this announcement
            if (deletedAnnouncementIds.has(canvasAnnouncementIdStr)) {
              continue;
            }

            // Create new notification for the announcement
            // Convert HTML to clean plain text
            const plainMessage = htmlToPlainText(announcement.message).substring(0, 500);

            // Only mark as unread if posted within the last 48 hours
            const postedAt = new Date(announcement.posted_at);
            const fortyEightHoursAgo = new Date();
            fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
            const isRecent = postedAt > fortyEightHoursAgo;

            await prisma.notification.create({
              data: {
                userId,
                title: announcement.title,
                message: `From ${announcement.user_name}: ${plainMessage}`,
                type: 'canvas_announcement',
                read: !isRecent, // Mark older announcements as already read
                canvasAnnouncementId: canvasAnnouncementIdStr,
              },
            });
            result.announcements.created++;
          } catch (error) {
            result.announcements.errors.push(
              `Failed to sync announcement ${announcement.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.announcements.errors.push(
          `Failed to fetch announcements: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last synced timestamp
    await prisma.settings.update({
      where: { userId },
      data: {
        canvasLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Canvas sync completed',
    });
  } catch (error) {
    console.error('[Canvas Sync] Error:', error);

    // Check if this is an authentication error (expired token)
    if (error instanceof CanvasAuthError) {
      // Get the session to create a notification for the user
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

        // Only create a new notification if there isn't an unread one
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
      { error: 'Failed to sync from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
