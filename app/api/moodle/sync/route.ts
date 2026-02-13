import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createMoodleClient,
  decryptToken,
  getCurrentTerm,
  MoodleAuthError,
  htmlToPlainText,
  extractLinksFromHtml,
  mergeLinks,
  mergeNotes,
} from '@/lib/moodle';

interface SyncResult {
  courses: { created: number; updated: number; errors: string[] };
  assignments: { created: number; updated: number; errors: string[] };
  grades: { updated: number; errors: string[] };
  events: { created: number; updated: number; errors: string[] };
  announcements: { created: number; errors: string[] };
}

// Separators for notes sections
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const MOODLE_SEPARATOR = '\n\n─── From Moodle ───\n';

// Helper to get the base URL with proper protocol
function getBaseUrl(instanceUrl: string): string {
  const isLocalhost = instanceUrl.includes('localhost') || instanceUrl.includes('127.0.0.1');
  return isLocalhost ? `http://${instanceUrl}` : `https://${instanceUrl}`;
}

// POST - Run a full sync from Moodle
export const POST = withRateLimit(async function(req: NextRequest) {
  const userId = await getAuthUserId(req);

  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
  }

  try {

    // Get settings with Moodle credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        moodleInstanceUrl: true,
        moodleAccessToken: true,
        moodleUserId: true,
        moodleSyncEnabled: true,
        moodleSyncCourses: true,
        moodleSyncAssignments: true,
        moodleSyncGrades: true,
        moodleSyncEvents: true,
        moodleSyncAnnouncements: true,
        moodleAutoMarkComplete: true,
      },
    });

    if (
      !settings?.moodleInstanceUrl ||
      !settings?.moodleAccessToken ||
      !settings?.moodleSyncEnabled
    ) {
      return NextResponse.json(
        { error: 'Moodle is not connected. Please connect to Moodle first.' },
        { status: 400 }
      );
    }

    // Get encryption secret
    const encryptionSecret = process.env.MOODLE_ENCRYPTION_SECRET ||
      process.env.CANVAS_ENCRYPTION_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret';

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = decryptToken(settings.moodleAccessToken, encryptionSecret);
    } catch (error) {
      console.error('[Moodle Sync] Failed to decrypt token:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Moodle. Please reconnect.', authError: true },
        { status: 401 }
      );
    }

    // Create Moodle client
    const client = createMoodleClient(settings.moodleInstanceUrl, accessToken);

    // Get request body for sync options
    const body = await req.json().catch(() => ({}));
    const syncOptions = {
      courses: body.syncCourses ?? settings.moodleSyncCourses ?? true,
      assignments: body.syncAssignments ?? settings.moodleSyncAssignments ?? true,
      grades: body.syncGrades ?? settings.moodleSyncGrades ?? true,
      events: body.syncEvents ?? settings.moodleSyncEvents ?? true,
      announcements: body.syncAnnouncements ?? settings.moodleSyncAnnouncements ?? true,
    };

    const result: SyncResult = {
      courses: { created: 0, updated: 0, errors: [] },
      assignments: { created: 0, updated: 0, errors: [] },
      grades: { updated: 0, errors: [] },
      events: { created: 0, updated: 0, errors: [] },
      announcements: { created: 0, errors: [] },
    };

    // Fetch deleted Moodle items to skip during sync
    let deletedCourseIds = new Set<string>();
    let deletedAssignmentIds = new Set<string>();
    let deletedEventIds = new Set<string>();
    let deletedAnnouncementIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedMoodleItem.findMany({
        where: { userId },
        select: { moodleId: true, type: true },
      });
      deletedCourseIds = new Set(deletedItems.filter(d => d.type === 'course').map(d => d.moodleId));
      deletedAssignmentIds = new Set(deletedItems.filter(d => d.type === 'assignment').map(d => d.moodleId));
      deletedEventIds = new Set(deletedItems.filter(d => d.type === 'event').map(d => d.moodleId));
      deletedAnnouncementIds = new Set(deletedItems.filter(d => d.type === 'announcement').map(d => d.moodleId));
    } catch {
      console.log('[Moodle Sync] DeletedMoodleItem table not available, skipping deletion check');
    }

    // Map of Moodle course IDs to College Orbit course IDs
    const courseIdMap = new Map<number, string>();

    // Step 1: Sync Courses
    if (syncOptions.courses) {
      try {
        const moodleCourses = await client.getUserCourses(
          settings.moodleUserId ? parseInt(settings.moodleUserId) : undefined
        );

        // Get existing courses with Moodle IDs
        const existingCourses = await prisma.course.findMany({
          where: {
            userId,
            moodleCourseId: { not: null },
          },
          select: { id: true, moodleCourseId: true, links: true },
        });

        const existingCourseMap = new Map(
          existingCourses.map(c => [c.moodleCourseId, { id: c.id, links: c.links as Array<{ label: string; url: string }> | null }])
        );

        for (const course of moodleCourses) {
          try {
            const moodleCourseIdStr = String(course.id);

            if (deletedCourseIds.has(moodleCourseIdStr)) {
              continue;
            }

            const existingCourse = existingCourseMap.get(moodleCourseIdStr);
            const term = getCurrentTerm();

            // Create Moodle course link
            const moodleCourseUrl = `${getBaseUrl(settings.moodleInstanceUrl)}/course/view.php?id=${course.id}`;
            const moodleLink = { label: 'View on Moodle', url: moodleCourseUrl };

            if (existingCourse) {
              // Update existing course - only merge links
              const mergedLinks = mergeLinks(existingCourse.links, [moodleLink]);

              await prisma.course.update({
                where: { id: existingCourse.id },
                data: { links: mergedLinks },
              });
              courseIdMap.set(course.id, existingCourse.id);
              result.courses.updated++;
            } else {
              // Create new course
              const startDate = course.startdate ? new Date(course.startdate * 1000) : null;
              const endDate = course.enddate ? new Date(course.enddate * 1000) : null;

              const newCourse = await prisma.course.create({
                data: {
                  userId,
                  name: course.fullname,
                  code: course.shortname || course.fullname.substring(0, 10),
                  term,
                  moodleCourseId: moodleCourseIdStr,
                  startDate,
                  endDate,
                  meetingTimes: [],
                  links: [moodleLink],
                  files: [],
                },
              });
              courseIdMap.set(course.id, newCourse.id);
              result.courses.created++;
            }
          } catch (error) {
            result.courses.errors.push(
              `Failed to sync course ${course.fullname}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          moodleCourseId: { not: null },
        },
        select: { id: true, moodleCourseId: true },
      });

      for (const course of existingCourses) {
        if (course.moodleCourseId) {
          courseIdMap.set(parseInt(course.moodleCourseId), course.id);
        }
      }
    }

    // Step 2: Sync Assignments
    if (syncOptions.assignments && courseIdMap.size > 0) {
      try {
        const courseIds = Array.from(courseIdMap.keys());
        const assignmentsResponse = await client.getCourseAssignments(courseIds);

        for (const courseData of assignmentsResponse.courses || []) {
          const orbitCourseId = courseIdMap.get(courseData.id);
          if (!orbitCourseId) continue;

          // Get existing work items for this course
          const existingWorkItems = await prisma.workItem.findMany({
            where: {
              userId,
              courseId: orbitCourseId,
              moodleAssignmentId: { not: null },
            },
            select: { id: true, moodleAssignmentId: true, notes: true, links: true, status: true },
          });

          const existingWorkItemMap = new Map(
            existingWorkItems.map(w => [w.moodleAssignmentId, w])
          );

          for (const assignment of courseData.assignments || []) {
            try {
              const moodleAssignmentIdStr = String(assignment.id);

              if (deletedAssignmentIds.has(moodleAssignmentIdStr)) {
                continue;
              }

              const existingWorkItem = existingWorkItemMap.get(moodleAssignmentIdStr);

              // Extract links from Moodle description
              const moodleLinks = extractLinksFromHtml(assignment.intro || '');
              const moodleAssignmentUrl = `${getBaseUrl(settings.moodleInstanceUrl)}/mod/assign/view.php?id=${assignment.cmid}`;
              moodleLinks.unshift({ label: 'View on Moodle', url: moodleAssignmentUrl });

              // Parse due date
              const dueAt = assignment.duedate ? new Date(assignment.duedate * 1000) : null;

              if (existingWorkItem) {
                const mergedNotesContent = mergeNotes(existingWorkItem.notes, assignment.intro || null);
                const mergedLinksContent = mergeLinks(existingWorkItem.links as Array<{ label: string; url: string }> | null, moodleLinks);

                await prisma.workItem.update({
                  where: { id: existingWorkItem.id },
                  data: {
                    dueAt,
                    notes: mergedNotesContent,
                    links: mergedLinksContent,
                    moodlePointsPossible: assignment.grade > 0 ? assignment.grade : null,
                  },
                });
                result.assignments.updated++;
              } else {
                const moodleContent = htmlToPlainText(assignment.intro || '');
                const initialNotes = moodleContent
                  ? `${USER_NOTES_HEADER}\n${MOODLE_SEPARATOR}${moodleContent}`
                  : `${USER_NOTES_HEADER}\n`;

                await prisma.workItem.create({
                  data: {
                    userId,
                    courseId: orbitCourseId,
                    title: assignment.name,
                    type: 'assignment',
                    dueAt,
                    notes: initialNotes,
                    moodleAssignmentId: moodleAssignmentIdStr,
                    moodlePointsPossible: assignment.grade > 0 ? assignment.grade : null,
                    status: 'open',
                    workingOn: false,
                    pinned: false,
                    tags: [],
                    links: moodleLinks,
                    files: [],
                    checklist: [],
                  },
                });
                result.assignments.created++;
              }
            } catch (error) {
              result.assignments.errors.push(
                `Failed to sync assignment ${assignment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
      } catch (error) {
        result.assignments.errors.push(
          `Failed to fetch assignments: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Step 3: Sync Grades
    if (syncOptions.grades && courseIdMap.size > 0) {
      for (const [moodleCourseId, orbitCourseId] of courseIdMap) {
        try {
          const gradesResponse = await client.getUserGrades(
            moodleCourseId,
            settings.moodleUserId ? parseInt(settings.moodleUserId) : undefined
          );

          for (const userGrade of gradesResponse.usergrades || []) {
            for (const gradeItem of userGrade.gradeitems || []) {
              if (gradeItem.itemtype !== 'mod' || gradeItem.itemmodule !== 'assign') continue;
              if (!gradeItem.iteminstance) continue;

              // Find the work item by Moodle assignment ID
              const workItem = await prisma.workItem.findFirst({
                where: {
                  userId,
                  courseId: orbitCourseId,
                  moodleAssignmentId: String(gradeItem.iteminstance),
                },
              });

              if (workItem && gradeItem.graderaw !== undefined) {
                await prisma.workItem.update({
                  where: { id: workItem.id },
                  data: {
                    moodlePointsEarned: gradeItem.graderaw,
                    moodleGradePostedAt: new Date(),
                    // One-way completion: only mark done if currently open
                    ...(workItem.status === 'open' && gradeItem.graderaw !== null
                      ? { status: 'done' }
                      : {}),
                  },
                });
                result.grades.updated++;
              }
            }
          }
        } catch (error) {
          result.grades.errors.push(
            `Failed to fetch grades for course: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Step 4: Sync Calendar Events
    if (syncOptions.events) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const threeMonthsFromNow = now + (90 * 24 * 60 * 60);

        const eventsResponse = await client.getCalendarEvents({
          timestart: now,
          timeend: threeMonthsFromNow,
          courseids: Array.from(courseIdMap.keys()),
        });

        // Get existing calendar events with Moodle IDs
        const existingEvents = await prisma.calendarEvent.findMany({
          where: {
            userId,
            moodleEventId: { not: null },
          },
          select: { id: true, moodleEventId: true },
        });

        const existingEventMap = new Map(
          existingEvents.map(e => [e.moodleEventId, e.id])
        );

        for (const event of eventsResponse.events || []) {
          try {
            const moodleEventIdStr = String(event.id);

            if (deletedEventIds.has(moodleEventIdStr)) {
              continue;
            }

            const existingEventId = existingEventMap.get(moodleEventIdStr);
            const cleanDescription = htmlToPlainText(event.description || '');

            if (existingEventId) {
              await prisma.calendarEvent.update({
                where: { id: existingEventId },
                data: {
                  startAt: new Date(event.timestart * 1000),
                  endAt: event.timeduration
                    ? new Date((event.timestart + event.timeduration) * 1000)
                    : null,
                },
              });
              result.events.updated++;
            } else {
              await prisma.calendarEvent.create({
                data: {
                  userId,
                  title: event.name,
                  description: cleanDescription,
                  startAt: new Date(event.timestart * 1000),
                  endAt: event.timeduration
                    ? new Date((event.timestart + event.timeduration) * 1000)
                    : null,
                  allDay: false,
                  moodleEventId: moodleEventIdStr,
                },
              });
              result.events.created++;
            }
          } catch (error) {
            result.events.errors.push(
              `Failed to sync event ${event.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.events.errors.push(
          `Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Step 5: Sync Announcements (from course forums)
    if (syncOptions.announcements && courseIdMap.size > 0) {
      for (const [moodleCourseId] of courseIdMap) {
        try {
          const forums = await client.getCourseForums(moodleCourseId);

          // Find the announcements forum (usually type = 'news')
          const announcementForum = forums.find(f => f.type === 'news');
          if (!announcementForum) continue;

          const discussionsResponse = await client.getForumDiscussions(announcementForum.id);

          for (const discussion of discussionsResponse.discussions || []) {
            try {
              const moodleAnnouncementIdStr = String(discussion.id);

              if (deletedAnnouncementIds.has(moodleAnnouncementIdStr)) {
                continue;
              }

              // Check if notification already exists
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  userId,
                  type: 'moodle_announcement',
                  // Use message field to store the Moodle discussion ID
                  message: { contains: `moodle:${moodleAnnouncementIdStr}` },
                },
              });

              if (!existingNotification) {
                // Get the first post for the announcement content
                const postsResponse = await client.getDiscussionPosts(discussion.id);
                const firstPost = postsResponse.posts?.[0];

                const cleanMessage = htmlToPlainText(firstPost?.message || '');

                await prisma.notification.create({
                  data: {
                    userId,
                    title: discussion.name,
                    message: `moodle:${moodleAnnouncementIdStr}\n${cleanMessage.substring(0, 500)}`,
                    type: 'moodle_announcement',
                    read: false,
                  },
                });
                result.announcements.created++;
              }
            } catch (error) {
              result.announcements.errors.push(
                `Failed to sync announcement ${discussion.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        } catch (error) {
          // Some courses may not have forums
          console.log(`[Moodle Sync] Could not fetch forums for course ${moodleCourseId}:`, error);
        }
      }
    }

    // Update last synced timestamp
    await prisma.settings.update({
      where: { userId },
      data: {
        moodleLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Moodle sync completed',
    });
  } catch (error) {
    console.error('[Moodle Sync] Error:', error);

    if (error instanceof MoodleAuthError) {
      if (userId) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId,
            type: 'moodle_token_expired',
            read: false,
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'Moodle Connection Expired',
              message: 'Your Moodle access token has expired or is invalid. Please go to Settings to reconnect your Moodle account.',
              type: 'moodle_token_expired',
              read: false,
            },
          });
        }
      }

      return NextResponse.json(
        { error: 'Your Moodle access token has expired. Please reconnect your Moodle account in Settings.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync from Moodle. Please try again.' },
      { status: 500 }
    );
  }
});
