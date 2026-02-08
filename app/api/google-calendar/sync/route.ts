import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createGoogleCalendarClient,
  getValidAccessToken,
  GoogleCalendarAuthError,
  GoogleCalendarEvent,
  GOOGLE_COLOR_MAP,
} from '@/lib/google-calendar';
import { checkPremiumAccess } from '@/lib/subscription';

interface SyncResult {
  imported: { created: number; updated: number; errors: string[] };
  exportedEvents: { created: number; updated: number; errors: string[] };
  exportedDeadlines: { created: number; updated: number; errors: string[] };
  exportedExams: { created: number; updated: number; errors: string[] };
  exportedWork: { created: number; updated: number; errors: string[] };
  exportedClasses: { created: number; errors: string[] };
}

/**
 * Check if a date should be treated as all-day for Google Calendar export.
 * Times at midnight (00:00) or near end-of-day (11:00 PM onward) are treated as all-day
 * since assignments due at 11:59 PM are effectively "due that day".
 */
function shouldExportAsAllDay(date: Date): boolean {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  // Midnight (no time set) or 11:00 PM onward
  return (hours === 0 && minutes === 0) || hours >= 23;
}

// Throttle between Google API calls to avoid rate limiting (Google allows ~10 req/sec per user)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 150; // 150ms between calls = ~6.6 req/sec, safely under limit

