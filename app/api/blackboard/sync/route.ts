import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createBlackboardClient,
  decryptToken,
  getAccessToken,
  encryptToken,
  getCurrentTerm,
  BlackboardAuthError,
  htmlToPlainText,
  extractLinksFromHtml,
  mergeLinks,
  mergeNotes,
} from '@/lib/blackboard';

interface SyncResult {
  courses: { created: number; updated: number; errors: string[] };
  assignments: { created: number; updated: number; errors: string[] };
  grades: { updated: number; errors: string[] };
  events: { created: number; updated: number; errors: string[] };
}

// Separators for notes sections
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const BLACKBOARD_SEPARATOR = '\n\n─── From Blackboard ───\n';

// Helper to get the base URL with proper protocol
function getBaseUrl(instanceUrl: string): string {
  const isLocalhost = instanceUrl.includes('localhost') || instanceUrl.includes('127.0.0.1');
  return isLocalhost ? `http://${instanceUrl}` : `https://${instanceUrl}`;
}

/**
 * Refreshes the Blackboard access token if it's expired or about to expire
 */
async function ensureValidToken(
  settings: {
    blackboardInstanceUrl: string;
    blackboardApplicationKey: string;
    blackboardApplicationSecret: string;
    blackboardAccessToken: string;
    blackboardTokenExpiresAt: Date | null;
  },
  userId: string,
  encryptionSecret: string
): Promise<string> {
  const now = new Date();
  const tokenExpiresAt = settings.blackboardTokenExpiresAt;

  // Check if token is expired or will expire within 5 minutes
  const needsRefresh = !tokenExpiresAt || tokenExpiresAt <= new Date(now.getTime() + 5 * 60 * 1000);

  if (!needsRefresh) {
    // Token is still valid, decrypt and return
    return decryptToken(settings.blackboardAccessToken, encryptionSecret);
  }

  // Token needs refresh - get new token
  console.log('[Blackboard Sync] Token expired or expiring soon, refreshing...');

  const applicationKey = decryptToken(settings.blackboardApplicationKey, encryptionSecret);
  const applicationSecret = decryptToken(settings.blackboardApplicationSecret, encryptionSecret);

  const tokenResult = await getAccessToken(
    settings.blackboardInstanceUrl,
    applicationKey,
    applicationSecret
  );

  // Store the new token
  const encryptedAccessToken = encryptToken(tokenResult.token, encryptionSecret);

  await prisma.settings.update({
    where: { userId },
    data: {
      blackboardAccessToken: encryptedAccessToken,
      blackboardTokenExpiresAt: tokenResult.expiresAt,
    },
  });

  return tokenResult.token;
}

