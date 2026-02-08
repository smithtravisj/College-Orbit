import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const MAX_HISTORY = 10;

const DAY_ABBR_TO_FULL: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function to12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function friendlyDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function truncateList<T>(items: T[], max: number): { items: T[]; overflow: number } {
  if (items.length <= max) return { items, overflow: 0 };
  return { items: items.slice(0, max), overflow: items.length - max };
}

interface MeetingTime { days?: string[]; start?: string; end?: string; location?: string }
interface CourseLink { label?: string; url?: string }

async function buildSystemPrompt(userId: string): Promise<string> {
  const [user, courses, workItems, exams, notes, calendarEvents, shoppingItems, settings, streak, recurringWorkPatterns] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.course.findMany({
        where: { userId },
        select: { id: true, code: true, name: true, term: true, meetingTimes: true, links: true, startDate: true, endDate: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workItem.findMany({
        where: { userId },
        select: { title: true, type: true, courseId: true, dueAt: true, status: true, priority: true, notes: true, tags: true, checklist: true, links: true, isRecurring: true, instanceDate: true },
        orderBy: { dueAt: 'asc' },
      }),
      prisma.exam.findMany({
        where: { userId },
        select: { title: true, courseId: true, examAt: true, status: true, location: true, notes: true },
        orderBy: { examAt: 'asc' },
      }),
      prisma.note.findMany({
        where: { userId },
        select: { title: true, tags: true, courseId: true, plainText: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        select: { title: true, description: true, startAt: true, endAt: true, allDay: true, location: true },
        orderBy: { startAt: 'asc' },
      }),
      prisma.shoppingItem.findMany({
        where: { userId },
        select: { name: true, checked: true, listType: true, category: true, quantity: true, unit: true, notes: true, price: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.settings.findUnique({ where: { userId }, select: { university: true, theme: true } }),
      prisma.userStreak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, totalTasksCompleted: true, totalXp: true, level: true },
      }),
      prisma.recurringWorkPattern.findMany({
        where: { userId, isActive: true },
        select: { workItemTemplate: true, recurrenceType: true, daysOfWeek: true, daysOfMonth: true, intervalDays: true, startDate: true, endDate: true },
      }),
    ]);

  const courseMap = new Map(courses.map((c) => [c.id, `${c.code} - ${c.name}`]));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayISO = localDateStr(todayStart);

  // Build week dates (today through +6 days)
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekDates = getDaysBetween(todayStart, weekEnd);

  // Split work items into open and completed
  const openWork = workItems.filter((w) => w.status !== 'done' && w.status !== 'completed');
  const completedWork = workItems.filter((w) => w.status === 'done' || w.status === 'completed');

  // Filter future calendar events only
  const futureEvents = calendarEvents.filter((e) => new Date(e.startAt) >= todayStart);

  // Filter future exams
  const openExams = exams.filter((e) => e.status !== 'completed');

  const sections: string[] = [];

  if (user?.name) sections.push(`Student's name: ${user.name}`);
  sections.push(`Today: ${friendlyDate(todayStart)} (${todayISO})`);
  if (settings?.university) sections.push(`University: ${settings.university}`);

  // ===== PRE-COMPUTED: Classes by day of week =====
  const classesByDay: Record<string, string[]> = {};
  for (const day of FULL_DAYS) classesByDay[day] = [];

  for (const c of courses) {
    const mt = c.meetingTimes as MeetingTime[] | null;
    if (!mt || !Array.isArray(mt)) continue;
    for (const slot of mt) {
      if (!slot.days || !Array.isArray(slot.days)) continue;
      for (const abbr of slot.days) {
        const fullDay = DAY_ABBR_TO_FULL[abbr];
        if (!fullDay) continue;
        const timeStr = slot.start && slot.end ? `${to12h(slot.start)} - ${to12h(slot.end)}` : '';
        const loc = slot.location ? ` at ${slot.location}` : '';
        classesByDay[fullDay].push(`${c.code}: ${c.name} (${timeStr}${loc})`);
      }
    }
  }

  const classScheduleLines: string[] = [];
  for (const date of weekDates) {
    const dayName = FULL_DAYS[date.getDay()];
    const label = localDateStr(date) === todayISO ? `${dayName} (TODAY)` : dayName;
    const classes = classesByDay[dayName];
    if (classes.length > 0) {
      classScheduleLines.push(`${label}:\n${classes.map((c) => `  - ${c}`).join('\n')}`);
    } else {
      classScheduleLines.push(`${label}: No classes`);
    }
  }
  sections.push(`CLASS SCHEDULE THIS WEEK:\n${classScheduleLines.join('\n')}`);

  // ===== PRE-COMPUTED: Due this week (OPEN items only) =====
  const dueThisWeekLines: string[] = [];
  for (const date of weekDates) {
    const dateISO = localDateStr(date);
    const dayName = FULL_DAYS[date.getDay()];
    const label = dateISO === todayISO ? `${dayName} (TODAY)` : dayName;

    const dueWork = openWork.filter((w) => {
      if (!w.dueAt) return false;
      return localDateStr(new Date(w.dueAt)) === dateISO;
    });
    const dueExams = openExams.filter((e) => {
      if (!e.examAt) return false;
      return localDateStr(new Date(e.examAt)) === dateISO;
    });

    if (dueWork.length > 0 || dueExams.length > 0) {
      const items: string[] = [];
      for (const w of dueWork) {
        const course = w.courseId ? courseMap.get(w.courseId) || '' : '';
        items.push(`  - ${w.title} (${w.type}${course ? `, ${course}` : ''})`);
      }
      for (const e of dueExams) {
        const course = e.courseId ? courseMap.get(e.courseId) || '' : '';
        items.push(`  - ${e.title} (exam${course ? `, ${course}` : ''})`);
      }
      dueThisWeekLines.push(`${label}:\n${items.join('\n')}`);
    } else {
      dueThisWeekLines.push(`${label}: Nothing due`);
    }
  }
  sections.push(`DUE THIS WEEK (open items only):\n${dueThisWeekLines.join('\n')}`);

  // ===== PRE-COMPUTED: Completed this week (by due date) =====
  const completedThisWeekLines: string[] = [];
  for (const date of weekDates) {
    const dateISO = localDateStr(date);
    const dayName = FULL_DAYS[date.getDay()];
    const label = dateISO === todayISO ? `${dayName} (TODAY)` : dayName;

    const completedOnDay = completedWork.filter((w) => {
      if (!w.dueAt) return false;
      return localDateStr(new Date(w.dueAt)) === dateISO;
    });

    if (completedOnDay.length > 0) {
      const items = completedOnDay.map((w) => {
        const course = w.courseId ? courseMap.get(w.courseId) || '' : '';
        return `  - ${w.title} (${w.type}${course ? `, ${course}` : ''})`;
      });
      completedThisWeekLines.push(`${label}:\n${items.join('\n')}`);
    }
  }
  if (completedThisWeekLines.length > 0) {
    sections.push(`COMPLETED THIS WEEK (items due this week that are already done):\n${completedThisWeekLines.join('\n')}`);
  } else {
    sections.push(`COMPLETED THIS WEEK: Nothing completed yet this week`);
  }

  // ===== ALL courses with full details =====
  if (courses.length > 0) {
    const lines = courses.map((c) => {
      const parts = [`- ${c.code}: ${c.name} (${c.term})`];
      const mt = c.meetingTimes as MeetingTime[] | null;
      if (mt && Array.isArray(mt) && mt.length > 0) {
        for (const slot of mt) {
          if (!slot.days || slot.days.length === 0) continue;
          const days = slot.days.map((d) => DAY_ABBR_TO_FULL[d] || d).join(', ');
          const time = slot.start && slot.end ? `${to12h(slot.start)} - ${to12h(slot.end)}` : '';
          const loc = slot.location ? ` at ${slot.location}` : '';
          parts.push(`  Schedule: ${days} ${time}${loc}`);
        }
      }
      const links = c.links as CourseLink[] | null;
      if (links && Array.isArray(links) && links.length > 0) {
        for (const l of links) {
          parts.push(`  Link: ${l.label || 'Link'} - ${l.url || ''}`);
        }
      }
      return parts.join('\n');
    });
    sections.push(`ALL COURSES:\n${lines.join('\n')}`);
  }

  // ===== Format a work item with full details =====
  function formatWorkItem(w: typeof workItems[number]): string {
    const course = w.courseId ? courseMap.get(w.courseId) || '' : '';
    const dueDate = w.dueAt ? friendlyDate(new Date(w.dueAt)) : 'No due date';
    const parts: string[] = [];
    parts.push(`- ${w.title} (${w.type}${course ? `, ${course}` : ''}, due: ${dueDate}${w.priority ? `, priority: ${w.priority}` : ''})`);
    if (w.notes && typeof w.notes === 'string' && w.notes.trim()) {
      parts.push(`  Description: ${w.notes.trim().slice(0, 400)}`);
    }
    const tags = w.tags as string[] | null;
    if (tags && Array.isArray(tags) && tags.length > 0) {
      parts.push(`  Tags: ${tags.join(', ')}`);
    }
    const checklist = w.checklist as Array<{ text?: string; done?: boolean }> | null;
    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      const clStr = checklist.map((c) => `${c.done ? '[done]' : '[ ]'} ${c.text || ''}`).join(', ');
      parts.push(`  Checklist: ${clStr}`);
    }
    const wLinks = w.links as CourseLink[] | null;
    if (wLinks && Array.isArray(wLinks) && wLinks.length > 0) {
      for (const l of wLinks) {
        parts.push(`  Link: ${l.label || 'Link'} - ${l.url || ''}`);
      }
    }
    if (w.isRecurring) parts.push(`  (Recurring)`);
    return parts.join('\n');
  }

  // Open work items
  const openWorkData = truncateList(openWork, 50);
  if (openWorkData.items.length > 0) {
    const lines = openWorkData.items.map(formatWorkItem);
    if (openWorkData.overflow > 0) lines.push(`...and ${openWorkData.overflow} more`);
    sections.push(`OPEN WORK ITEMS (not yet completed):\n${lines.join('\n')}`);
  }

  // Completed work items (compact, most recent due date first)
  if (completedWork.length > 0) {
    const sorted = [...completedWork].sort((a, b) => {
      const da = a.dueAt ? new Date(a.dueAt).getTime() : 0;
      const db = b.dueAt ? new Date(b.dueAt).getTime() : 0;
      return db - da;
    });
    const recent = sorted.slice(0, 30);
    const lines = recent.map((w) => {
      const course = w.courseId ? courseMap.get(w.courseId) || '' : '';
      const dueDate = w.dueAt ? `was due ${friendlyDate(new Date(w.dueAt))}` : '';
      return `- ${w.title} (${w.type}${course ? `, ${course}` : ''}${dueDate ? `, ${dueDate}` : ''})`;
    });
    if (completedWork.length > 30) lines.push(`...and ${completedWork.length - 30} more`);
    sections.push(`COMPLETED WORK ITEMS:\n${lines.join('\n')}`);
  }

  // ===== Exams =====
  if (openExams.length > 0) {
    const lines = openExams.map((e) => {
      const course = e.courseId ? courseMap.get(e.courseId) || '' : '';
      const date = e.examAt ? friendlyDate(new Date(e.examAt)) : 'No date';
      const parts = [`- ${e.title} (${course ? `${course}, ` : ''}${date})`];
      if (e.location) parts.push(`  Location: ${e.location}`);
      if (e.notes && typeof e.notes === 'string' && e.notes.trim()) {
        parts.push(`  Notes: ${e.notes.trim().slice(0, 200)}`);
      }
      return parts.join('\n');
    });
    sections.push(`UPCOMING EXAMS:\n${lines.join('\n')}`);
  }

  // ===== Saved Notes (the Notes feature, not assignment notes) =====
  const notesData = truncateList(notes, 30);
  if (notesData.items.length > 0) {
    const lines = notesData.items.map((n) => {
      const course = n.courseId ? courseMap.get(n.courseId) || '' : '';
      const tags = Array.isArray(n.tags) && (n.tags as string[]).length > 0 ? ` [${(n.tags as string[]).join(', ')}]` : '';
      const parts = [`- ${n.title}${course ? ` (${course})` : ''}${tags}`];
      // Include a preview of the note content
      if (n.plainText && typeof n.plainText === 'string' && n.plainText.trim()) {
        parts.push(`  Preview: ${n.plainText.trim().slice(0, 300)}`);
      }
      return parts.join('\n');
    });
    if (notesData.overflow > 0) lines.push(`...and ${notesData.overflow} more`);
    sections.push(`SAVED NOTES (student's note documents):\n${lines.join('\n')}`);
  }

  // ===== Upcoming calendar events =====
  const futureEventsData = truncateList(futureEvents, 20);
  if (futureEventsData.items.length > 0) {
    const lines = futureEventsData.items.map((e) => {
      const date = friendlyDate(new Date(e.startAt));
      const parts = [`- ${e.title} (${date}${e.allDay ? ', all day' : ''})`];
      if (e.location) parts.push(`  Location: ${e.location}`);
      if (e.description && e.description.trim()) parts.push(`  Description: ${e.description.trim().slice(0, 150)}`);
      return parts.join('\n');
    });
    if (futureEventsData.overflow > 0) lines.push(`...and ${futureEventsData.overflow} more`);
    sections.push(`UPCOMING CALENDAR EVENTS:\n${lines.join('\n')}`);
  } else {
    sections.push(`UPCOMING CALENDAR EVENTS: None`);
  }

  // ===== Shopping =====
  const shopData = truncateList(shoppingItems, 30);
  if (shopData.items.length > 0) {
    const lines = shopData.items.map((s) => {
      const qty = s.quantity && s.quantity > 1 ? ` x${s.quantity}${s.unit ? ` ${s.unit}` : ''}` : '';
      const price = s.price ? ` $${s.price}` : '';
      const parts = [`- ${s.checked ? '[bought]' : '[ ]'} ${s.name}${qty}${price} (${s.listType}, ${s.category})`];
      if (s.notes && typeof s.notes === 'string' && s.notes.trim()) parts.push(`  Notes: ${s.notes.trim()}`);
      return parts.join('\n');
    });
    if (shopData.overflow > 0) lines.push(`...and ${shopData.overflow} more`);
    sections.push(`SHOPPING:\n${lines.join('\n')}`);
  }

  // ===== Active recurring patterns =====
  if (recurringWorkPatterns.length > 0) {
    const lines = recurringWorkPatterns.map((p) => {
      const template = p.workItemTemplate as Record<string, any> | null;
      const title = template?.title || 'Untitled';
      const type = template?.type || 'task';
      const courseId = template?.courseId;
      const course = courseId ? courseMap.get(courseId) || '' : '';
      const days = p.daysOfWeek as string[] | null;
      const daysOfMonth = p.daysOfMonth as number[] | null;
      let recurrenceStr = p.recurrenceType;
      if (days && Array.isArray(days) && days.length > 0) {
        recurrenceStr = `${p.recurrenceType} on ${days.map((d) => DAY_ABBR_TO_FULL[d] || d).join(', ')}`;
      } else if (daysOfMonth && Array.isArray(daysOfMonth) && daysOfMonth.length > 0) {
        recurrenceStr = `${p.recurrenceType} on day ${daysOfMonth.join(', ')} of month`;
      } else if (p.intervalDays) {
        recurrenceStr = `every ${p.intervalDays} days`;
      }
      const dateRange = [];
      if (p.startDate) dateRange.push(`from ${friendlyDate(new Date(p.startDate))}`);
      if (p.endDate) dateRange.push(`until ${friendlyDate(new Date(p.endDate))}`);
      const rangeStr = dateRange.length > 0 ? `, ${dateRange.join(' ')}` : '';
      return `- ${title} (${type}${course ? `, ${course}` : ''}, repeats: ${recurrenceStr}${rangeStr})`;
    });
    sections.push(`ACTIVE RECURRING TASKS:\n${lines.join('\n')}`);
  }

  // ===== Gamification =====
  if (streak) {
    sections.push(
      `GAMIFICATION:\n- Level: ${streak.level}\n- XP: ${streak.totalXp}\n- Current streak: ${streak.currentStreak} days\n- Longest streak: ${streak.longestStreak} days\n- Tasks completed: ${streak.totalTasksCompleted}`
    );
  }

  return `You are Orbi, the AI assistant built into College Orbit. You have access to all of the student's data below. Use their first name occasionally. Be friendly but not over the top — talk like a normal person, not an excited cheerleader. If someone asks your name, you're Orbi.

ABOUT COLLEGE ORBIT:
College Orbit is a privacy-first personal dashboard for students. Contact email: collegeorbit@protonmail.com. Website: collegeorbit.app

COMPLETE FEATURE GUIDE:

Courses:
- Add courses with name, code, meeting times, locations, and file attachments
- Set recurring class schedules (days, times, locations) that show on the calendar
- Add course links (syllabus, Canvas page, etc.)
- Track credits/units for GPA calculations

Work Items (Tasks, Assignments, Readings, Projects):
- Central hub for all academic tasks with 4 types: task, assignment, reading, project
- Each item can have: due date, priority (low/medium/high/urgent), course, tags, checklist, links, notes, file attachments
- AI-powered breakdown: break large assignments into smaller subtasks automatically (premium)
- Recurring work patterns: repeat on specific days of week, days of month, or custom intervals
- Filter and sort by type, course, priority, status, due date, or tags
- Quick add from anywhere using the "+" button or "N" key

Calendar:
- Month, week, and day views with navigation via arrow keys
- Create one-time or recurring events (daily, weekly, biweekly, monthly, custom)
- All-day events for holidays, due dates, or day-long activities
- Events inherit course colors for visual identification
- Google Calendar integration: two-way sync of events and schedules (premium)
- iCal export/subscription URL for Apple Calendar and other apps
- Shows class schedules, work item due dates, exams, and custom events together
- Scheduling conflict detection for overlapping events

Exams:
- Track exam name, course, date, time, location, and duration
- Countdown timer showing days/hours/minutes until each exam
- Attach study materials, notes, URLs, and files
- Reminders configurable per exam

Notes:
- Rich text editor with: bold, italic, underline, strikethrough, headings (H1-H3), bullet/numbered lists, checkboxes, code blocks (with syntax highlighting), blockquotes, links, LaTeX math equations
- Organize into folders (nestable) and link to courses
- Tags for cross-referencing across folders and courses
- AI-powered summarization: get concise summaries of any note (premium)
- Search through titles and content
- File attachments supported

Flashcards:
- Create decks linked to courses
- Spaced repetition algorithm (SM-2) tracks mastery and schedules reviews
- AI flashcard generation: generate cards from notes, PDFs, or topic descriptions (premium)
- Quiz mode with multiple question types
- Track daily study progress and card mastery

Shopping Lists:
- Three list types: grocery, wishlist, pantry inventory
- Add items with quantities, units, categories, prices, and notes
- Check items off as you shop
- Lists sync across devices

GPA & Grade Tools:
- GPA calculator for semester or cumulative GPA (supports 4.0, percentage, letter grades)
- What-if projector to see how future grades affect GPA
- Final grade calculator: what you need on the final to get your target grade
- GPA trend chart showing progress over semesters

Pomodoro Timer:
- Customizable work and break durations (default: 25 min work, 5 min break)
- Ambient focus sounds: rain, cafe noise, lo-fi beats, and more (premium)
- Track completed sessions in progress stats
- Notifications when switching between work and break

Progress & Gamification:
- Earn XP for completing tasks, maintaining streaks, and hitting milestones
- Level system based on total XP
- Streaks: consecutive days of completing at least one task
- Achievements/badges for milestones (first assignment, week-long streak, etc.)
- Daily challenges: 3 randomized challenges per day, +25 XP sweep bonus for completing all 3, reset at midnight local time
- Friends system: add friends, view their progress
- College leaderboards: compete with students at your school
- Monthly XP totals for leaderboard rankings
- Weekly review summarizing accomplishments

Other Tools:
- Word counter for essays and papers
- Citation generator for academic references
- Unit converter for math and science
- File converter: images (PNG, JPG, WebP), documents (PDF, DOCX, TXT)
- Global search: press "/" to search across courses, work items, exams, notes, flashcards, shopping, and pages

Integrations:
- Canvas LMS: auto-sync courses, assignments, grades, and events. Requires institution API access.
- Blackboard LMS: sync courses, assignments, and events
- Moodle LMS: sync courses, assignments, and events
- Brightspace/D2L LMS: sync courses, assignments, and events
- Google Calendar: two-way OAuth sync of events and schedules (premium)
- Browser extension for Chrome: quickly add items from Canvas or BYU Learning Suite
- iCal export for Apple Calendar and other apps

Settings & Preferences:
- Appearance: dark/light mode, 20+ visual themes (Ocean, Space, Sakura, Lo-Fi, Pixel, Aquarium, etc.), custom color themes, university colors, pet companions (12 animated pixel art animals), glow/gradient intensity, colorblind mode, random daily theme
- Preferences: date format (MM/DD, DD/MM, YYYY-MM-DD), 12h/24h time
- Notifications: email reminders for work items, exams, tasks, weekly digest, announcements
- Customization: reorder sidebar pages, reorder tool cards, choose visible pages and tools
- Data: export all data (JSON), import data, delete all data, force sync, clear cache
- Account page: manage profile, view active sessions, manage subscription, delete account

Subscription:
- Free tier: all core features (courses, work items, notes, calendar, exams, shopping, GPA tools, Pomodoro)
- Premium adds: AI features (Orbi chat, flashcard generation, work breakdown, note summarization), ambient sounds, Google Calendar sync, custom themes, visual themes, pet companion, and more
- 14-day free trial, no credit card required
- Monthly or annual billing (annual saves ~2 months)
- Payment via credit card (processed by Stripe)

Privacy & Security:
- All data encrypted in transit (HTTPS) and at rest (AES-256)
- Passwords hashed, never stored in plain text
- LMS tokens encrypted with AES-256-CBC
- No third-party advertising cookies
- Data retained while account active, permanently and immediately deleted upon account deletion
- GDPR-compliant data export and deletion

Keyboard Shortcuts:
- "?" to view all shortcuts
- "/" to open global search
- "N" to create new items
- "C" for courses, "W" for work items
- Arrow keys for navigation
- Ctrl/Cmd+B for bold in notes, etc.

Mobile:
- Web app works on mobile browsers
- Add to home screen for app-like experience (PWA)
- iOS: Share > Add to Home Screen
- Android: Menu > Install app

Troubleshooting:
- App not loading: refresh, clear cache, try different browser, check internet, disable extensions
- Data not syncing: check same account, refresh, log out/in, force sync in Settings
- Notifications not working: check browser permissions, system settings, in-app settings
- For technical issues, contact collegeorbit@protonmail.com

If someone asks about features, pricing, or how to do something in the app, use this knowledge. For pricing questions, direct them to the Pricing page at collegeorbit.app/pricing. For technical issues or feedback, suggest emailing collegeorbit@protonmail.com.

RULES:
- The data below is the COMPLETE source of truth. Read it carefully before answering.
- For "what's due today/tomorrow/Monday" questions: read "DUE THIS WEEK" for open items. Also check "COMPLETED THIS WEEK" for items due that day that are already done — mention those too if relevant.
- For "what assignments do I have on Monday" questions: combine open items from DUE THIS WEEK + completed items from COMPLETED THIS WEEK for that day.
- For "what classes do I have" questions: read the "CLASS SCHEDULE THIS WEEK" section.
- For "what's on my calendar this week" or "am I free on X day" questions: combine ALL of these — classes from CLASS SCHEDULE + assignments due from DUE THIS WEEK + completed items from COMPLETED THIS WEEK + events from UPCOMING CALENDAR EVENTS. Always include assignments due that day when talking about someone's schedule or availability.
- For "did I complete anything today/this week" or "what have I completed" questions: check "COMPLETED THIS WEEK" first (pre-organized by day). For older completed items, check the "COMPLETED WORK ITEMS" section (sorted by most recent due date first).
- For "what have I completed recently" questions: check "COMPLETED THIS WEEK" first, then "COMPLETED WORK ITEMS" for recent items beyond this week.
- For course links: read the "ALL COURSES" section.
- For assignment details: read "OPEN WORK ITEMS" which has descriptions, checklists, links, and tags for each item.
- For saved notes: read the "SAVED NOTES" section — these are note documents the student created, separate from assignment descriptions.
- When listing items, only show uncompleted/open items unless the student specifically asks about completed ones.
- If the student mentions an item by partial name, search ALL sections for the closest match.
- Never invent data. If something isn't in the data, say you don't see it.
- ABSOLUTELY NO MARKDOWN. Never use ** for bold. Never use ## for headers. Never use []() for links. Never use numbered lists with bold text. Just plain text with dashes for lists. Paste URLs as plain text. This is critical.
- Do NOT end your messages with filler like "Let me know if you need anything else!" or "If you need any more details, just let me know!" — just answer the question and stop. Only offer help if the answer is genuinely ambiguous.

${sections.join('\n\n')}`;
}

export const POST = withRateLimit(async function (request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI chat is not configured' }, { status: 500 });
    }

    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const accessCheck = await checkPremiumAccess(userId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'premium_required', message: accessCheck.message },
        { status: 403 }
      );
    }

    const body = await request.json();
    const message = (body.message || '').trim();
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history.slice(-MAX_HISTORY)
      : [];

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = await buildSystemPrompt(userId);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({
        role: (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    let response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 503 });
    }

    // Strip any markdown the model sneaks in
    response = response
      .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold** → bold
      .replace(/__(.*?)__/g, '$1')        // __bold__ → bold
      .replace(/\*(.*?)\*/g, '$1')        // *italic* → italic
      .replace(/^#{1,6}\s+/gm, '')        // ## headers → plain text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) → text

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI chat:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a moment.' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
});