// POST - Run a full bidirectional Google Calendar sync
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check premium access
    const premiumCheck = await checkPremiumAccess(userId);
    if (!premiumCheck.allowed) {
      return NextResponse.json(
        { error: 'Google Calendar sync requires a premium subscription' },
        { status: 403 }
      );
    }

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        googleCalendarConnected: true,
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarTokenExpiresAt: true,
        googleCalendarLastSyncedAt: true,
        googleCalendarSyncImportEvents: true,
        googleCalendarSyncExportEvents: true,
        googleCalendarSyncExportDeadlines: true,
        googleCalendarSyncExportExams: true,
        googleCalendarImportCalendarId: true,
        googleCalendarExportCalendarId: true,
      },
    });

    if (!settings?.googleCalendarConnected) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected. Please connect first.' },
        { status: 400 }
      );
    }

    // Prevent concurrent syncs (within 30 seconds)
    if (settings.googleCalendarLastSyncedAt) {
      const lastSync = new Date(settings.googleCalendarLastSyncedAt);
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      if (lastSync > thirtySecondsAgo) {
        return NextResponse.json(
          { error: 'Please wait before syncing again' },
          { status: 429 }
        );
      }
    }

    // Get valid access token (auto-refreshes if needed)
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(settings, userId);
    } catch (error) {
      if (error instanceof GoogleCalendarAuthError) {
        return NextResponse.json(
          { error: 'Google Calendar authentication failed. Please reconnect.', authError: true },
          { status: 401 }
        );
      }
      throw error;
    }

    const client = createGoogleCalendarClient(accessToken);
    const importCalendarId = settings.googleCalendarImportCalendarId || 'primary';
    const exportCalendarId = settings.googleCalendarExportCalendarId || 'primary';

    // Get request body for optional overrides
    const body = await req.json().catch(() => ({}));
    const syncOptions = {
      importEvents: body.syncImportEvents ?? settings.googleCalendarSyncImportEvents ?? true,
      exportEvents: body.syncExportEvents ?? settings.googleCalendarSyncExportEvents ?? true,
      exportDeadlines: body.syncExportDeadlines ?? settings.googleCalendarSyncExportDeadlines ?? true,
      exportExams: body.syncExportExams ?? settings.googleCalendarSyncExportExams ?? true,
    };

    const debug: Record<string, number | string> = {};

    const result: SyncResult = {
      imported: { created: 0, updated: 0, errors: [] },
      exportedEvents: { created: 0, updated: 0, errors: [] },
      exportedDeadlines: { created: 0, updated: 0, errors: [] },
      exportedExams: { created: 0, updated: 0, errors: [] },
      exportedWork: { created: 0, updated: 0, errors: [] },
      exportedClasses: { created: 0, errors: [] },
    };

    // ========== Phase 0: Process pending Google Calendar deletions ==========
    // When users delete items from College Orbit that were exported to Google,
    // we queue the Google event IDs for deletion here.
    try {
      const pendingDeletions = await prisma.deletedGoogleCalendarItem.findMany({
        where: { userId, type: 'pending_google_delete' },
        select: { id: true, googleEventId: true },
      });

      for (const pending of pendingDeletions) {
        try {
          await sleep(API_DELAY);
          await client.deleteEvent(exportCalendarId, pending.googleEventId);
        } catch (error) {
          // 404 is fine — event was already deleted from Google
          if (!(error instanceof Error && error.message.includes('404'))) {
            console.error(`[Google Calendar Sync] Failed to delete event ${pending.googleEventId}:`, error);
          }
        }
        // Remove from queue regardless (even if Google delete failed, don't retry forever)
        await prisma.deletedGoogleCalendarItem.delete({
          where: { id: pending.id },
        });
      }
    } catch (error) {
      console.error('[Google Calendar Sync] Error processing pending deletions:', error);
    }

    // Fetch deleted Google Calendar items to skip during import
    let deletedEventIds = new Set<string>();
    try {
      const deletedItems = await prisma.deletedGoogleCalendarItem.findMany({
        where: { userId, type: 'event' },
        select: { googleEventId: true },
      });
      deletedEventIds = new Set(deletedItems.map(d => d.googleEventId));
    } catch {
      console.log('[Google Calendar Sync] DeletedGoogleCalendarItem table not available');
    }

    // ========== Phase 1: Import Google Calendar Events ==========
    if (syncOptions.importEvents) {
      try {
        const now = new Date();
        const timeMin = new Date(now);
        timeMin.setMonth(timeMin.getMonth() - 1);
        const timeMax = new Date(now);
        timeMax.setMonth(timeMax.getMonth() + 6);

        const googleEvents = await client.listEvents(
          importCalendarId,
          timeMin.toISOString(),
          timeMax.toISOString()
        );

        debug.googleEventsFound = googleEvents.length;
        debug.importCalendar = importCalendarId;
        debug.deletedEventIdsCount = deletedEventIds.size;

        // Get existing calendar events with Google event IDs
        const existingEvents = await prisma.calendarEvent.findMany({
          where: {
            userId,
            googleEventId: { not: null },
          },
          select: { id: true, googleEventId: true },
        });

        const existingEventMap = new Map(
          existingEvents.map(e => [e.googleEventId, e.id])
        );

        let skippedNoId = 0, skippedCancelled = 0, skippedDeleted = 0, skippedExported = 0;
        for (const gEvent of googleEvents) {
          try {
            if (!gEvent.id) { skippedNoId++; continue; }
            if (gEvent.status === 'cancelled') { skippedCancelled++; continue; }

            // Skip events we deleted locally
            if (deletedEventIds.has(gEvent.id)) { skippedDeleted++; continue; }

            // Skip events that were exported by us (re-import prevention)
            if (gEvent.extendedProperties?.private?.collegeOrbitId) { skippedExported++; continue; }

            // Parse start/end times
            const isAllDay = !!gEvent.start.date && !gEvent.start.dateTime;
            const startAt = new Date(gEvent.start.dateTime || gEvent.start.date || '');
            const endAt = gEvent.end.dateTime || gEvent.end.date
              ? new Date(gEvent.end.dateTime || gEvent.end.date || '')
              : null;

            // Map color
            const color = gEvent.colorId ? (GOOGLE_COLOR_MAP[gEvent.colorId] || null) : null;

            const existingId = existingEventMap.get(gEvent.id);

            if (existingId) {
              // Update existing event (update times and location, keep user edits to title/description)
              await prisma.calendarEvent.update({
                where: { id: existingId },
                data: {
                  startAt,
                  endAt,
                  allDay: isAllDay,
                  location: gEvent.location || null,
                },
              });
              result.imported.updated++;
            } else {
              // Create new event
              await prisma.calendarEvent.create({
                data: {
                  userId,
                  title: gEvent.summary || 'Untitled Event',
                  description: gEvent.description || '',
                  startAt,
                  endAt,
                  allDay: isAllDay,
                  color,
                  location: gEvent.location || null,
                  googleEventId: gEvent.id,
                },
              });
              result.imported.created++;
            }
          } catch (error) {
            result.imported.errors.push(
              `Failed to import event "${gEvent.summary}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
        debug.skippedNoId = skippedNoId;
        debug.skippedCancelled = skippedCancelled;
        debug.skippedDeleted = skippedDeleted;
        debug.skippedExported = skippedExported;
        debug.existingInDb = existingEventMap.size;
      } catch (error) {
        result.imported.errors.push(
          `Failed to fetch Google Calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // ========== Phase 2: Export CalendarEvents ==========
    if (syncOptions.exportEvents) {
      try {
        // Get local CalendarEvents that weren't imported from Google (no googleEventId)
        // or that already have a googleEventId we exported (for updates)
        const localEvents = await prisma.calendarEvent.findMany({
          where: {
            userId,
            googleEventId: null, // Only export locally-created events
          },
          select: {
            id: true,
            title: true,
            description: true,
            startAt: true,
            endAt: true,
            allDay: true,
            location: true,
            // Check for LMS source — don't export LMS-imported events
            canvasEventId: true,
            blackboardEventId: true,
            moodleEventId: true,
            brightspaceEventId: true,
          },
        });

        for (const event of localEvents) {
          try {
            // Skip LMS-imported events
            if (event.canvasEventId || event.blackboardEventId || event.moodleEventId || event.brightspaceEventId) {
              continue;
            }

            const googleEvent: Partial<GoogleCalendarEvent> = {
              summary: event.title,
              description: event.description || undefined,
              location: event.location || undefined,
              start: event.allDay
                ? { date: event.startAt.toISOString().split('T')[0] }
                : { dateTime: event.startAt.toISOString() },
              end: event.allDay
                ? { date: (event.endAt || event.startAt).toISOString().split('T')[0] }
                : { dateTime: (event.endAt || event.startAt).toISOString() },
              extendedProperties: {
                private: {
                  collegeOrbitId: event.id,
                  collegeOrbitType: 'event',
                },
              },
            };

            await sleep(API_DELAY);
            const created = await client.insertEvent(exportCalendarId, googleEvent);
            // Save the Google event ID back to our record
            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: { googleEventId: created.id },
            });
            result.exportedEvents.created++;
          } catch (error) {
            result.exportedEvents.errors.push(
              `Failed to export event "${event.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Also update events that were previously exported (have googleEventId from export)
        const previouslyExported = await prisma.calendarEvent.findMany({
          where: {
            userId,
            googleEventId: { not: null },
            // Only events we originally created (not imported) — check via extendedProperties
            // We mark exports with googleEventId, so we need to check if the event was imported
            // An event was imported if it was created by sync. We can check by looking at
            // whether we set the googleEventId during import or export.
            // Since both set googleEventId, we skip re-exporting imported events
            // by checking if they exist in the deletedGoogleCalendarItems (they don't).
            // Actually, the simplest approach: skip all events with googleEventId
            // in the export-new section above. For previously exported events needing update,
            // we'd need to track which were exported vs imported. For simplicity,
            // we skip updating already-exported events in this version.
          },
          select: { id: true },
          take: 0, // Skip for now — V1 creates only, doesn't update existing exports
        });
        void previouslyExported; // Satisfy lint
      } catch (error) {
        result.exportedEvents.errors.push(
          `Failed to export calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // ========== Phase 3: Export Deadlines ==========
    if (syncOptions.exportDeadlines) {
      try {
        const deadlines = await prisma.deadline.findMany({
          where: {
            userId,
            dueAt: { not: null },
            status: { not: 'completed' },
          },
          select: {
            id: true,
            title: true,
            notes: true,
            dueAt: true,
            googleCalendarEventId: true,
            course: { select: { code: true, name: true } },
          },
        });

        for (const deadline of deadlines) {
          try {
            if (!deadline.dueAt) continue;

            const coursePrefix = deadline.course
              ? `[${deadline.course.code || deadline.course.name}] `
              : '';
            const allDay = shouldExportAsAllDay(deadline.dueAt);

            const googleEvent: Partial<GoogleCalendarEvent> = {
              summary: `📋 ${coursePrefix}${deadline.title}`,
              description: deadline.notes || undefined,
              start: allDay
                ? { date: deadline.dueAt.toISOString().split('T')[0] }
                : { dateTime: deadline.dueAt.toISOString() },
              end: allDay
                ? { date: deadline.dueAt.toISOString().split('T')[0] }
                : { dateTime: deadline.dueAt.toISOString() },
              extendedProperties: {
                private: {
                  collegeOrbitId: deadline.id,
                  collegeOrbitType: 'deadline',
                },
              },
            };

            if (deadline.googleCalendarEventId) {
              // Update existing Google event
              try {
                await sleep(API_DELAY);
                await client.updateEvent(exportCalendarId, deadline.googleCalendarEventId, googleEvent);
                result.exportedDeadlines.updated++;
              } catch (error) {
                // If 404, the Google event was deleted by user — respect that deletion
                if (error instanceof Error && error.message.includes('404')) {
                  await prisma.deadline.update({
                    where: { id: deadline.id },
                    data: { googleCalendarEventId: null },
                  });
                } else {
                  throw error;
                }
              }
            } else {
              // Create new Google event
              await sleep(API_DELAY);
              const created = await client.insertEvent(exportCalendarId, googleEvent);
              await prisma.deadline.update({
                where: { id: deadline.id },
                data: { googleCalendarEventId: created.id },
              });
              result.exportedDeadlines.created++;
            }
          } catch (error) {
            result.exportedDeadlines.errors.push(
              `Failed to export deadline "${deadline.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.exportedDeadlines.errors.push(
          `Failed to export deadlines: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // ========== Phase 4: Export Exams ==========
    if (syncOptions.exportExams) {
      try {
        const exams = await prisma.exam.findMany({
          where: {
            userId,
            examAt: { not: null },
            status: { not: 'completed' },
          },
          select: {
            id: true,
            title: true,
            notes: true,
            examAt: true,
            location: true,
            googleCalendarEventId: true,
            course: { select: { code: true, name: true } },
          },
        });

        for (const exam of exams) {
          try {
            if (!exam.examAt) continue;

            const coursePrefix = exam.course
              ? `[${exam.course.code || exam.course.name}] `
              : '';
            const allDay = shouldExportAsAllDay(exam.examAt);

            const googleEvent: Partial<GoogleCalendarEvent> = {
              summary: `📝 ${coursePrefix}${exam.title}`,
              description: exam.notes || undefined,
              location: exam.location || undefined,
              start: allDay
                ? { date: exam.examAt.toISOString().split('T')[0] }
                : { dateTime: exam.examAt.toISOString() },
              end: allDay
                ? { date: exam.examAt.toISOString().split('T')[0] }
                : { dateTime: exam.examAt.toISOString() },
              extendedProperties: {
                private: {
                  collegeOrbitId: exam.id,
                  collegeOrbitType: 'exam',
                },
              },
            };

            if (exam.googleCalendarEventId) {
              // Update existing Google event
              try {
                await sleep(API_DELAY);
                await client.updateEvent(exportCalendarId, exam.googleCalendarEventId, googleEvent);
                result.exportedExams.updated++;
              } catch (error) {
                // If 404, the Google event was deleted by user — respect that deletion
                if (error instanceof Error && error.message.includes('404')) {
                  await prisma.exam.update({
                    where: { id: exam.id },
                    data: { googleCalendarEventId: null },
                  });
                } else {
                  throw error;
                }
              }
            } else {
              // Create new Google event
              await sleep(API_DELAY);
              const created = await client.insertEvent(exportCalendarId, googleEvent);
              await prisma.exam.update({
                where: { id: exam.id },
                data: { googleCalendarEventId: created.id },
              });
              result.exportedExams.created++;
            }
          } catch (error) {
            result.exportedExams.errors.push(
              `Failed to export exam "${exam.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.exportedExams.errors.push(
          `Failed to export exams: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // ========== Phase 5: Export Work Items (assignments, tasks, readings, projects) ==========
    if (syncOptions.exportDeadlines) {
      try {
        const workItems = await prisma.workItem.findMany({
          where: {
            userId,
            dueAt: { not: null },
            status: { not: 'done' },
          },
          select: {
            id: true,
            title: true,
            type: true,
            notes: true,
            dueAt: true,
            googleCalendarEventId: true,
            course: { select: { code: true, name: true } },
          },
        });

        const typeEmoji: Record<string, string> = {
          assignment: '📋',
          task: '✅',
          reading: '📖',
          project: '🔨',
        };

        for (const item of workItems) {
          try {
            if (!item.dueAt) continue;

            const coursePrefix = item.course
              ? `[${item.course.code || item.course.name}] `
              : '';
            const emoji = typeEmoji[item.type] || '📋';
            const allDay = shouldExportAsAllDay(item.dueAt);

            const googleEvent: Partial<GoogleCalendarEvent> = {
              summary: `${emoji} ${coursePrefix}${item.title}`,
              description: item.notes || undefined,
              start: allDay
                ? { date: item.dueAt.toISOString().split('T')[0] }
                : { dateTime: item.dueAt.toISOString() },
              end: allDay
                ? { date: item.dueAt.toISOString().split('T')[0] }
                : { dateTime: item.dueAt.toISOString() },
              extendedProperties: {
                private: {
                  collegeOrbitId: item.id,
                  collegeOrbitType: 'workItem',
                },
              },
            };

            if (item.googleCalendarEventId) {
              try {
                await sleep(API_DELAY);
                await client.updateEvent(exportCalendarId, item.googleCalendarEventId, googleEvent);
                result.exportedWork.updated++;
              } catch (error) {
                // If 404, the Google event was deleted by user — respect that deletion
                if (error instanceof Error && error.message.includes('404')) {
                  await prisma.workItem.update({
                    where: { id: item.id },
                    data: { googleCalendarEventId: null },
                  });
                } else {
                  throw error;
                }
              }
            } else {
              await sleep(API_DELAY);
              const created = await client.insertEvent(exportCalendarId, googleEvent);
              await prisma.workItem.update({
                where: { id: item.id },
                data: { googleCalendarEventId: created.id },
              });
              result.exportedWork.created++;
            }
          } catch (error) {
            result.exportedWork.errors.push(
              `Failed to export work item "${item.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.exportedWork.errors.push(
          `Failed to export work items: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // ========== Phase 6: Export Course Class Times ==========
    // Export upcoming class meetings as Google Calendar events
    if (syncOptions.exportEvents) {
      try {
        const courses = await prisma.course.findMany({
          where: { userId },
          select: {
            id: true,
            code: true,
            name: true,
            meetingTimes: true,
            startDate: true,
            endDate: true,
          },
        });

        const now = new Date();
        const twoWeeksFromNow = new Date(now);
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

        for (const course of courses) {
          try {
            const meetings = course.meetingTimes as Array<{ days: string[]; start: string; end: string; location?: string }>;
            if (!meetings || meetings.length === 0) continue;

            // Check if we already exported classes for this course (by looking for existing events)
            const existingClassEvents = await prisma.calendarEvent.findMany({
              where: {
                userId,
                googleEventId: { not: null },
                title: { startsWith: `🏫 [${course.code || course.name}]` },
                startAt: { gte: now },
              },
              select: { id: true, startAt: true },
            });

            // Build a set of existing dates to avoid duplicates
            const existingDates = new Set(
              existingClassEvents.map(e => e.startAt.toISOString().split('T')[0] + e.startAt.toISOString().split('T')[1]?.substring(0, 5))
            );

            for (const meeting of meetings) {
              if (!meeting.days || !meeting.start || !meeting.end) continue;

              // Generate class instances for the next 2 weeks
              for (let d = new Date(now); d <= twoWeeksFromNow; d.setDate(d.getDate() + 1)) {
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                if (!meeting.days.includes(dayName)) continue;

                // Skip dates outside course date range
                if (course.startDate && d < new Date(course.startDate)) continue;
                if (course.endDate && d > new Date(course.endDate)) continue;

                const dateStr = d.toISOString().split('T')[0];
                const dateKey = dateStr + meeting.start;
                if (existingDates.has(dateKey)) continue;

                const startDateTime = new Date(`${dateStr}T${meeting.start}:00`);
                const endDateTime = new Date(`${dateStr}T${meeting.end}:00`);

                const googleEvent: Partial<GoogleCalendarEvent> = {
                  summary: `🏫 [${course.code || course.name}] Class`,
                  location: meeting.location || undefined,
                  start: { dateTime: startDateTime.toISOString() },
                  end: { dateTime: endDateTime.toISOString() },
                  extendedProperties: {
                    private: {
                      collegeOrbitId: course.id,
                      collegeOrbitType: 'class',
                    },
                  },
                };

                try {
                  await sleep(API_DELAY);
                  const created = await client.insertEvent(exportCalendarId, googleEvent);
                  // Store as a CalendarEvent so we track it
                  await prisma.calendarEvent.create({
                    data: {
                      userId,
                      title: `🏫 [${course.code || course.name}] Class`,
                      description: '',
                      startAt: startDateTime,
                      endAt: endDateTime,
                      allDay: false,
                      location: meeting.location || null,
                      googleEventId: created.id,
                    },
                  });
                  existingDates.add(dateKey);
                  result.exportedClasses.created++;
                } catch (error) {
                  result.exportedClasses.errors.push(
                    `Failed to export class for ${course.code || course.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  );
                }
              }
            }
          } catch (error) {
            result.exportedClasses.errors.push(
              `Failed to export classes for ${course.code || course.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        result.exportedClasses.errors.push(
          `Failed to export classes: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update last synced timestamp
    await prisma.settings.update({
      where: { userId },
      data: {
        googleCalendarLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result,
      debug,
      message: 'Google Calendar sync completed',
    });
  } catch (error) {
    console.error('[Google Calendar Sync] Error:', error);

    if (error instanceof GoogleCalendarAuthError) {
      return NextResponse.json(
        { error: 'Google Calendar authentication failed. Please reconnect.', authError: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync with Google Calendar. Please try again.' },
      { status: 500 }
    );
  }
});