// POST - Run a full sync from Blackboard
export const POST = withRateLimit(async function(req: NextRequest) {
  const userId = await getAuthUserId(req);

  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
  }

  try {

    // Get settings with Blackboard credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        blackboardInstanceUrl: true,
        blackboardApplicationKey: true,
        blackboardApplicationSecret: true,
        blackboardAccessToken: true,
        blackboardTokenExpiresAt: true,
        blackboardUserId: true,
        blackboardSyncEnabled: true,
        blackboardSyncCourses: true,
        blackboardSyncAssignments: true,
        blackboardSyncGrades: true,
        blackboardSyncEvents: true,
        blackboardAutoMarkComplete: true,
      },
    });

    if (
      !settings?.blackboardInstanceUrl ||
      !settings?.blackboardApplicationKey ||
      !settings?.blackboardApplicationSecret ||
      !settings?.blackboardAccessToken ||
      !settings?.blackboardSyncEnabled
    ) {
      return NextResponse.json(
        { error: 'Blackboard is not connected. Please connect to Blackboard first.' },
        { status: 400 }
      );
    }

    // Get encryption secret
    const encryptionSecret = process.env.BLACKBOARD_ENCRYPTION_SECRET ||
      process.env.CANVAS_ENCRYPTION_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret';

    // Get valid access token (refresh if needed)
    let accessToken: string;
    try {
      accessToken = await ensureValidToken(
        {
          blackboardInstanceUrl: settings.blackboardInstanceUrl,
          blackboardApplicationKey: settings.blackboardApplicationKey,
          blackboardApplicationSecret: settings.blackboardApplicationSecret,
          blackboardAccessToken: settings.blackboardAccessToken,
          blackboardTokenExpiresAt: settings.blackboardTokenExpiresAt,
        },
        userId,
        encryptionSecret
      );
    } catch (error) {
      console.error('[Blackboard Sync] Failed to get valid token:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Blackboard. Please reconnect.', authError: true },
        { status: 401 }
      );
    }

    // Create Blackboard client
    const client = createBlackboardClient(settings.blackboardInstanceUrl, accessToken);

    // Get request body for sync options
    const body = await req.json().catch(() => ({}));
    const syncOptions = {
      courses: body.syncCourses ?? settings.blackboardSyncCourses ?? true,
      assignments: body.syncAssignments ?? settings.blackboardSyncAssignments ?? true,
      grades: body.syncGrades ?? settings.blackboardSyncGrades ?? true,
      events: body.syncEvents ?? settings.blackboardSyncEvents ?? true,
    };

    const result: SyncResult = {
      courses: { created: 0, updated: 0, errors: [] },
      assignments: { created: 0, updated: 0, errors: [] },
      grades: { updated: 0, errors: [] },
      events: { created: 0, updated: 0, errors: [] },
    };

    // Fetch deleted Blackboard items to skip during sync
    let deletedCourseIds = new Set<string>();
    let deletedAssignmentIds = new Set<string>();
    let deletedEventIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedBlackboardItem.findMany({
        where: { userId },
        select: { blackboardId: true, type: true },
      });
      deletedCourseIds = new Set(deletedItems.filter(d => d.type === 'course').map(d => d.blackboardId));
      deletedAssignmentIds = new Set(deletedItems.filter(d => d.type === 'assignment').map(d => d.blackboardId));
      deletedEventIds = new Set(deletedItems.filter(d => d.type === 'event').map(d => d.blackboardId));
    } catch {
      // Table may not exist yet if migration hasn't been run
      console.log('[Blackboard Sync] DeletedBlackboardItem table not available, skipping deletion check');
    }

    // Map of Blackboard course IDs to College Orbit course IDs
    const courseIdMap = new Map<string, string>();

    // Step 1: Sync Courses
    if (syncOptions.courses) {
      try {
        // Get user's course memberships (enrollments)
        const memberships = await client.getUserMemberships(settings.blackboardUserId || 'me');

        // Filter to only active memberships with course data
        const activeMemberships = memberships.filter(
          m => m.availability?.available === 'Yes' && m.course
        );

        // Get existing courses with Blackboard IDs (include links for merging)
        const existingCourses = await prisma.course.findMany({
          where: {
            userId,
            blackboardCourseId: { not: null },
          },
          select: { id: true, blackboardCourseId: true, links: true },
        });

        const existingCourseMap = new Map(
          existingCourses.map(c => [c.blackboardCourseId, { id: c.id, links: c.links as Array<{ label: string; url: string }> | null }])
        );

        for (const membership of activeMemberships) {
          try {
            const course = membership.course!;
            const blackboardCourseIdStr = course.id;

            // Skip if user deleted this course
            if (deletedCourseIds.has(blackboardCourseIdStr)) {
              continue;
            }

            const existingCourse = existingCourseMap.get(blackboardCourseIdStr);

            // Determine term from Blackboard or use current term
            const term = getCurrentTerm();

            // Create Blackboard course link
            const blackboardCourseUrl = `${getBaseUrl(settings.blackboardInstanceUrl)}/ultra/courses/${course.id}/outline`;
            const blackboardLink = { label: 'View on Blackboard', url: blackboardCourseUrl };

            if (existingCourse) {
              // Course already exists - don't override user-edited fields (name, code, term, dates)
              // Only merge Blackboard link with existing links
              const mergedLinks = mergeLinks(existingCourse.links, [blackboardLink]);

              await prisma.course.update({
                where: { id: existingCourse.id },
                data: {
                  links: mergedLinks,
                },
              });
              courseIdMap.set(blackboardCourseIdStr, existingCourse.id);
              result.courses.updated++;
            } else {
              // Create new course with Blackboard link
              // Parse dates from course availability if available
              const startDate = course.availability?.duration?.start
                ? new Date(course.availability.duration.start)
                : null;
              const endDate = course.availability?.duration?.end
                ? new Date(course.availability.duration.end)
                : null;

              const newCourse = await prisma.course.create({
                data: {
                  userId,
                  name: course.name,
                  code: course.courseId || course.name.substring(0, 10),
                  term,
                  blackboardCourseId: blackboardCourseIdStr,
                  blackboardEnrollmentId: membership.id,
                  startDate,
                  endDate,
                  meetingTimes: [],
                  links: [blackboardLink],
                  files: [],
                },
              });
              courseIdMap.set(blackboardCourseIdStr, newCourse.id);
              result.courses.created++;
            }
          } catch (error) {
            result.courses.errors.push(
              `Failed to sync course ${membership.course?.name || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          blackboardCourseId: { not: null },
        },
        select: { id: true, blackboardCourseId: true },
      });

      for (const course of existingCourses) {
        if (course.blackboardCourseId) {
          courseIdMap.set(course.blackboardCourseId, course.id);
        }
      }
    }

    // Step 2: Sync Assignments (from gradebook columns)
    if (syncOptions.assignments && courseIdMap.size > 0) {
      for (const [blackboardCourseId, courseId] of courseIdMap) {
        try {
          const columns = await client.getGradebookColumns(blackboardCourseId);

          // Filter to graded columns that are available
          const gradedColumns = columns.filter(
            c => c.availability?.available === 'Yes' && c.score?.possible > 0
          );

          // Get existing work items with Blackboard IDs for this course
          const existingWorkItems = await prisma.workItem.findMany({
            where: {
              userId,
              courseId,
              blackboardColumnId: { not: null },
            },
            select: { id: true, blackboardColumnId: true, notes: true, links: true, status: true, type: true },
          });

          const existingWorkItemMap = new Map(
            existingWorkItems.map(d => [d.blackboardColumnId, { id: d.id, notes: d.notes, links: d.links as Array<{ label: string; url: string }> | null, status: d.status, type: d.type }])
          );

          // Get user's grades for all columns in this course
          const userGrades = new Map<string, { score?: number; status?: string; attemptId?: string; gradedAt?: string }>();
          if (syncOptions.grades) {
            for (const column of gradedColumns) {
              try {
                const grade = await client.getUserGrade(blackboardCourseId, column.id, settings.blackboardUserId || 'me');
                userGrades.set(column.id, {
                  score: grade.score ?? grade.displayGrade?.score,
                  status: grade.status,
                  attemptId: grade.attemptId,
                  gradedAt: grade.lastAttempted,
                });
              } catch {
                // Grade not found is normal - user hasn't submitted yet
              }
            }
          }

          for (const column of gradedColumns) {
            try {
              const blackboardColumnIdStr = column.id;

              // Skip if user deleted this assignment
              if (deletedAssignmentIds.has(blackboardColumnIdStr)) {
                continue;
              }

              const existingWorkItem = existingWorkItemMap.get(blackboardColumnIdStr);

              // Extract links from Blackboard HTML description
              const blackboardLinks = extractLinksFromHtml(column.description || '');

              // Add direct link to Blackboard gradebook column
              const blackboardAssignmentUrl = `${getBaseUrl(settings.blackboardInstanceUrl)}/ultra/courses/${blackboardCourseId}/grades/assessment/${column.id}/overview`;
              blackboardLinks.unshift({ label: 'View on Blackboard', url: blackboardAssignmentUrl });

              // Get grade data if syncing grades
              const gradeInfo = userGrades.get(column.id);
              const gradeData = syncOptions.grades && gradeInfo
                ? {
                    blackboardAttemptId: gradeInfo.attemptId || null,
                    blackboardPointsEarned: gradeInfo.score ?? null,
                    blackboardGradePostedAt: gradeInfo.gradedAt ? new Date(gradeInfo.gradedAt) : null,
                  }
                : {};

              // Check if Blackboard shows assignment as complete (has attempt or graded)
              const isBlackboardComplete = gradeInfo && (
                gradeInfo.status === 'Graded' ||
                gradeInfo.attemptId != null ||
                gradeInfo.score != null
              );

              // Parse due date from grading info
              const dueAt = column.grading?.due ? new Date(column.grading.due) : null;

              if (existingWorkItem) {
                // Merge user notes with Blackboard description (preserves user notes)
                const mergedNotesContent = mergeNotes(existingWorkItem.notes, column.description || null);
                // Merge existing links with Blackboard links (avoids duplicates)
                const mergedLinksContent = mergeLinks(existingWorkItem.links, blackboardLinks);

                // Determine status update:
                // - If Blackboard shows complete AND Orbit shows open -> mark as done
                // - Otherwise keep existing status (don't override user's manual completion)
                const statusUpdate = isBlackboardComplete && existingWorkItem.status === 'open'
                  ? { status: 'done' as const }
                  : {};

                // Don't override title or type - user may have customized them
                // Do update dueAt since professors often change due dates
                await prisma.workItem.update({
                  where: { id: existingWorkItem.id },
                  data: {
                    dueAt,
                    notes: mergedNotesContent,
                    links: mergedLinksContent,
                    blackboardPointsPossible: column.score.possible,
                    ...gradeData,
                    ...statusUpdate,
                  },
                });
                result.assignments.updated++;
                if (syncOptions.grades && gradeInfo?.score != null) {
                  result.grades.updated++;
                }
              } else {
                // New assignment - use converted plain text for notes
                const blackboardContent = htmlToPlainText(column.description || '');
                const initialNotes = blackboardContent
                  ? `${USER_NOTES_HEADER}\n${BLACKBOARD_SEPARATOR}${blackboardContent}`
                  : `${USER_NOTES_HEADER}\n`;

                // Create new work item with status based on Blackboard completion
                await prisma.workItem.create({
                  data: {
                    userId,
                    courseId,
                    title: column.name,
                    type: 'assignment',
                    dueAt,
                    notes: initialNotes,
                    blackboardColumnId: blackboardColumnIdStr,
                    blackboardPointsPossible: column.score.possible,
                    status: isBlackboardComplete ? 'done' : 'open',
                    workingOn: false,
                    pinned: false,
                    tags: [],
                    links: blackboardLinks,
                    files: [],
                    checklist: [],
                    ...gradeData,
                  },
                });
                result.assignments.created++;
                if (syncOptions.grades && gradeInfo?.score != null) {
                  result.grades.updated++;
                }
              }
            } catch (error) {
              result.assignments.errors.push(
                `Failed to sync assignment ${column.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
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

        const events = await client.getCalendarItems({
          since: startDate.toISOString(),
          until: endDate.toISOString(),
        });

        // Get existing calendar events with Blackboard IDs
        const existingEvents = await prisma.calendarEvent.findMany({
          where: {
            userId,
            blackboardEventId: { not: null },
          },
          select: { id: true, blackboardEventId: true },
        });

        const existingEventMap = new Map(
          existingEvents.map(e => [e.blackboardEventId, e.id])
        );

        for (const event of events) {
          try {
            const blackboardEventIdStr = event.id;

            // Skip if user deleted this event
            if (deletedEventIds.has(blackboardEventIdStr)) {
              continue;
            }

            const existingEventId = existingEventMap.get(blackboardEventIdStr);

            // Convert HTML description to plain text
            const cleanDescription = htmlToPlainText(event.description || '');

            if (existingEventId) {
              // Don't override title/description - user may have customized them
              // Do update times and location since those may change
              await prisma.calendarEvent.update({
                where: { id: existingEventId },
                data: {
                  startAt: new Date(event.start),
                  endAt: event.end ? new Date(event.end) : null,
                  location: event.location,
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
                  startAt: new Date(event.start),
                  endAt: event.end ? new Date(event.end) : null,
                  allDay: false, // Blackboard doesn't have all-day flag in same way
                  location: event.location,
                  blackboardEventId: blackboardEventIdStr,
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

    // Update last synced timestamp
    await prisma.settings.update({
      where: { userId },
      data: {
        blackboardLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Blackboard sync completed',
    });
  } catch (error) {
    console.error('[Blackboard Sync] Error:', error);

    // Check if this is an authentication error (expired token)
    if (error instanceof BlackboardAuthError) {
      // Create a notification for the user about the expired token
      if (userId) {
        // Check if we already have an unread token expiry notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId,
            type: 'blackboard_token_expired',
            read: false,
          },
        });

        // Only create a new notification if there isn't an unread one
        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'Blackboard Connection Expired',
              message: 'Your Blackboard access token has expired. Please go to Settings to reconnect your Blackboard account.',
              type: 'blackboard_token_expired',
              read: false,
            },
          });
        }
      }

      return NextResponse.json(
        { error: 'Your Blackboard access token has expired. Please reconnect your Blackboard account in Settings.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync from Blackboard. Please try again.' },
      { status: 500 }
    );
  }
});
