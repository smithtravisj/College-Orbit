import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createBrightspaceClient,
  decryptToken,
  getAccessToken,
  encryptToken,
  getCurrentTerm,
  BrightspaceAuthError,
  htmlToPlainText,
  extractLinksFromHtml,
  mergeLinks,
  mergeNotes,
} from '@/lib/brightspace';

interface SyncResult {
  courses: { created: number; updated: number; errors: string[] };
  assignments: { created: number; updated: number; errors: string[] };
  grades: { updated: number; errors: string[] };
  events: { created: number; updated: number; errors: string[] };
  announcements: { created: number; errors: string[] };
}

// Separators for notes sections
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const BRIGHTSPACE_SEPARATOR = '\n\n─── From Brightspace ───\n';

// Helper to get the base URL with proper protocol
function getBaseUrl(instanceUrl: string): string {
  const isLocalhost = instanceUrl.includes('localhost') || instanceUrl.includes('127.0.0.1');
  return isLocalhost ? `http://${instanceUrl}` : `https://${instanceUrl}`;
}

/**
 * Refreshes the Brightspace access token if it's expired or about to expire
 */
async function ensureValidToken(
  settings: {
    brightspaceInstanceUrl: string;
    brightspaceClientId: string;
    brightspaceClientSecret: string;
    brightspaceAccessToken: string;
    brightspaceRefreshToken: string | null;
    brightspaceTokenExpiresAt: Date | null;
  },
  userId: string,
  encryptionSecret: string
): Promise<string> {
  const now = new Date();
  const tokenExpiresAt = settings.brightspaceTokenExpiresAt;

  // Check if token is expired or will expire within 5 minutes
  const needsRefresh = !tokenExpiresAt || tokenExpiresAt <= new Date(now.getTime() + 5 * 60 * 1000);

  if (!needsRefresh) {
    return decryptToken(settings.brightspaceAccessToken, encryptionSecret);
  }

  console.log('[Brightspace Sync] Token expired or expiring soon, refreshing...');

  const clientId = decryptToken(settings.brightspaceClientId, encryptionSecret);
  const clientSecret = decryptToken(settings.brightspaceClientSecret, encryptionSecret);
  const refreshToken = settings.brightspaceRefreshToken
    ? decryptToken(settings.brightspaceRefreshToken, encryptionSecret)
    : undefined;

  const tokenResult = await getAccessToken(
    settings.brightspaceInstanceUrl,
    clientId,
    clientSecret,
    refreshToken
  );

  const encryptedAccessToken = encryptToken(tokenResult.accessToken, encryptionSecret);
  const encryptedRefreshToken = tokenResult.refreshToken
    ? encryptToken(tokenResult.refreshToken, encryptionSecret)
    : null;

  await prisma.settings.update({
    where: { userId },
    data: {
      brightspaceAccessToken: encryptedAccessToken,
      brightspaceRefreshToken: encryptedRefreshToken,
      brightspaceTokenExpiresAt: tokenResult.expiresAt,
    },
  });

  return tokenResult.accessToken;
}

