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

// ===== OpenAI Tool Definitions for Item Creation =====
const ORBI_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_work_item',
      description: 'Create a work item (task, assignment, reading, or project) for the student.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the work item' },
          type: { type: 'string', enum: ['task', 'assignment', 'reading', 'project'], description: 'Type of work item. Default: task' },
          courseName: { type: 'string', description: 'Course code or name to link this item to (e.g. "CS 101" or "Intro to CS"). Will be matched against the student\'s courses.' },
          dueAt: { type: 'string', description: 'Due date/time in ISO 8601 format' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' },
          effort: { type: 'string', enum: ['small', 'medium', 'large'], description: 'Effort estimate' },
          notes: { type: 'string', description: 'Additional notes or description' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the work item' },
          links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string', description: 'Link label' }, url: { type: 'string', description: 'URL' } }, required: ['url'] }, description: 'Links/URLs to attach (e.g. assignment page, resources)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_exam',
      description: 'Create an exam entry for the student.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Exam title' },
          examAt: { type: 'string', description: 'Exam date/time in ISO 8601 format' },
          courseName: { type: 'string', description: 'Course code or name to link this exam to' },
          location: { type: 'string', description: 'Exam location/room' },
          notes: { type: 'string', description: 'Additional notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string', description: 'Link label' }, url: { type: 'string', description: 'URL' } }, required: ['url'] }, description: 'Links/URLs to attach' },
        },
        required: ['title', 'examAt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_course',
      description: 'Create a new course for the student.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Course code (e.g. "CS 201")' },
          name: { type: 'string', description: 'Course name (e.g. "Data Structures")' },
          term: { type: 'string', description: 'Term/semester (e.g. "Fall 2026")' },
          credits: { type: 'number', description: 'Number of credits' },
          meetingTimes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                days: { type: 'array', items: { type: 'string', enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }, description: 'Days of the week (abbreviated)' },
                start: { type: 'string', description: 'Start time in HH:MM 24-hour format' },
                end: { type: 'string', description: 'End time in HH:MM 24-hour format' },
                location: { type: 'string', description: 'Room/location' },
              },
            },
            description: 'Meeting time slots',
          },
        },
        required: ['code', 'name', 'term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a personal calendar event for the student.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          startAt: { type: 'string', description: 'Start date/time in ISO 8601 format' },
          endAt: { type: 'string', description: 'End date/time in ISO 8601 format' },
          allDay: { type: 'boolean', description: 'Whether this is an all-day event' },
          description: { type: 'string', description: 'Event description' },
          location: { type: 'string', description: 'Event location' },
        },
        required: ['title', 'startAt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: 'Create a note document for the student.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Note title' },
          content: { type: 'string', description: 'Plain text content for the note' },
          courseName: { type: 'string', description: 'Course code or name to link this note to' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_shopping_item',
      description: 'Create a shopping list item for the student.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Item name' },
          listType: { type: 'string', enum: ['grocery', 'wishlist', 'pantry'], description: 'Which list to add to' },
          quantity: { type: 'number', description: 'Quantity' },
          unit: { type: 'string', description: 'Unit of measurement (e.g. lbs, oz, pack)' },
          category: { type: 'string', description: 'Category (e.g. Dairy, Produce, Snacks, Electronics, Other)' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['name', 'listType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_excluded_date',
      description: 'Add an excluded date or holiday to the student\'s calendar. These are dates when classes are cancelled or the student has no school (e.g. spring break, holidays, snow days). Recurring tasks/work items are skipped on these dates.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Description of the excluded date (e.g. "Spring Break", "Labor Day", "Snow Day")' },
          date: { type: 'string', description: 'Single date in YYYY-MM-DD format' },
          dates: { type: 'array', items: { type: 'string' }, description: 'Array of dates in YYYY-MM-DD format for date ranges (e.g. spring break spanning multiple days). Use this instead of date for ranges.' },
          courseName: { type: 'string', description: 'Course code or name if this excluded date only applies to a specific course. Leave empty for global holidays.' },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_work_item_status',
      description: 'Mark a work item (task, assignment, reading, or project) as complete or incomplete.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title (or partial title) of the work item to update. Will be fuzzy matched against the student\'s work items.' },
          status: { type: 'string', enum: ['done', 'open'], description: 'New status: "done" to mark complete, "open" to mark incomplete' },
        },
        required: ['title', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_work_item',
      description: 'Delete a work item (task, assignment, reading, or project).',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title (or partial title) of the work item to delete. Will be fuzzy matched.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_exam',
      description: 'Delete an exam.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title (or partial title) of the exam to delete. Will be fuzzy matched.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_calendar_event',
      description: 'Delete a calendar event.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title (or partial title) of the calendar event to delete. Will be fuzzy matched.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_note',
      description: 'Delete a note.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title (or partial title) of the note to delete. Will be fuzzy matched.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_shopping_item',
      description: 'Delete a shopping list item.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name (or partial name) of the shopping item to delete. Will be fuzzy matched.' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'control_pomodoro',
      description: 'Control the Pomodoro focus timer: start, pause, or stop/reset it. Can also set work/break durations when starting.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['start', 'pause', 'stop', 'skip'], description: '"start" to begin or resume, "pause" to pause, "stop" to stop and reset, "skip" to skip to the next session (work or break)' },
          workDuration: { type: 'number', description: 'Work session length in minutes (only used with "start")' },
          breakDuration: { type: 'number', description: 'Break session length in minutes (only used with "start")' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_settings',
      description: 'Update the student\'s app settings and preferences. Only include the fields you want to change.',
      parameters: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'], description: 'Light or dark mode' },
          visualTheme: { type: 'string', enum: ['default', 'cartoon', 'cyberpunk', 'retro', 'nature', 'ocean', 'lavender', 'space', 'pixel', 'aquarium', 'cozy', 'winter', 'sakura', 'halloween', 'autumn', 'spring', 'noir', 'lofi', 'jungle', 'glass', 'steampunk', 'terminal', 'paper', 'skeuomorphic', 'random'], description: 'Visual theme (premium). "random" picks a different theme each day.' },
          timeFormat: { type: 'string', enum: ['12h', '24h'], description: 'Time display format' },
          dateFormat: { type: 'string', enum: ['MM/DD/YYYY', 'DD/MM/YYYY'], description: 'Date display format' },
          weekStartsOn: { type: 'string', enum: ['Sun', 'Mon'], description: 'First day of the week' },
          university: { type: 'string', description: 'University name (affects color theme)' },
          pomodoroWorkDuration: { type: 'number', description: 'Pomodoro work session in minutes' },
          pomodoroBreakDuration: { type: 'number', description: 'Pomodoro break session in minutes' },
          pomodoroIsMuted: { type: 'boolean', description: 'Mute pomodoro notification sounds' },
          petCompanion: { type: 'boolean', description: 'Enable/disable pet companion (premium)' },
          petCompanionAnimal: { type: 'string', enum: ['rottweiler', 'dalmatian', 'husky', 'canecorso', 'dogoargentino', 'golden', 'labrador', 'pharaoh', 'fox', 'turtle', 'parrotblue', 'parrotgreen'], description: 'Pet companion animal type' },
          enableNotifications: { type: 'boolean', description: 'Enable browser notifications' },
          enableKeyboardShortcuts: { type: 'boolean', description: 'Enable keyboard shortcuts' },
          confirmBeforeDelete: { type: 'boolean', description: 'Show confirmation before deleting items' },
          showRelativeDates: { type: 'boolean', description: 'Show "Today", "Tomorrow" instead of dates' },
          showNavCounts: { type: 'boolean', description: 'Show overdue counts in navigation' },
          showPriorityIndicators: { type: 'boolean', description: 'Show priority badges on tasks' },
          showEffortIndicators: { type: 'boolean', description: 'Show effort badges on items' },
          showCourseCode: { type: 'boolean', description: 'Show course codes instead of names' },
          groupTasksByCourse: { type: 'boolean', description: 'Group tasks by course in list view' },
          groupAssignmentsByCourse: { type: 'boolean', description: 'Group assignments by course' },
          gradientIntensity: { type: 'number', description: 'Gradient intensity 0-100' },
          glowIntensity: { type: 'number', description: 'Glow effect intensity 0-100' },
          colorblindMode: { type: 'string', enum: ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia', 'off'], description: 'Colorblind mode type. Use "off" to disable.' },
          colorblindStyle: { type: 'string', enum: ['palette', 'patterns', 'both', 'off'], description: 'How to apply colorblind adjustments. Use "off" to disable.' },
          emailWeeklyDigest: { type: 'boolean', description: 'Receive weekly digest email' },
          emailExamReminders: { type: 'boolean', description: 'Receive exam reminder emails' },
          emailDeadlineReminders: { type: 'boolean', description: 'Receive deadline reminder emails' },
          emailTaskReminders: { type: 'boolean', description: 'Receive task reminder emails' },
          emailAnnouncements: { type: 'boolean', description: 'Receive announcement emails' },
          flashcardDailyGoal: { type: 'number', description: 'Daily flashcard review goal' },
          flashcardShuffleOrder: { type: 'boolean', description: 'Shuffle flashcard order' },
          flashcardSoundEffects: { type: 'boolean', description: 'Enable flashcard sound effects' },
          flashcardCelebrations: { type: 'boolean', description: 'Enable flashcard celebration animations' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_feedback_email',
      description: 'Send a feedback, bug report, or feature request email to the College Orbit team on behalf of the student.',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Email subject line' },
          message: { type: 'string', description: 'Email body content' },
          type: { type: 'string', enum: ['feedback', 'bug_report', 'feature_request', 'question', 'other'], description: 'Type of message' },
        },
        required: ['subject', 'message'],
      },
    },
  },
  // ===== Edit/Update Tools =====
  {
    type: 'function',
    function: {
      name: 'update_work_item',
      description: 'Edit/update an existing work item. Match by current title, then update any fields.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Current title (or partial) of the work item to update. Will be fuzzy matched.' },
          newTitle: { type: 'string', description: 'New title for the work item' },
          type: { type: 'string', enum: ['task', 'assignment', 'reading', 'project'], description: 'New type' },
          courseName: { type: 'string', description: 'New course (code or name)' },
          dueAt: { type: 'string', description: 'New due date/time in ISO 8601' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'New priority' },
          effort: { type: 'string', enum: ['small', 'medium', 'large'], description: 'New effort' },
          notes: { type: 'string', description: 'New notes/description' },
          tags: { type: 'array', items: { type: 'string' }, description: 'New tags (replaces existing)' },
          links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string', description: 'Link label' }, url: { type: 'string', description: 'URL' } }, required: ['url'] }, description: 'Links/URLs to attach (replaces existing links)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_exam',
      description: 'Edit/update an existing exam. Match by current title, then update any fields.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Current title (or partial) of the exam to update. Will be fuzzy matched.' },
          newTitle: { type: 'string', description: 'New title' },
          examAt: { type: 'string', description: 'New exam date/time in ISO 8601' },
          courseName: { type: 'string', description: 'New course' },
          location: { type: 'string', description: 'New location' },
          notes: { type: 'string', description: 'New notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
          links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string', description: 'Link label' }, url: { type: 'string', description: 'URL' } }, required: ['url'] }, description: 'Links/URLs to attach (replaces existing links)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_calendar_event',
      description: 'Edit/update an existing calendar event. Match by current title, then update any fields.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Current title (or partial). Will be fuzzy matched.' },
          newTitle: { type: 'string', description: 'New title' },
          startAt: { type: 'string', description: 'New start date/time in ISO 8601' },
          endAt: { type: 'string', description: 'New end date/time in ISO 8601' },
          allDay: { type: 'boolean', description: 'Whether all-day event' },
          description: { type: 'string', description: 'New description' },
          location: { type: 'string', description: 'New location' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_note',
      description: 'Edit/update an existing note. Match by current title, then update any fields.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Current title (or partial). Will be fuzzy matched.' },
          newTitle: { type: 'string', description: 'New title' },
          content: { type: 'string', description: 'New plain text content (replaces existing)' },
          courseName: { type: 'string', description: 'New course' },
          tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_shopping_item',
      description: 'Edit/update an existing shopping list item. Match by current name, then update any fields.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Current name (or partial). Will be fuzzy matched.' },
          newName: { type: 'string', description: 'New name' },
          listType: { type: 'string', enum: ['grocery', 'wishlist', 'pantry'], description: 'Move to different list' },
          quantity: { type: 'number', description: 'New quantity' },
          unit: { type: 'string', description: 'New unit' },
          category: { type: 'string', description: 'New category' },
          notes: { type: 'string', description: 'New notes' },
        },
        required: ['name'],
      },
    },
  },
  // ===== Bulk Operations =====
  {
    type: 'function',
    function: {
      name: 'bulk_update_work_items',
      description: 'Bulk update multiple work items at once. Filter by type, course, tags, or status, then apply an action.',
      parameters: {
        type: 'object',
        properties: {
          filterType: { type: 'string', enum: ['task', 'assignment', 'reading', 'project'], description: 'Filter by work item type' },
          filterCourseName: { type: 'string', description: 'Filter by course name/code' },
          filterStatus: { type: 'string', enum: ['open', 'done'], description: 'Filter by current status' },
          filterTag: { type: 'string', description: 'Filter by tag' },
          action: { type: 'string', enum: ['mark_done', 'mark_open', 'delete'], description: 'Action to apply to all matching items' },
        },
        required: ['action'],
      },
    },
  },
  // ===== Recurring Work Pattern =====
  {
    type: 'function',
    function: {
      name: 'create_recurring_work_pattern',
      description: 'Create a recurring work item pattern that automatically generates work items on a schedule. Requires premium.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title for the recurring work item' },
          type: { type: 'string', enum: ['task', 'assignment', 'reading', 'project'], description: 'Work item type. Default: task' },
          courseName: { type: 'string', description: 'Course code or name' },
          recurrenceType: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'custom'], description: 'How it repeats' },
          daysOfWeek: { type: 'array', items: { type: 'string', enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }, description: 'Days of week for weekly recurrence' },
          daysOfMonth: { type: 'array', items: { type: 'number' }, description: 'Days of month (1-31) for monthly recurrence' },
          intervalDays: { type: 'number', description: 'Custom interval in days (for custom recurrence)' },
          startDate: { type: 'string', description: 'Start date in ISO 8601 format' },
          endDate: { type: 'string', description: 'End date in ISO 8601 format (optional)' },
          dueTime: { type: 'string', description: 'Due time in HH:MM 24h format. Default: 23:59' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority' },
          effort: { type: 'string', enum: ['small', 'medium', 'large'], description: 'Effort' },
          notes: { type: 'string', description: 'Notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
        },
        required: ['title', 'recurrenceType'],
      },
    },
  },
  // ===== Grade/GPA Management =====
  {
    type: 'function',
    function: {
      name: 'create_gpa_entry',
      description: 'Add a grade entry to the student\'s GPA tracker.',
      parameters: {
        type: 'object',
        properties: {
          courseName: { type: 'string', description: 'Course name for the grade entry (e.g. "Intro to CS" or "CS 101")' },
          grade: { type: 'string', description: 'Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)' },
          credits: { type: 'number', description: 'Number of credits/units' },
          term: { type: 'string', description: 'Term/semester (e.g. "Fall 2025")' },
          status: { type: 'string', enum: ['in_progress', 'final'], description: 'Whether the grade is final or in progress. Default: final' },
        },
        required: ['courseName', 'grade', 'credits'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_gpa_entry',
      description: 'Update an existing grade entry. Match by course name, then update fields.',
      parameters: {
        type: 'object',
        properties: {
          courseName: { type: 'string', description: 'Current course name (or partial). Will be fuzzy matched.' },
          newCourseName: { type: 'string', description: 'New course name' },
          grade: { type: 'string', description: 'New grade' },
          credits: { type: 'number', description: 'New credits' },
          term: { type: 'string', description: 'New term' },
          status: { type: 'string', enum: ['in_progress', 'final'], description: 'New status' },
        },
        required: ['courseName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_gpa_entry',
      description: 'Delete a grade entry from the GPA tracker.',
      parameters: {
        type: 'object',
        properties: {
          courseName: { type: 'string', description: 'Course name (or partial) of the grade entry to delete. Will be fuzzy matched.' },
        },
        required: ['courseName'],
      },
    },
  },
  // ===== Study Planning =====
  {
    type: 'function',
    function: {
      name: 'create_study_plan',
      description: 'Create a study plan by generating multiple calendar events or work items as study blocks leading up to an exam or deadline. Use this when the student asks to plan study sessions.',
      parameters: {
        type: 'object',
        properties: {
          examTitle: { type: 'string', description: 'Title of the exam or deadline to study for' },
          startDate: { type: 'string', description: 'When to start studying (ISO 8601)' },
          endDate: { type: 'string', description: 'When the exam/deadline is (ISO 8601). Study sessions are scheduled before this date.' },
          sessionsPerDay: { type: 'number', description: 'Number of study sessions per day. Default: 1' },
          sessionDurationMinutes: { type: 'number', description: 'Duration of each session in minutes. Default: 60' },
          preferredTime: { type: 'string', description: 'Preferred start time for study sessions in HH:MM 24h format. Default: 14:00' },
          topics: { type: 'array', items: { type: 'string' }, description: 'List of topics to cycle through across study sessions' },
          createAs: { type: 'string', enum: ['calendar_event', 'work_item'], description: 'Create study blocks as calendar events or work items. Default: calendar_event' },
        },
        required: ['examTitle', 'startDate', 'endDate'],
      },
    },
  },
];

// Resolve a course name/code to a course ID by fuzzy matching against the user's courses
async function resolveCourseId(courseName: string, userId: string): Promise<string | null> {
  if (!courseName) return null;
  const courses = await prisma.course.findMany({
    where: { userId },
    select: { id: true, code: true, name: true },
  });
  const lower = courseName.toLowerCase().replace(/\s+/g, '');
  // Try exact code match first, then partial match
  for (const c of courses) {
    if (c.code.toLowerCase().replace(/\s+/g, '') === lower) return c.id;
  }
  for (const c of courses) {
    if (c.name.toLowerCase().replace(/\s+/g, '') === lower) return c.id;
  }
  // Partial match: check if input is contained in code or name, or vice versa
  for (const c of courses) {
    const codeLower = c.code.toLowerCase().replace(/\s+/g, '');
    const nameLower = c.name.toLowerCase().replace(/\s+/g, '');
    if (codeLower.includes(lower) || lower.includes(codeLower)) return c.id;
    if (nameLower.includes(lower) || lower.includes(nameLower)) return c.id;
  }
  return null;
}

// Fuzzy match an item by title/name from a list of candidates
function fuzzyMatchItem<T extends { id: string }>(
  candidates: T[],
  search: string,
  getLabel: (item: T) => string
): T | null {
  if (!search) return null;
  const lower = search.toLowerCase().trim();
  // Exact match first
  for (const c of candidates) {
    if (getLabel(c).toLowerCase().trim() === lower) return c;
  }
  // Starts-with match
  for (const c of candidates) {
    if (getLabel(c).toLowerCase().trim().startsWith(lower)) return c;
  }
  // Contains match
  for (const c of candidates) {
    if (getLabel(c).toLowerCase().includes(lower)) return c;
  }
  // Reverse contains (search contains the label)
  for (const c of candidates) {
    if (lower.includes(getLabel(c).toLowerCase().trim())) return c;
  }
  return null;
}

interface ToolResult {
  success: boolean;
  type: string;
  item: any;
  error?: string;
}

async function executeToolCall(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'create_work_item': {
        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }
        let dueAt: Date | null = null;
        if (args.dueAt) {
          dueAt = new Date(args.dueAt);
          if (isNaN(dueAt.getTime())) dueAt = null;
        }
        const parsedLinks = (args.links || []).map((l: any) => ({
          label: l.label || (l.url ? new URL(l.url).hostname : 'Link'),
          url: l.url,
        }));
        const workItem = await prisma.workItem.create({
          data: {
            userId,
            title: args.title.trim(),
            type: args.type || 'task',
            courseId,
            dueAt,
            priority: args.priority || null,
            effort: args.effort || null,
            notes: args.notes || '',
            tags: args.tags || [],
            checklist: [],
            links: parsedLinks,
            files: [],
            status: 'open',
            pinned: false,
            workingOn: false,
            isRecurring: false,
          },
          include: {
            course: { select: { id: true, code: true, name: true, colorTag: true } },
          },
        });
        return { success: true, type: 'workItem', item: workItem };
      }

      case 'create_exam': {
        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }
        const examAt = new Date(args.examAt);
        if (isNaN(examAt.getTime())) {
          return { success: false, type: 'exam', item: null, error: 'Invalid exam date' };
        }
        const examLinks = (args.links || []).map((l: any) => ({
          label: l.label || (l.url ? new URL(l.url).hostname : 'Link'),
          url: l.url,
        }));
        const exam = await prisma.exam.create({
          data: {
            userId,
            title: args.title.trim(),
            courseId,
            examAt,
            location: args.location || null,
            notes: args.notes || '',
            tags: args.tags || [],
            links: examLinks,
            files: [],
            status: 'scheduled',
          },
          include: { course: true },
        });
        return { success: true, type: 'exam', item: exam };
      }

      case 'create_course': {
        const course = await prisma.course.create({
          data: {
            userId,
            code: args.code.trim(),
            name: args.name.trim(),
            term: args.term.trim(),
            credits: args.credits ?? null,
            meetingTimes: args.meetingTimes || [],
            links: [],
            files: [],
          },
        });
        return { success: true, type: 'course', item: course };
      }

      case 'create_calendar_event': {
        const startAt = new Date(args.startAt);
        if (isNaN(startAt.getTime())) {
          return { success: false, type: 'calendarEvent', item: null, error: 'Invalid start date' };
        }
        const event = await prisma.calendarEvent.create({
          data: {
            userId,
            title: args.title.trim(),
            startAt,
            endAt: args.endAt ? new Date(args.endAt) : null,
            allDay: args.allDay || false,
            description: args.description || '',
            location: args.location || null,
          },
        });
        return { success: true, type: 'calendarEvent', item: event };
      }

      case 'create_note': {
        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }
        const plainText = args.content || '';
        const content = plainText
          ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: plainText }] }] }
          : { type: 'doc', content: [] };
        const note = await prisma.note.create({
          data: {
            userId,
            title: args.title.trim(),
            content,
            plainText,
            courseId,
            tags: args.tags || [],
            isPinned: false,
            links: [],
            files: [],
          },
          include: {
            course: { select: { id: true, code: true, name: true } },
            folder: { select: { id: true, name: true } },
          },
        });
        return { success: true, type: 'note', item: note };
      }

      case 'create_shopping_item': {
        const item = await prisma.shoppingItem.create({
          data: {
            userId,
            name: args.name.trim(),
            listType: args.listType,
            quantity: args.quantity || 1,
            unit: args.unit || null,
            category: args.category || 'Other',
            notes: args.notes || '',
            checked: false,
            order: 0,
          },
        });
        return { success: true, type: 'shoppingItem', item };
      }

      case 'create_excluded_date': {
        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }
        // Support single date or date range
        const datesToCreate: Date[] = [];
        if (args.dates && Array.isArray(args.dates)) {
          for (const d of args.dates) {
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) datesToCreate.push(parsed);
          }
        } else if (args.date) {
          const parsed = new Date(args.date);
          if (!isNaN(parsed.getTime())) datesToCreate.push(parsed);
        }
        if (datesToCreate.length === 0) {
          return { success: false, type: 'excludedDate', item: null, error: 'No valid date provided' };
        }
        await prisma.excludedDate.createMany({
          data: datesToCreate.map((d) => ({
            userId,
            courseId,
            date: d,
            description: args.description.trim(),
          })),
        });
        // Fetch back the created dates to return to the frontend
        const created = await prisma.excludedDate.findMany({
          where: { userId },
          orderBy: { date: 'asc' },
        });
        const formatted = created.map((d) => ({
          ...d,
          date: d.date.toISOString().split('T')[0],
        }));
        return { success: true, type: 'excludedDateSync', item: formatted };
      }

      case 'update_work_item_status': {
        const allWorkItems = await prisma.workItem.findMany({
          where: { userId },
          select: { id: true, title: true, status: true },
        });
        const match = fuzzyMatchItem(allWorkItems, args.title, (w) => w.title);
        if (!match) {
          return { success: false, type: 'workItem', item: null, error: `Could not find a work item matching "${args.title}"` };
        }
        const updated = await prisma.workItem.update({
          where: { id: match.id },
          data: { status: args.status },
          include: { course: { select: { id: true, code: true, name: true, colorTag: true } } },
        });
        return { success: true, type: 'workItemUpdate', item: updated };
      }

      case 'delete_work_item': {
        const allWorkItems = await prisma.workItem.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allWorkItems, args.title, (w) => w.title);
        if (!match) {
          return { success: false, type: 'workItem', item: null, error: `Could not find a work item matching "${args.title}"` };
        }
        await prisma.workItem.delete({ where: { id: match.id } });
        return { success: true, type: 'workItemDelete', item: { id: match.id, title: match.title } };
      }

      case 'delete_exam': {
        const allExams = await prisma.exam.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allExams, args.title, (e) => e.title);
        if (!match) {
          return { success: false, type: 'exam', item: null, error: `Could not find an exam matching "${args.title}"` };
        }
        await prisma.exam.delete({ where: { id: match.id } });
        return { success: true, type: 'examDelete', item: { id: match.id, title: match.title } };
      }

      case 'delete_calendar_event': {
        const allEvents = await prisma.calendarEvent.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allEvents, args.title, (e) => e.title);
        if (!match) {
          return { success: false, type: 'calendarEvent', item: null, error: `Could not find a calendar event matching "${args.title}"` };
        }
        await prisma.calendarEvent.delete({ where: { id: match.id } });
        return { success: true, type: 'calendarEventDelete', item: { id: match.id, title: match.title } };
      }

      case 'delete_note': {
        const allNotes = await prisma.note.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allNotes, args.title, (n) => n.title);
        if (!match) {
          return { success: false, type: 'note', item: null, error: `Could not find a note matching "${args.title}"` };
        }
        await prisma.note.delete({ where: { id: match.id } });
        return { success: true, type: 'noteDelete', item: { id: match.id, title: match.title } };
      }

      case 'delete_shopping_item': {
        const allItems = await prisma.shoppingItem.findMany({
          where: { userId, purchasedAt: null },
          select: { id: true, name: true },
        });
        const match = fuzzyMatchItem(allItems, args.name, (s) => s.name);
        if (!match) {
          return { success: false, type: 'shoppingItem', item: null, error: `Could not find a shopping item matching "${args.name}"` };
        }
        await prisma.shoppingItem.delete({ where: { id: match.id } });
        return { success: true, type: 'shoppingItemDelete', item: { id: match.id, name: match.name } };
      }

      case 'control_pomodoro': {
        const action = args.action as 'start' | 'pause' | 'stop' | 'skip';
        // Optionally update pomodoro settings when starting
        if (action === 'start') {
          const pomodoroUpdates: Record<string, any> = {};
          if (args.workDuration && args.workDuration > 0) pomodoroUpdates.pomodoroWorkDuration = args.workDuration;
          if (args.breakDuration && args.breakDuration > 0) pomodoroUpdates.pomodoroBreakDuration = args.breakDuration;
          if (Object.keys(pomodoroUpdates).length > 0) {
            await prisma.settings.upsert({
              where: { userId },
              update: pomodoroUpdates,
              create: { userId, ...pomodoroUpdates },
            });
          }
        }
        return {
          success: true,
          type: 'pomodoroControl',
          item: {
            action,
            workDuration: args.workDuration || null,
            breakDuration: args.breakDuration || null,
          },
        };
      }

      case 'update_settings': {
        const updateData: Record<string, any> = {};
        // Map each allowed setting field
        const directFields = [
          'theme', 'timeFormat', 'dateFormat', 'weekStartsOn', 'university',
          'pomodoroWorkDuration', 'pomodoroBreakDuration', 'pomodoroIsMuted',
          'petCompanion', 'petCompanionAnimal', 'enableNotifications',
          'enableKeyboardShortcuts', 'confirmBeforeDelete', 'showRelativeDates',
          'showNavCounts', 'showPriorityIndicators', 'showEffortIndicators',
          'showCourseCode', 'groupTasksByCourse', 'groupAssignmentsByCourse',
          'gradientIntensity', 'glowIntensity',
          'emailWeeklyDigest', 'emailExamReminders', 'emailDeadlineReminders',
          'emailTaskReminders', 'emailAnnouncements',
          'flashcardDailyGoal', 'flashcardShuffleOrder', 'flashcardSoundEffects',
          'flashcardCelebrations', 'visualTheme',
        ];
        for (const field of directFields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        // Handle colorblind "off" as null
        if (args.colorblindMode !== undefined) {
          updateData.colorblindMode = args.colorblindMode === 'off' ? null : args.colorblindMode;
        }
        if (args.colorblindStyle !== undefined) {
          updateData.colorblindStyle = args.colorblindStyle === 'off' ? null : args.colorblindStyle;
        }
        if (Object.keys(updateData).length === 0) {
          return { success: false, type: 'settings', item: null, error: 'No settings to update' };
        }
        await prisma.settings.upsert({
          where: { userId },
          update: updateData,
          create: { userId, ...updateData },
        });
        return { success: true, type: 'settingsUpdate', item: updateData };
      }

      // ===== Edit/Update Tools =====
      case 'update_work_item': {
        const allWorkItems = await prisma.workItem.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allWorkItems, args.title, (w) => w.title);
        if (!match) {
          return { success: false, type: 'workItem', item: null, error: `Could not find a work item matching "${args.title}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newTitle) updateData.title = args.newTitle.trim();
        if (args.type) updateData.type = args.type;
        if (args.dueAt) {
          const d = new Date(args.dueAt);
          if (!isNaN(d.getTime())) updateData.dueAt = d;
        }
        if (args.priority) updateData.priority = args.priority;
        if (args.effort) updateData.effort = args.effort;
        if (args.notes !== undefined) updateData.notes = args.notes;
        if (args.tags) updateData.tags = args.tags;
        if (args.links) {
          updateData.links = args.links.map((l: any) => ({
            label: l.label || (l.url ? new URL(l.url).hostname : 'Link'),
            url: l.url,
          }));
        }
        if (args.courseName) {
          const courseId = await resolveCourseId(args.courseName, userId);
          if (courseId) updateData.courseId = courseId;
        }
        const updated = await prisma.workItem.update({
          where: { id: match.id },
          data: updateData,
          include: { course: { select: { id: true, code: true, name: true, colorTag: true } } },
        });
        return { success: true, type: 'workItemUpdate', item: updated };
      }

      case 'update_exam': {
        const allExams = await prisma.exam.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allExams, args.title, (e) => e.title);
        if (!match) {
          return { success: false, type: 'exam', item: null, error: `Could not find an exam matching "${args.title}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newTitle) updateData.title = args.newTitle.trim();
        if (args.examAt) {
          const d = new Date(args.examAt);
          if (!isNaN(d.getTime())) updateData.examAt = d;
        }
        if (args.location !== undefined) updateData.location = args.location;
        if (args.notes !== undefined) updateData.notes = args.notes;
        if (args.tags) updateData.tags = args.tags;
        if (args.links) {
          updateData.links = args.links.map((l: any) => ({
            label: l.label || (l.url ? new URL(l.url).hostname : 'Link'),
            url: l.url,
          }));
        }
        if (args.courseName) {
          const courseId = await resolveCourseId(args.courseName, userId);
          if (courseId) updateData.courseId = courseId;
        }
        const updated = await prisma.exam.update({
          where: { id: match.id },
          data: updateData,
          include: { course: true },
        });
        return { success: true, type: 'examUpdate', item: updated };
      }

      case 'update_calendar_event': {
        const allEvents = await prisma.calendarEvent.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allEvents, args.title, (e) => e.title);
        if (!match) {
          return { success: false, type: 'calendarEvent', item: null, error: `Could not find a calendar event matching "${args.title}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newTitle) updateData.title = args.newTitle.trim();
        if (args.startAt) {
          const d = new Date(args.startAt);
          if (!isNaN(d.getTime())) updateData.startAt = d;
        }
        if (args.endAt) {
          const d = new Date(args.endAt);
          if (!isNaN(d.getTime())) updateData.endAt = d;
        }
        if (args.allDay !== undefined) updateData.allDay = args.allDay;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.location !== undefined) updateData.location = args.location;
        const updated = await prisma.calendarEvent.update({
          where: { id: match.id },
          data: updateData,
        });
        return { success: true, type: 'calendarEventUpdate', item: updated };
      }

      case 'update_note': {
        const allNotes = await prisma.note.findMany({
          where: { userId },
          select: { id: true, title: true },
        });
        const match = fuzzyMatchItem(allNotes, args.title, (n) => n.title);
        if (!match) {
          return { success: false, type: 'note', item: null, error: `Could not find a note matching "${args.title}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newTitle) updateData.title = args.newTitle.trim();
        if (args.content !== undefined) {
          updateData.plainText = args.content;
          updateData.content = args.content
            ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: args.content }] }] }
            : { type: 'doc', content: [] };
        }
        if (args.tags) updateData.tags = args.tags;
        if (args.courseName) {
          const courseId = await resolveCourseId(args.courseName, userId);
          if (courseId) updateData.courseId = courseId;
        }
        const updated = await prisma.note.update({
          where: { id: match.id },
          data: updateData,
          include: {
            course: { select: { id: true, code: true, name: true } },
            folder: { select: { id: true, name: true } },
          },
        });
        return { success: true, type: 'noteUpdate', item: updated };
      }

      case 'update_shopping_item': {
        const allItems = await prisma.shoppingItem.findMany({
          where: { userId, purchasedAt: null },
          select: { id: true, name: true },
        });
        const match = fuzzyMatchItem(allItems, args.name, (s) => s.name);
        if (!match) {
          return { success: false, type: 'shoppingItem', item: null, error: `Could not find a shopping item matching "${args.name}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newName) updateData.name = args.newName.trim();
        if (args.listType) updateData.listType = args.listType;
        if (args.quantity !== undefined) updateData.quantity = args.quantity;
        if (args.unit !== undefined) updateData.unit = args.unit;
        if (args.category) updateData.category = args.category;
        if (args.notes !== undefined) updateData.notes = args.notes;
        const updated = await prisma.shoppingItem.update({
          where: { id: match.id },
          data: updateData,
        });
        return { success: true, type: 'shoppingItemUpdate', item: updated };
      }

      // ===== Bulk Operations =====
      case 'bulk_update_work_items': {
        const where: Record<string, any> = { userId };
        if (args.filterType) where.type = args.filterType;
        if (args.filterStatus) where.status = args.filterStatus;
        if (args.filterTag) where.tags = { has: args.filterTag };
        if (args.filterCourseName) {
          const courseId = await resolveCourseId(args.filterCourseName, userId);
          if (courseId) where.courseId = courseId;
        }

        const matchingItems = await prisma.workItem.findMany({
          where,
          select: { id: true, title: true },
        });

        if (matchingItems.length === 0) {
          return { success: false, type: 'bulkUpdate', item: null, error: 'No work items matched the filter criteria' };
        }

        const ids = matchingItems.map((w) => w.id);

        if (args.action === 'mark_done') {
          await prisma.workItem.updateMany({ where: { id: { in: ids } }, data: { status: 'done' } });
          return { success: true, type: 'bulkWorkItemUpdate', item: { count: ids.length, action: 'mark_done', titles: matchingItems.map((w) => w.title) } };
        } else if (args.action === 'mark_open') {
          await prisma.workItem.updateMany({ where: { id: { in: ids } }, data: { status: 'open' } });
          return { success: true, type: 'bulkWorkItemUpdate', item: { count: ids.length, action: 'mark_open', titles: matchingItems.map((w) => w.title) } };
        } else if (args.action === 'delete') {
          await prisma.workItem.deleteMany({ where: { id: { in: ids } } });
          return { success: true, type: 'bulkWorkItemDelete', item: { count: ids.length, ids, titles: matchingItems.map((w) => w.title) } };
        }
        return { success: false, type: 'bulkUpdate', item: null, error: 'Unknown action' };
      }

      // ===== Recurring Work Pattern =====
      case 'create_recurring_work_pattern': {
        // Requires premium
        const premiumCheck = await checkPremiumAccess(userId);
        if (!premiumCheck.allowed) {
          return { success: false, type: 'recurringPattern', item: null, error: 'Recurring work items require Premium. Upgrade to create recurring items.' };
        }

        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }

        // Map day abbreviations to numbers (Sun=0, Mon=1, etc.)
        const dayAbbrevToNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const daysOfWeek = args.daysOfWeek
          ? (args.daysOfWeek as string[]).map((d: string) => dayAbbrevToNum[d] ?? -1).filter((n: number) => n >= 0)
          : [];

        const pattern = await prisma.recurringWorkPattern.create({
          data: {
            userId,
            recurrenceType: args.recurrenceType,
            intervalDays: args.intervalDays || null,
            daysOfWeek,
            daysOfMonth: args.daysOfMonth || [],
            startDate: args.startDate ? new Date(args.startDate) : null,
            endDate: args.endDate ? new Date(args.endDate) : null,
            workItemTemplate: {
              title: args.title.trim(),
              type: args.type || 'task',
              courseId,
              notes: args.notes || '',
              tags: args.tags || [],
              links: [],
              dueTime: args.dueTime || '23:59',
              priority: args.priority || null,
              effort: args.effort || null,
              pinned: false,
              checklist: [],
            },
            isActive: true,
          },
        });

        // Generate initial instances
        const { generateRecurringWorkInstances } = await import('@/lib/recurringWorkUtils');
        await generateRecurringWorkInstances({
          patternId: pattern.id,
          userId,
        });

        // Fetch generated items to return
        const generatedItems = await prisma.workItem.findMany({
          where: { recurringPatternId: pattern.id },
          include: { course: { select: { id: true, code: true, name: true, colorTag: true } } },
          orderBy: { instanceDate: 'asc' },
        });

        return { success: true, type: 'recurringPatternCreated', item: { pattern, workItems: generatedItems } };
      }

      // ===== Grade/GPA Management =====
      case 'create_gpa_entry': {
        let courseId: string | null = null;
        if (args.courseName) {
          courseId = await resolveCourseId(args.courseName, userId);
        }
        const gpaEntry = await prisma.gpaEntry.create({
          data: {
            userId,
            courseName: args.courseName.trim(),
            grade: args.grade.toUpperCase().trim(),
            credits: args.credits,
            term: args.term || null,
            status: args.status || 'final',
            courseId,
          },
        });
        return { success: true, type: 'gpaEntry', item: gpaEntry };
      }

      case 'update_gpa_entry': {
        const allEntries = await prisma.gpaEntry.findMany({
          where: { userId },
          select: { id: true, courseName: true },
        });
        const match = fuzzyMatchItem(allEntries, args.courseName, (e) => e.courseName);
        if (!match) {
          return { success: false, type: 'gpaEntry', item: null, error: `Could not find a grade entry matching "${args.courseName}"` };
        }
        const updateData: Record<string, any> = {};
        if (args.newCourseName) updateData.courseName = args.newCourseName.trim();
        if (args.grade) updateData.grade = args.grade.toUpperCase().trim();
        if (args.credits !== undefined) updateData.credits = args.credits;
        if (args.term !== undefined) updateData.term = args.term;
        if (args.status) updateData.status = args.status;
        const updated = await prisma.gpaEntry.update({
          where: { id: match.id },
          data: updateData,
        });
        return { success: true, type: 'gpaEntryUpdate', item: updated };
      }

      case 'delete_gpa_entry': {
        const allEntries = await prisma.gpaEntry.findMany({
          where: { userId },
          select: { id: true, courseName: true },
        });
        const match = fuzzyMatchItem(allEntries, args.courseName, (e) => e.courseName);
        if (!match) {
          return { success: false, type: 'gpaEntry', item: null, error: `Could not find a grade entry matching "${args.courseName}"` };
        }
        await prisma.gpaEntry.delete({ where: { id: match.id } });
        return { success: true, type: 'gpaEntryDelete', item: { id: match.id, courseName: match.courseName } };
      }

      // ===== Study Planning =====
      case 'create_study_plan': {
        const start = new Date(args.startDate);
        const end = new Date(args.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return { success: false, type: 'studyPlan', item: null, error: 'Invalid start or end date' };
        }
        if (start >= end) {
          return { success: false, type: 'studyPlan', item: null, error: 'Start date must be before end date' };
        }

        const sessionsPerDay = args.sessionsPerDay || 1;
        const durationMin = args.sessionDurationMinutes || 60;
        const preferredTime = args.preferredTime || '14:00';
        const [prefH, prefM] = preferredTime.split(':').map(Number);
        const topics: string[] = args.topics || [];
        const createAs = args.createAs || 'calendar_event';

        // Generate study days (every day from start to end-1, not the exam day itself)
        const studyDays: Date[] = [];
        const cur = new Date(start);
        const dayBefore = new Date(end);
        dayBefore.setDate(dayBefore.getDate() - 1);
        while (cur <= dayBefore) {
          studyDays.push(new Date(cur));
          cur.setDate(cur.getDate() + 1);
        }

        if (studyDays.length === 0) {
          return { success: false, type: 'studyPlan', item: null, error: 'No study days available between start and end date' };
        }

        const createdItems: any[] = [];
        let sessionIndex = 0;

        for (const day of studyDays) {
          for (let s = 0; s < sessionsPerDay; s++) {
            const sessionStart = new Date(day);
            sessionStart.setHours(prefH + s, prefM, 0, 0);
            const sessionEnd = new Date(sessionStart);
            sessionEnd.setMinutes(sessionEnd.getMinutes() + durationMin);

            const topicLabel = topics.length > 0 ? `: ${topics[sessionIndex % topics.length]}` : '';
            const title = `Study for ${args.examTitle}${topicLabel}`;

            if (createAs === 'calendar_event') {
              const event = await prisma.calendarEvent.create({
                data: {
                  userId,
                  title,
                  startAt: sessionStart,
                  endAt: sessionEnd,
                  allDay: false,
                  description: `Study session ${sessionIndex + 1} for ${args.examTitle}`,
                  location: null,
                },
              });
              createdItems.push({ ...event, _itemType: 'calendarEvent' });
            } else {
              const workItem = await prisma.workItem.create({
                data: {
                  userId,
                  title,
                  type: 'task',
                  dueAt: sessionEnd,
                  priority: null,
                  effort: null,
                  notes: `Study session ${sessionIndex + 1} for ${args.examTitle}`,
                  tags: ['study'],
                  checklist: [],
                  links: [],
                  files: [],
                  status: 'open',
                  pinned: false,
                  workingOn: false,
                  isRecurring: false,
                },
                include: { course: { select: { id: true, code: true, name: true, colorTag: true } } },
              });
              createdItems.push({ ...workItem, _itemType: 'workItem' });
            }
            sessionIndex++;
          }
        }

        return { success: true, type: 'studyPlanCreated', item: { examTitle: args.examTitle, sessions: createdItems, totalSessions: createdItems.length } };
      }

      case 'send_feedback_email': {
        const { Resend } = await import('resend');
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return { success: false, type: 'email', item: null, error: 'Email service is not configured' };
        }
        const resend = new Resend(apiKey);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const adminEmail = process.env.ADMIN_EMAIL || 'collegeorbit@protonmail.com';
        const typeLabel = args.type ? args.type.replace('_', ' ') : 'feedback';
        await resend.emails.send({
          from: `College Orbit <${fromEmail}>`,
          to: adminEmail,
          subject: `[Orbi ${typeLabel}] ${args.subject}`,
          text: `From: ${user?.name || 'Unknown'} (${user?.email || 'no email'})\nType: ${typeLabel}\n\n${args.message}`,
        });
        return { success: true, type: 'emailSent', item: { subject: args.subject } };
      }

      default:
        return { success: false, type: 'unknown', item: null, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      success: false,
      type: name.replace('create_', ''),
      item: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function buildSystemPrompt(userId: string, timezoneOffset: number = 0): Promise<string> {
  const [user, courses, workItems, exams, notes, calendarEvents, shoppingItems, settings, streak, recurringWorkPatterns, excludedDates, gpaEntries, flashcardDecks] =
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
        where: { userId, purchasedAt: null },
        select: { name: true, checked: true, listType: true, category: true, quantity: true, unit: true, notes: true, price: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.settings.findUnique({
        where: { userId },
        select: {
          university: true, theme: true, visualTheme: true, timeFormat: true, dateFormat: true,
          weekStartsOn: true, enableNotifications: true, pomodoroWorkDuration: true,
          pomodoroBreakDuration: true, pomodoroIsMuted: true, petCompanion: true,
          petCompanionAnimal: true, enableKeyboardShortcuts: true, confirmBeforeDelete: true,
          showRelativeDates: true, showNavCounts: true, showPriorityIndicators: true,
          showEffortIndicators: true, showCourseCode: true, groupTasksByCourse: true,
          groupAssignmentsByCourse: true, gradientIntensity: true, glowIntensity: true,
          colorblindMode: true, colorblindStyle: true,
          emailWeeklyDigest: true, emailExamReminders: true, emailDeadlineReminders: true,
          emailTaskReminders: true, emailAnnouncements: true,
          flashcardDailyGoal: true, flashcardShuffleOrder: true,
          flashcardSoundEffects: true, flashcardCelebrations: true,
        },
      }),
      prisma.userStreak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, totalTasksCompleted: true, totalXp: true, level: true },
      }),
      prisma.recurringWorkPattern.findMany({
        where: { userId, isActive: true },
        select: { workItemTemplate: true, recurrenceType: true, daysOfWeek: true, daysOfMonth: true, intervalDays: true, startDate: true, endDate: true },
      }),
      prisma.excludedDate.findMany({
        where: { userId },
        select: { date: true, description: true, courseId: true },
        orderBy: { date: 'asc' },
      }),
      prisma.gpaEntry.findMany({
        where: { userId },
        select: { courseName: true, grade: true, credits: true, term: true, status: true, courseId: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.flashcardDeck.findMany({
        where: { userId },
        select: {
          name: true, description: true, courseId: true,
          cards: {
            select: { interval: true, repetitions: true, nextReview: true },
          },
        },
      }),
    ]);

  const courseMap = new Map(courses.map((c) => [c.id, `${c.code} - ${c.name}`]));

  const utcNow = new Date();
  const now = new Date(utcNow.getTime() - timezoneOffset * 60000);
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

  // ===== Current Settings =====
  if (settings) {
    const settingsLines: string[] = [];
    settingsLines.push(`- Theme: ${settings.theme}${settings.visualTheme && settings.visualTheme !== 'default' ? ` (visual: ${settings.visualTheme})` : ''}`);
    settingsLines.push(`- Time format: ${settings.timeFormat}, Date format: ${settings.dateFormat}, Week starts: ${settings.weekStartsOn}`);
    settingsLines.push(`- Pomodoro: ${settings.pomodoroWorkDuration}min work / ${settings.pomodoroBreakDuration}min break${settings.pomodoroIsMuted ? ', muted' : ''}`);
    if (settings.petCompanion) settingsLines.push(`- Pet companion: ${settings.petCompanionAnimal || 'rottweiler'}`);
    settingsLines.push(`- Notifications: ${settings.enableNotifications ? 'on' : 'off'}, Keyboard shortcuts: ${settings.enableKeyboardShortcuts ? 'on' : 'off'}`);
    const emailPrefs: string[] = [];
    if (settings.emailWeeklyDigest) emailPrefs.push('weekly digest');
    if (settings.emailExamReminders) emailPrefs.push('exam reminders');
    if (settings.emailDeadlineReminders) emailPrefs.push('deadline reminders');
    if (settings.emailTaskReminders) emailPrefs.push('task reminders');
    if (settings.emailAnnouncements) emailPrefs.push('announcements');
    settingsLines.push(`- Email notifications: ${emailPrefs.length > 0 ? emailPrefs.join(', ') : 'all off'}`);
    if (settings.colorblindMode) settingsLines.push(`- Colorblind mode: ${settings.colorblindMode} (${settings.colorblindStyle || 'default'})`);
    settingsLines.push(`- Display: relative dates ${settings.showRelativeDates ? 'on' : 'off'}, priority badges ${settings.showPriorityIndicators ? 'on' : 'off'}, effort badges ${settings.showEffortIndicators ? 'on' : 'off'}, course codes ${settings.showCourseCode ? 'on' : 'off'}`);
    settingsLines.push(`- Gradient: ${settings.gradientIntensity}%, Glow: ${settings.glowIntensity}%`);
    sections.push(`CURRENT SETTINGS:\n${settingsLines.join('\n')}`);
  }

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

  // ===== Excluded Dates & Holidays =====
  if (excludedDates.length > 0) {
    const lines = excludedDates.map((d) => {
      const dateStr = friendlyDate(new Date(d.date));
      const course = d.courseId ? courseMap.get(d.courseId) || '' : '';
      return `- ${dateStr}: ${d.description}${course ? ` (${course})` : ''}`;
    });
    sections.push(`EXCLUDED DATES & HOLIDAYS:\n${lines.join('\n')}`);
  }

  // ===== Gamification =====
  if (streak) {
    sections.push(
      `GAMIFICATION:\n- Level: ${streak.level}\n- XP: ${streak.totalXp}\n- Current streak: ${streak.currentStreak} days\n- Longest streak: ${streak.longestStreak} days\n- Tasks completed: ${streak.totalTasksCompleted}`
    );
  }

  // ===== GPA & Grades =====
  if (gpaEntries.length > 0) {
    const byTerm = new Map<string, typeof gpaEntries>();
    for (const e of gpaEntries) {
      const term = e.term || 'Unspecified';
      if (!byTerm.has(term)) byTerm.set(term, []);
      byTerm.get(term)!.push(e);
    }
    const lines: string[] = [];
    for (const [term, entries] of byTerm) {
      lines.push(`${term}:`);
      for (const e of entries) {
        const course = e.courseId ? courseMap.get(e.courseId) || e.courseName : e.courseName;
        const statusLabel = e.status === 'in_progress' ? ' (in progress)' : '';
        lines.push(`  - ${course}: ${e.grade} (${e.credits} credits${statusLabel})`);
      }
      // Calculate term GPA
      const gradePoints: Record<string, number> = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0 };
      let totalPoints = 0, totalCredits = 0;
      for (const e of entries) {
        const gp = gradePoints[e.grade.toUpperCase()];
        if (gp !== undefined && e.credits > 0) {
          totalPoints += gp * e.credits;
          totalCredits += e.credits;
        }
      }
      if (totalCredits > 0) {
        lines.push(`  Term GPA: ${(totalPoints / totalCredits).toFixed(2)}`);
      }
    }
    // Overall GPA
    const gradePoints: Record<string, number> = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0 };
    let totalPoints = 0, totalCredits = 0;
    for (const e of gpaEntries) {
      const gp = gradePoints[e.grade.toUpperCase()];
      if (gp !== undefined && e.credits > 0) {
        totalPoints += gp * e.credits;
        totalCredits += e.credits;
      }
    }
    if (totalCredits > 0) {
      lines.push(`Overall GPA: ${(totalPoints / totalCredits).toFixed(2)} (${totalCredits} total credits)`);
    }
    sections.push(`GRADES & GPA:\n${lines.join('\n')}`);
  }

  // ===== Flashcard Decks =====
  if (flashcardDecks.length > 0) {
    let grandTotalCards = 0, grandTotalMastered = 0, grandTotalDue = 0;
    const lines = flashcardDecks.map((d) => {
      const course = d.courseId ? courseMap.get(d.courseId) || '' : '';
      const totalCards = d.cards?.length || 0;
      const mastered = d.cards?.filter((c) => c.repetitions >= 5).length || 0;
      const dueNow = d.cards?.filter((c) => new Date(c.nextReview) <= now).length || 0;
      grandTotalCards += totalCards;
      grandTotalMastered += mastered;
      grandTotalDue += dueNow;
      const parts = [`- ${d.name}${course ? ` (${course})` : ''}: ${totalCards} cards, ${mastered} mastered, ${dueNow} due`];
      if (d.description) parts.push(`  Description: ${d.description}`);
      return parts.join('\n');
    });
    lines.push(`TOTALS: ${grandTotalCards} total cards across ${flashcardDecks.length} decks, ${grandTotalMastered} mastered, ${grandTotalDue} due for review`);
    sections.push(`FLASHCARD DECKS:\n${lines.join('\n')}`);
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
- You can CREATE items for the student. When the user asks you to add, create, or make something (a task, assignment, exam, course, calendar event, note, or shopping item), USE the provided tools to create it directly. Do not just tell them how to do it manually.
- You can DELETE items (work items, exams, calendar events, notes, shopping items — but NOT courses). When the user asks to remove or delete something, use the appropriate delete tool. Match by title/name.
- You can add EXCLUDED DATES & HOLIDAYS (days off, spring break, snow days, etc.). When the user mentions a holiday or day off, use create_excluded_date. For multi-day breaks (e.g. spring break), use the dates array with all dates in the range. These can optionally be linked to a specific course.
- You can mark work items as COMPLETE or INCOMPLETE. When the user says they finished something, or asks to mark it done/complete, use update_work_item_status with status "done". When they want to reopen it, use status "open".
- For shopping items, infer the list type from context: food/groceries go to "grocery", things to buy (electronics, clothes, etc.) go to "wishlist", pantry staples go to "pantry". Default to "grocery" if unclear.
- If the request is ambiguous (e.g. no due date for a task, unclear course), make reasonable assumptions rather than asking for clarification. Only ask if truly critical info is missing.
- When the user asks to add a link/URL to a work item, exam, or note, use the "links" field (array of {label, url}), NOT the "notes" field. The links field creates proper clickable links in the UI. The notes field is for text descriptions only.
- IMPORTANT: When adding links, ONLY use URLs that the user explicitly provides in their message. NEVER copy or reuse URLs from other items in the system prompt. If the user says "add a link" without providing a specific URL, ASK them for the URL first. Do not guess or pull URLs from other assignments, courses, or items.
- You can create, delete, or update multiple items in a single response if the user asks (e.g. "add milk and eggs to my grocery list" = 2 shopping items, "mark my math homework and essay as done" = 2 status updates).
- You can CONTROL THE POMODORO TIMER. Use control_pomodoro with action "start" to begin/resume, "pause" to pause, "stop" to stop and reset, or "skip" to skip to the next session (jumps from work to break or break to work). When starting, you can optionally set custom work/break durations.
- You can CHANGE SETTINGS. When the user asks to switch to dark/light mode, change their theme, adjust pomodoro times, toggle notifications, enable a pet companion, change visual theme, etc., use update_settings. Available visual themes: default, cartoon, cyberpunk, retro, nature, ocean, lavender, space, pixel, aquarium, cozy, winter, sakura, halloween, autumn, spring, noir, lofi, jungle, glass, steampunk, terminal, paper, skeuomorphic, or random (picks a new one each day). Available pet animals: rottweiler, dalmatian, husky, canecorso, dogoargentino, golden, labrador, pharaoh, fox, turtle, parrotblue, parrotgreen.
- You can SEND FEEDBACK EMAILS to the College Orbit team. When the user wants to report a bug, request a feature, give feedback, or ask a question, use send_feedback_email to email collegeorbit@protonmail.com on their behalf. Compose a clear, professional message from the user's request.
- You can EDIT/UPDATE existing items. When the user asks to change, rename, reschedule, or modify an existing work item, exam, calendar event, note, or shopping item, use the update_* tools (NOT the create_* tools). Match by current title, then specify only the fields to change.
- IMPORTANT: When the user asks to edit or update an existing item, ALWAYS use the update_* tool, NEVER the create_* tool. Using create_* when the item already exists will make a duplicate. If you are unsure whether to create or update, check the item lists in the system prompt to see if the item already exists.
- You can perform BULK OPERATIONS on work items. When the user asks to "mark all readings as done", "delete all tasks for CS101", or similar batch operations, use bulk_update_work_items with the appropriate filters and action.
- You can create RECURRING WORK PATTERNS (premium). When the user asks for something that repeats (e.g. "read chapter every Monday", "quiz prep every day this week"), use create_recurring_work_pattern. This creates a pattern and auto-generates individual work item instances.
- You can create STUDY PLANS. When the user asks to plan study sessions for an exam, use create_study_plan to generate multiple study blocks between a start date and the exam date. You can distribute topics across sessions if provided.
- For GRADES and GPA questions, refer to the GRADES & GPA section. You know the student's grades, term GPAs, and overall GPA.
- You can manage GRADES. Use create_gpa_entry to add grades, update_gpa_entry to change them, and delete_gpa_entry to remove them. When the user says "I got a B+ in Biology" or "update my CS grade to an A", use these tools.
- For FLASHCARD questions, refer to the FLASHCARD DECKS section. You know deck names, card counts, mastery levels, and cards due for review. You cannot create or edit flashcards directly — suggest the student use the Flashcards tool for that.
- SUGGESTED ACTIONS (REQUIRED): You MUST end EVERY response with suggested follow-up actions on the very last line, formatted EXACTLY like this: [ACTIONS: action one | action two | action three]. Include 1-3 short (2-6 words each) natural language prompts. These MUST be directly relevant to the current conversation topic and what the user just asked about — suggest logical next steps based on the specific subject being discussed. For example, if the user asked about an exam, suggest things like "Create a study plan for it" or "What topics should I review?". If they asked about a deadline, suggest "Mark it as done" or "How much time do I have left?". NEVER suggest generic unrelated actions. This line is parsed and removed from the visible response. NEVER omit this line.

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
    const timezoneOffset = typeof body.timezoneOffset === 'number' ? body.timezoneOffset : 0;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = await buildSystemPrompt(userId, timezoneOffset);

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
      tools: ORBI_TOOLS,
      temperature: 0.3,
      max_tokens: 1000,
    });

    const choice = completion.choices[0];
    let response: string | null = choice?.message?.content;
    const createdItems: ToolResult[] = [];

    // Handle tool calls if the model wants to create items
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCalls = choice.message.tool_calls;

      // Execute each tool call
      const toolResults: Array<{ tool_call_id: string; result: ToolResult }> = [];
      for (const tc of toolCalls) {
        if (tc.type !== 'function') continue;
        const args = JSON.parse(tc.function.arguments);
        const result = await executeToolCall(tc.function.name, args, userId);
        toolResults.push({ tool_call_id: tc.id, result });
        if (result.success) {
          createdItems.push(result);
        }
      }

      // Build follow-up messages so the model can generate a confirmation
      const followUpMessages: OpenAI.ChatCompletionMessageParam[] = [
        ...messages,
        choice.message as OpenAI.ChatCompletionMessageParam,
        ...toolResults.map((tr) => ({
          role: 'tool' as const,
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(
            tr.result.success
              ? { success: true, type: tr.result.type, title: tr.result.item?.title || tr.result.item?.name }
              : { success: false, error: tr.result.error }
          ),
        })),
      ];

      const followUp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: followUpMessages,
        temperature: 0.3,
        max_tokens: 500,
      });

      response = followUp.choices[0]?.message?.content || response;
    }

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

    // Parse suggested actions from response (may appear at end, possibly with trailing whitespace/newlines)
    let suggestedActions: string[] | undefined;
    const actionsMatch = response.match(/\[ACTIONS:\s*(.+?)]\s*$/s);
    if (actionsMatch) {
      suggestedActions = actionsMatch[1].split('|').map((a) => a.trim()).filter(Boolean);
      response = response.replace(/\[ACTIONS:\s*.+?]\s*$/s, '').trimEnd();
    }

    return NextResponse.json({
      response,
      createdItems: createdItems.length > 0 ? createdItems : undefined,
      suggestedActions: suggestedActions && suggestedActions.length > 0 ? suggestedActions : undefined,
    });
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