// POST - Run a full sync from Brightspace
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get settings with Brightspace credentials
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        brightspaceInstanceUrl: true,
        brightspaceClientId: true,
        brightspaceClientSecret: true,
        brightspaceAccessToken: true,
        brightspaceRefreshToken: true,
        brightspaceTokenExpiresAt: true,
        brightspaceUserId: true,
        brightspaceSyncEnabled: true,
        brightspaceSyncCourses: true,
        brightspaceSyncAssignments: true,
        brightspaceSyncGrades: true,
        brightspaceSyncEvents: true,
        brightspaceSyncAnnouncements: true,
        brightspaceAutoMarkComplete: true,
      },
    });

    if (
      !settings?.brightspaceInstanceUrl ||
      !settings?.brightspaceClientId ||
      !settings?.brightspaceClientSecret ||
      !settings?.brightspaceAccessToken ||
      !settings?.brightspaceSyncEnabled
    ) {
      return NextResponse.json(
        { error: 'Brightspace is not connected. Please connect to Brightspace first.' },
        { status: 400 }
      );
    }

    const encryptionSecret = process.env.BRIGHTSPACE_ENCRYPTION_SECRET ||
      process.env.CANVAS_ENCRYPTION_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret';

    // Get valid access token (refresh if needed)
    let accessToken: string;
    try {
      accessToken = await ensureValidToken(
        {
          brightspaceInstanceUrl: settings.brightspaceInstanceUrl,
          brightspaceClientId: settings.brightspaceClientId,
          brightspaceClientSecret: settings.brightspaceClientSecret,
          brightspaceAccessToken: settings.brightspaceAccessToken,
          brightspaceRefreshToken: settings.brightspaceRefreshToken,
          brightspaceTokenExpiresAt: settings.brightspaceTokenExpiresAt,
        },
        userId,
        encryptionSecret
      );
    } catch (error) {
      console.error('[Brightspace Sync] Failed to get valid token:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Brightspace. Please reconnect.', authError: true },
        { status: 401 }
      );
    }

    const client = createBrightspaceClient(settings.brightspaceInstanceUrl, accessToken);

    const body = await req.json().catch(() => ({}));
    const syncOptions = {
      courses: body.syncCourses ?? settings.brightspaceSyncCourses ?? true,
      assignments: body.syncAssignments ?? settings.brightspaceSyncAssignments ?? true,
      grades: body.syncGrades ?? settings.brightspaceSyncGrades ?? true,
      events: body.syncEvents ?? settings.brightspaceSyncEvents ?? true,
      announcements: body.syncAnnouncements ?? settings.brightspaceSyncAnnouncements ?? true,
    };

    const result: SyncResult = {
      courses: { created: 0, updated: 0, errors: [] },
      assignments: { created: 0, updated: 0, errors: [] },
      grades: { updated: 0, errors: [] },
      events: { created: 0, updated: 0, errors: [] },
      announcements: { created: 0, errors: [] },
    };

    // Fetch deleted items to skip during sync
    let deletedCourseIds = new Set<string>();
    let deletedAssignmentIds = new Set<string>();
    let deletedEventIds = new Set<string>();
    let deletedAnnouncementIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedBrightspaceItem.findMany({
        where: { userId },
        select: { brightspaceId: true, type: true },
      });
      deletedCourseIds = new Set(deletedItems.filter(d => d.type === 'course').map(d => d.brightspaceId));
      deletedAssignmentIds = new Set(deletedItems.filter(d => d.type === 'assignment').map(d => d.brightspaceId));
      deletedEventIds = new Set(deletedItems.filter(d => d.type === 'event').map(d => d.brightspaceId));
      deletedAnnouncementIds = new Set(deletedItems.filter(d => d.type === 'announcement').map(d => d.brightspaceId));
    } catch {
      console.log('[Brightspace Sync] DeletedBrightspaceItem table not available');
    }

    // Map of Brightspace org unit IDs to College Orbit course IDs
    const courseIdMap = new Map<number, string>();

    // Step 1: Sync Courses
    if (syncOptions.courses) {
      try {
        const enrollments = await client.getMyEnrollments();

        // Filter to active enrollments
        const activeEnrollments = enrollments.filter(
          e => e.Access?.IsActive !== false && e.OrgUnit
        );

        const existingCourses = await prisma.course.findMany({
          where: {
            userId,
            brightspaceCourseId: { not: null },
          },
          select: { id: true, brightspaceCourseId: true, links: true },
        });

        const existingCourseMap = new Map(
          existingCourses.map(c => [c.brightspaceCourseId, { id: c.id, links: c.links as Array<{ label: string; url: string }> | null }])
        );

        for (const enrollment of activeEnrollments) {
          try {
            const course = enrollment.OrgUnit;
            const brightspaceCourseIdStr = String(course.OrgUnitId);

            if (deletedCourseIds.has(brightspaceCourseIdStr)) {
              continue;
            }

            const existingCourse = existingCourseMap.get(brightspaceCourseIdStr);
            const term = getCurrentTerm();

            const brightspaceCourseUrl = `${getBaseUrl(settings.brightspaceInstanceUrl)}/d2l/home/${course.OrgUnitId}`;
            const brightspaceLink = { label: 'View on Brightspace', url: brightspaceCourseUrl };

            if (existingCourse) {
              const mergedLinks = mergeLinks(existingCourse.links, [brightspaceLink]);

              await prisma.course.update({
                where: { id: existingCourse.id },
                data: { links: mergedLinks },
              });
              courseIdMap.set(course.OrgUnitId, existingCourse.id);
              result.courses.updated++;
            } else {
              const startDate = course.StartDate ? new Date(course.StartDate) : null;
              const endDate = course.EndDate ? new Date(course.EndDate) : null;

              const newCourse = await prisma.course.create({
                data: {
                  userId,
                  name: course.Name,
                  code: course.Code || course.Name.substring(0, 10),
                  term,
                  brightspaceCourseId: brightspaceCourseIdStr,
                  startDate,
                  endDate,
                  meetingTimes: [],
                  links: [brightspaceLink],
                  files: [],
                },
              });
              courseIdMap.set(course.OrgUnitId, newCourse.id);
              result.courses.created++;
            }
          } catch (error) {
            result.courses.errors.push(
              `Failed to sync course ${enrollment.OrgUnit?.Name || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.courses.errors.push(
          `Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Build course ID map from existing courses if needed
    if (!syncOptions.courses || courseIdMap.size === 0) {
      const existingCourses = await prisma.course.findMany({
        where: {
          userId,
          brightspaceCourseId: { not: null },
        },
        select: { id: true, brightspaceCourseId: true },
      });

      for (const course of existingCourses) {
        if (course.brightspaceCourseId) {
          courseIdMap.set(parseInt(course.brightspaceCourseId), course.id);
        }
      }
    }

    // Step 2: Sync Assignments (Dropbox folders)
    if (syncOptions.assignments && courseIdMap.size > 0) {
      for (const [brightspaceCourseId, orbitCourseId] of courseIdMap) {
        try {
          const dropboxFolders = await client.getDropboxFolders(brightspaceCourseId);

          const existingWorkItems = await prisma.workItem.findMany({
            where: {
              userId,
              courseId: orbitCourseId,
              brightspaceActivityId: { not: null },
            },
            select: { id: true, brightspaceActivityId: true, notes: true, links: true, status: true },
          });

          const existingWorkItemMap = new Map(
            existingWorkItems.map(w => [w.brightspaceActivityId, w])
          );

          for (const folder of dropboxFolders) {
            try {
              const brightspaceActivityIdStr = String(folder.Id);

              if (deletedAssignmentIds.has(brightspaceActivityIdStr)) {
                continue;
              }

              const existingWorkItem = existingWorkItemMap.get(brightspaceActivityIdStr);

              const brightspaceLinks = extractLinksFromHtml(folder.CustomInstructions?.Html || '');
              const brightspaceAssignmentUrl = `${getBaseUrl(settings.brightspaceInstanceUrl)}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=${folder.Id}&ou=${brightspaceCourseId}`;
              brightspaceLinks.unshift({ label: 'View on Brightspace', url: brightspaceAssignmentUrl });

              const dueAt = folder.DueDate ? new Date(folder.DueDate) : null;

              if (existingWorkItem) {
                const mergedNotesContent = mergeNotes(existingWorkItem.notes, folder.CustomInstructions?.Html || null);
                const mergedLinksContent = mergeLinks(existingWorkItem.links as Array<{ label: string; url: string }> | null, brightspaceLinks);

                await prisma.workItem.update({
                  where: { id: existingWorkItem.id },
                  data: {
                    dueAt,
                    notes: mergedNotesContent,
                    links: mergedLinksContent,
                    brightspacePointsPossible: folder.Assessment?.ScoreDenominator ?? null,
                  },
                });
                result.assignments.updated++;
              } else {
                const brightspaceContent = htmlToPlainText(folder.CustomInstructions?.Html || '');
                const initialNotes = brightspaceContent
                  ? `${USER_NOTES_HEADER}\n${BRIGHTSPACE_SEPARATOR}${brightspaceContent}`
                  : `${USER_NOTES_HEADER}\n`;

                await prisma.workItem.create({
                  data: {
                    userId,
                    courseId: orbitCourseId,
                    title: folder.Name,
                    type: 'assignment',
                    dueAt,
                    notes: initialNotes,
                    brightspaceActivityId: brightspaceActivityIdStr,
                    brightspacePointsPossible: folder.Assessment?.ScoreDenominator ?? null,
                    status: 'open',
                    workingOn: false,
                    pinned: false,
                    tags: [],
                    links: brightspaceLinks,
                    files: [],
                    checklist: [],
                  },
                });
                result.assignments.created++;
              }
            } catch (error) {
              result.assignments.errors.push(
                `Failed to sync assignment ${folder.Name}: ${error instanceof Error ? error.message : 'Unknown error'}`
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

    // Step 3: Sync Grades
    if (syncOptions.grades && courseIdMap.size > 0) {
      for (const [brightspaceCourseId, orbitCourseId] of courseIdMap) {
        try {
          const grades = await client.getMyGrades(brightspaceCourseId);

          for (const grade of grades) {
            if (!grade.PointsNumerator) continue;

            // Try to match with existing work items
            const workItems = await prisma.workItem.findMany({
              where: {
                userId,
                courseId: orbitCourseId,
                brightspaceActivityId: { not: null },
              },
            });

            for (const workItem of workItems) {
              if (workItem.brightspacePointsEarned === null) {
                await prisma.workItem.update({
                  where: { id: workItem.id },
                  data: {
                    brightspacePointsEarned: grade.PointsNumerator,
                    brightspaceGradePostedAt: grade.GradedDate ? new Date(grade.GradedDate) : new Date(),
                    ...(workItem.status === 'open' && grade.PointsNumerator !== null
                      ? { status: 'done' }
                      : {}),
                  },
                });
                result.grades.updated++;
                break;
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
        const now = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

        const events = await client.getCalendarEvents({
          startDateTime: now.toISOString(),
          endDateTime: threeMonthsFromNow.toISOString(),
        });

        const existingEvents = await prisma.calendarEvent.findMany({
          where: {
            userId,
            brightspaceEventId: { not: null },
          },
          select: { id: true, brightspaceEventId: true },
        });

        const existingEventMap = new Map(
          existingEvents.map(e => [e.brightspaceEventId, e.id])
        );

        for (const event of events) {
          try {
            const brightspaceEventIdStr = String(event.CalendarEventId);

            if (deletedEventIds.has(brightspaceEventIdStr)) {
              continue;
            }

            const existingEventId = existingEventMap.get(brightspaceEventIdStr);
            const cleanDescription = htmlToPlainText(event.Description || '');

            if (existingEventId) {
              await prisma.calendarEvent.update({
                where: { id: existingEventId },
                data: {
                  startAt: event.StartDateTime ? new Date(event.StartDateTime) : new Date(),
                  endAt: event.EndDateTime ? new Date(event.EndDateTime) : null,
                  allDay: event.AllDay || false,
                  location: event.Location?.Name,
                },
              });
              result.events.updated++;
            } else {
              await prisma.calendarEvent.create({
                data: {
                  userId,
                  title: event.Title,
                  description: cleanDescription,
                  startAt: event.StartDateTime ? new Date(event.StartDateTime) : new Date(),
                  endAt: event.EndDateTime ? new Date(event.EndDateTime) : null,
                  allDay: event.AllDay || false,
                  location: event.Location?.Name,
                  brightspaceEventId: brightspaceEventIdStr,
                },
              });
              result.events.created++;
            }
          } catch (error) {
            result.events.errors.push(
              `Failed to sync event ${event.Title}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.events.errors.push(
          `Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Step 5: Sync Announcements (News items)
    if (syncOptions.announcements && courseIdMap.size > 0) {
      for (const [brightspaceCourseId] of courseIdMap) {
        try {
          const newsItems = await client.getNewsItems(brightspaceCourseId);

          for (const newsItem of newsItems) {
            try {
              const brightspaceAnnouncementIdStr = String(newsItem.Id);

              if (deletedAnnouncementIds.has(brightspaceAnnouncementIdStr)) {
                continue;
              }

              const existingNotification = await prisma.notification.findFirst({
                where: {
                  userId,
                  type: 'brightspace_announcement',
                  message: { contains: `brightspace:${brightspaceAnnouncementIdStr}` },
                },
              });

              if (!existingNotification) {
                const cleanMessage = htmlToPlainText(newsItem.Body?.Html || newsItem.Body?.Text || '');

                await prisma.notification.create({
                  data: {
                    userId,
                    title: newsItem.Title,
                    message: `brightspace:${brightspaceAnnouncementIdStr}\n${cleanMessage.substring(0, 500)}`,
                    type: 'brightspace_announcement',
                    read: false,
                  },
                });
                result.announcements.created++;
              }
            } catch (error) {
              result.announcements.errors.push(
                `Failed to sync announcement ${newsItem.Title}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        } catch (error) {
          // Some courses may not have news
          console.log(`[Brightspace Sync] Could not fetch news for course ${brightspaceCourseId}:`, error);
        }
      }
    }

    // Update last synced timestamp
    await prisma.settings.update({
      where: { userId },
      data: {
        brightspaceLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Brightspace sync completed',
    });
  } catch (error) {
    console.error('[Brightspace Sync] Error:', error);

    if (error instanceof BrightspaceAuthError) {
      const session = await getServerSession(authConfig);
      if (session?.user?.id) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            type: 'brightspace_token_expired',
            read: false,
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              title: 'Brightspace Connection Expired',
              message: 'Your Brightspace access token has expired. Please go to Settings to reconnect your Brightspace account.',
              type: 'brightspace_token_expired',
              read: false,
            },
          });
        }
      }

      return NextResponse.json(
        { error: 'Your Brightspace access token has expired. Please reconnect your Brightspace account in Settings.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync from Brightspace. Please try again.' },
      { status: 500 }
    );
  }
});
