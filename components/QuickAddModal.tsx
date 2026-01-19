'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import CalendarPicker from './CalendarPicker';
import TimePicker from './TimePicker';
import { ShoppingListType, GROCERY_CATEGORIES, WISHLIST_CATEGORIES, PANTRY_CATEGORIES, Course } from '@/types';
import styles from './QuickAddModal.module.css';

type QuickAddType = 'task' | 'assignment' | 'exam' | 'note' | 'course' | 'shopping';

// ============================================================================
// NATURAL LANGUAGE PARSER - Extremely comprehensive parsing logic
// ============================================================================

interface ParsedInput {
  type: QuickAddType;
  title: string;
  courseId: string | null;
  date: string | null; // ISO date YYYY-MM-DD
  time: string | null; // HH:mm 24-hour format
  location: string | null;
  quantity: number;
  shoppingListType: ShoppingListType;
  courseCode: string | null;
  courseName: string | null;
}

// Type detection keywords with weights
const TYPE_KEYWORDS: Record<QuickAddType, { keywords: string[]; weight: number }[]> = {
  exam: [
    { keywords: ['midterm', 'final exam', 'final', 'exam'], weight: 10 },
    { keywords: ['quiz', 'test', 'assessment', 'evaluation'], weight: 8 },
  ],
  assignment: [
    { keywords: ['homework', 'hw', 'assignment', 'pset', 'problem set'], weight: 10 },
    { keywords: ['essay', 'paper', 'report', 'presentation', 'project'], weight: 9 },
    { keywords: ['lab', 'lab report', 'worksheet', 'exercise'], weight: 8 },
    { keywords: ['due', 'submit', 'turn in', 'hand in'], weight: 5 },
    { keywords: ['draft', 'outline', 'thesis'], weight: 6 },
  ],
  note: [
    { keywords: ['note', 'notes', 'lecture notes', 'class notes'], weight: 10 },
    { keywords: ['summary', 'review', 'study guide'], weight: 7 },
  ],
  shopping: [
    { keywords: ['buy', 'purchase', 'shop', 'shopping', 'grocery', 'groceries'], weight: 10 },
    { keywords: ['get', 'grab', 'pick up', 'need to get'], weight: 7 },
    { keywords: ['wishlist', 'want', 'pantry'], weight: 6 },
  ],
  course: [
    { keywords: ['add course', 'new course', 'register', 'enroll'], weight: 10 },
  ],
  task: [
    { keywords: ['todo', 'to-do', 'to do', 'task', 'reminder'], weight: 8 },
    { keywords: ['finish', 'complete', 'do', 'work on', 'start'], weight: 3 },
    { keywords: ['read', 'study', 'review', 'prepare', 'practice'], weight: 4 },
    { keywords: ['email', 'call', 'meet', 'meeting', 'schedule'], weight: 5 },
  ],
};


// Date-related patterns and keywords
const DAY_NAMES: Record<string, number> = {
  'sunday': 0, 'sun': 0,
  'monday': 1, 'mon': 1,
  'tuesday': 2, 'tue': 2, 'tues': 2,
  'wednesday': 3, 'wed': 3,
  'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
  'friday': 5, 'fri': 5,
  'saturday': 6, 'sat': 6,
};

const MONTH_NAMES: Record<string, number> = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11,
};

// Time parsing helpers
const TIME_KEYWORDS: Record<string, string> = {
  'midnight': '00:00',
  'noon': '12:00',
  'morning': '09:00',
  'afternoon': '14:00',
  'evening': '18:00',
  'night': '20:00',
  'eod': '17:00', // end of day
  'cob': '17:00', // close of business
};

// Helper to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNaturalLanguage(input: string, courses: Course[]): ParsedInput {
  const result: ParsedInput = {
    type: 'task',
    title: '',
    courseId: null,
    date: null,
    time: null,
    location: null,
    quantity: 1,
    shoppingListType: 'grocery',
    courseCode: null,
    courseName: null,
  };

  if (!input.trim()) return result;

  // Store original input for title extraction later
  const originalInput = input.trim();
  let workingText = originalInput;
  const lowerInput = workingText.toLowerCase();

  // Track what parts we've extracted so we can remove them from title
  const extractedParts: string[] = [];

  // ========== 1. DETECT TYPE ==========
  let maxWeight = 0;
  let detectedType: QuickAddType = 'task';

  for (const [type, keywordGroups] of Object.entries(TYPE_KEYWORDS) as [QuickAddType, { keywords: string[]; weight: number }[]][]) {
    for (const group of keywordGroups) {
      for (const keyword of group.keywords) {
        if (lowerInput.includes(keyword)) {
          if (group.weight > maxWeight) {
            maxWeight = group.weight;
            detectedType = type;
          }
        }
      }
    }
  }
  result.type = detectedType;

  // ========== 2. DETECT SHOPPING LIST TYPE (not currently used) ==========
  // Shopping type is disabled - keeping default grocery

  // ========== 3. EXTRACT QUANTITY (for shopping - only at start of input) ==========
  // Patterns: "2 apples", "3x milk", "x3 eggs", "dozen eggs", "a few items"
  // Only match quantities at the very start to avoid consuming date numbers
  const quantityPatterns = [
    /^(\d+)\s*x\s+/i,           // "3x milk"
    /^x\s*(\d+)\s+/i,           // "x3 milk"
    /^(\d+)\s+(?!pm|am|:|\/|\d)/i, // "2 apples" but not "2pm", "2/15", or "2 3" (date-like)
    /^a\s+dozen\b/i,            // "a dozen" = 12
    /^(\d+)\s*dozen\b/i,        // "2 dozen" = 24
    /^a\s+couple\s+(of\s+)?/i,  // "a couple" or "a couple of" = 2
    /^a\s+few\s+/i,             // "a few" = 3
  ];

  for (const pattern of quantityPatterns) {
    const match = lowerInput.match(pattern);
    if (match) {
      if (pattern.source.includes('dozen')) {
        const multiplier = match[1] ? parseInt(match[1]) : 1;
        result.quantity = multiplier * 12;
      } else if (pattern.source.includes('couple')) {
        result.quantity = 2;
      } else if (pattern.source.includes('few')) {
        result.quantity = 3;
      } else if (match[1]) {
        result.quantity = parseInt(match[1]);
      }
      extractedParts.push(match[0].trim());
      workingText = workingText.substring(match[0].length).trim();
      break;
    }
  }

  // ========== 4. EXTRACT COURSE ==========
  // Match course codes: "CS 101", "CS101", "MATH-241", "ENG 201"
  // Case-insensitive matching for more flexibility
  const courseCodePattern = /\b([A-Za-z]{2,5})\s*[-]?\s*(\d{3,4}[A-Za-z]?)\b/gi;
  let courseMatch;
  let workingTextLower = workingText.toLowerCase();

  while ((courseMatch = courseCodePattern.exec(workingText)) !== null) {
    const matchedCode = `${courseMatch[1]} ${courseMatch[2]}`.toUpperCase();
    const normalizedMatchedCode = matchedCode.replace(/\s+/g, '').toLowerCase();

    // Try to find matching course
    const foundCourse = courses.find(c => {
      const normalizedCourseCode = c.code.replace(/\s+/g, '').toLowerCase();
      return normalizedCourseCode === normalizedMatchedCode ||
             c.code.toLowerCase() === matchedCode.toLowerCase() ||
             c.code.toLowerCase().includes(normalizedMatchedCode) ||
             normalizedMatchedCode.includes(normalizedCourseCode);
    });

    if (foundCourse) {
      result.courseId = foundCourse.id;
      extractedParts.push(courseMatch[0]);
      // Use case-insensitive replacement
      workingText = workingText.replace(new RegExp(escapeRegex(courseMatch[0]), 'gi'), ' ');
      break;
    }
  }

  // Also try matching course codes/names directly from course list
  if (!result.courseId) {
    for (const course of courses) {
      const courseNameLower = course.name.toLowerCase();
      const courseCodeParts = course.code.split(/\s+/);
      const codePrefix = courseCodeParts[0]?.toLowerCase(); // e.g., "WRTG" from "WRTG 150"

      // Check for full course code (with flexible spacing)
      const codePattern = new RegExp(`\\b${escapeRegex(course.code).replace(/\s+/g, '\\s*')}\\b`, 'gi');
      const codeMatch = workingText.match(codePattern);
      if (codeMatch) {
        result.courseId = course.id;
        extractedParts.push(codeMatch[0]);
        workingText = workingText.replace(codePattern, ' ');
        break;
      }

      // Check for just the code prefix (e.g., "WRTG" without number)
      if (codePrefix && codePrefix.length >= 3) {
        const prefixPattern = new RegExp(`\\b${escapeRegex(codePrefix)}\\b`, 'gi');
        const prefixMatch = workingText.match(prefixPattern);
        if (prefixMatch) {
          result.courseId = course.id;
          extractedParts.push(prefixMatch[0]);
          workingText = workingText.replace(prefixPattern, ' ');
          break;
        }
      }

      // Check for course name (exact match)
      if (workingTextLower.includes(courseNameLower) && courseNameLower.length > 3) {
        result.courseId = course.id;
        extractedParts.push(course.name);
        workingText = workingText.replace(new RegExp(escapeRegex(course.name), 'gi'), ' ');
        break;
      }

      // Check for partial course name matches (e.g., "writing" for "Writing & Rhetoric")
      // Split course name into words and check if any significant word matches
      const nameWords = courseNameLower.split(/[\s&,]+/).filter(w => w.length >= 4);
      for (const word of nameWords) {
        const wordPattern = new RegExp(`\\b${escapeRegex(word)}(?:\\s+class)?\\b`, 'gi');
        const wordMatch = workingText.match(wordPattern);
        if (wordMatch) {
          result.courseId = course.id;
          extractedParts.push(wordMatch[0]);
          workingText = workingText.replace(wordPattern, ' ');
          break;
        }
      }
      if (result.courseId) break;
    }
  }

  // Check for "for [course]" pattern
  const forCoursePattern = /\bfor\s+([A-Za-z]{2,5}\s*\d{3,4}[A-Za-z]?)\b/gi;
  const forCourseMatch = forCoursePattern.exec(workingText);
  if (forCourseMatch && !result.courseId) {
    const matchedCode = forCourseMatch[1].replace(/\s+/g, '').toLowerCase();
    const foundCourse = courses.find(c =>
      c.code.replace(/\s+/g, '').toLowerCase() === matchedCode
    );
    if (foundCourse) {
      result.courseId = foundCourse.id;
      extractedParts.push(forCourseMatch[0]);
      workingText = workingText.replace(forCourseMatch[0], ' ');
    }
  }

  // ========== 5. EXTRACT LOCATION (for exams) ==========
  // Patterns: "Room 102", "in Room 102", "at Building A", "Hall 3", "location: xxx"
  const locationPatterns = [
    /\b(?:in|at|@)\s+(room\s+\w+)/i,
    /\b(?:in|at|@)\s+(building\s+\w+)/i,
    /\b(?:in|at|@)\s+(hall\s+\w+)/i,
    /\b(?:in|at|@)\s+(\w+\s+hall)/i,
    /\b(?:in|at|@)\s+(\w+\s+building)/i,
    /\b(room\s+\d+\w*)/i,
    /\b(building\s+\w+)/i,
    /\b(hall\s+\w+)/i,
    /\blocation[:\s]+([^\d]+?)(?=\s+\d|\s*$)/i,
    /\b([A-Z]{2,4}\s+\d{3,4}[A-Z]?)\s*(?:room|rm)/i, // "BNSN 201 room"
  ];

  for (const pattern of locationPatterns) {
    const match = workingText.match(pattern);
    if (match) {
      result.location = match[1].trim();
      extractedParts.push(match[0]);
      workingText = workingText.replace(match[0], ' ');
      break;
    }
  }

  // ========== 6. EXTRACT DATE ==========
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper function to format date as ISO string
  const formatDate = (d: Date): string => {
    return d.toISOString().split('T')[0];
  };

  // Helper to get next occurrence of a weekday
  const getNextWeekday = (targetDay: number, includeToday = true): Date => {
    const result = new Date(today);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0 || (daysToAdd === 0 && !includeToday)) {
      daysToAdd += 7;
    }
    result.setDate(result.getDate() + daysToAdd);
    return result;
  };

  // Relative dates
  const relativeDatePatterns: [RegExp, (match?: RegExpMatchArray) => Date][] = [
    [/\btoday\b/i, () => today],
    [/\btonight\b/i, () => today],
    [/\b(tomorrow|tmrw|tmr|tom)\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; }],
    [/\bday after tomorrow\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 2); return d; }],
    [/\bnext week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }],
    [/\bthis week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + (5 - d.getDay())); return d; }], // Friday
    [/\bend of (?:the )?week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + (5 - d.getDay())); return d; }],
    [/\bend of (?:the )?month\b/i, () => new Date(today.getFullYear(), today.getMonth() + 1, 0)],
    [/\bin\s+(\d+)\s+days?\b/i, (match) => { const d = new Date(today); d.setDate(d.getDate() + parseInt(match![1])); return d; }],
    [/\bin\s+(\d+)\s+weeks?\b/i, (match) => { const d = new Date(today); d.setDate(d.getDate() + parseInt(match![1]) * 7); return d; }],
    [/\bin\s+a\s+week\b/i, () => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }],
  ];

  // Check relative dates first
  for (const [pattern, getDate] of relativeDatePatterns) {
    const match = workingText.match(pattern);
    if (match) {
      result.date = formatDate(getDate(match as RegExpMatchArray));
      extractedParts.push(match[0]);
      workingText = workingText.replace(match[0], ' ');
      break;
    }
  }

  // Check for day names: "monday", "next tuesday", "this friday"
  if (!result.date) {
    for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
      const nextPattern = new RegExp(`\\bnext\\s+${dayName}\\b`, 'i');
      const thisPattern = new RegExp(`\\bthis\\s+${dayName}\\b`, 'i');
      const plainPattern = new RegExp(`\\b${dayName}\\b`, 'i');

      let match;
      if ((match = workingText.match(nextPattern))) {
        const d = getNextWeekday(dayNum, false);
        if (d.getTime() <= today.getTime() + 7 * 24 * 60 * 60 * 1000) {
          d.setDate(d.getDate() + 7); // Ensure it's actually next week
        }
        result.date = formatDate(d);
        extractedParts.push(match[0]);
        workingText = workingText.replace(nextPattern, ' ');
        break;
      } else if ((match = workingText.match(thisPattern))) {
        result.date = formatDate(getNextWeekday(dayNum, true));
        extractedParts.push(match[0]);
        workingText = workingText.replace(thisPattern, ' ');
        break;
      } else if ((match = workingText.match(plainPattern))) {
        result.date = formatDate(getNextWeekday(dayNum, true));
        extractedParts.push(match[0]);
        workingText = workingText.replace(plainPattern, ' ');
        break;
      }
    }
  }

  // Check for month day patterns: "Jan 26", "January 26", "Jan 26th", "26 Jan", "26th of January"
  if (!result.date) {
    for (const [monthName, monthNum] of Object.entries(MONTH_NAMES)) {
      // "Jan 26", "January 26th", "Jan 26, 2025"
      const pattern1 = new RegExp(`\\b${monthName}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+(\\d{4}))?\\b`, 'i');
      // "26 Jan", "26th of January"
      const pattern2 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthName}\\.?(?:[,\\s]+(\\d{4}))?\\b`, 'i');

      let match = workingText.match(pattern1);
      if (match) {
        const day = parseInt(match[1]);
        const year = match[2] ? parseInt(match[2]) : today.getFullYear();
        let targetDate = new Date(year, monthNum, day);
        // If date is in the past, assume next year
        if (targetDate < today && !match[2]) {
          targetDate = new Date(year + 1, monthNum, day);
        }
        result.date = formatDate(targetDate);
        extractedParts.push(match[0]);
        workingText = workingText.replace(match[0], ' ');
        break;
      }

      match = workingText.match(pattern2);
      if (match) {
        const day = parseInt(match[1]);
        const year = match[2] ? parseInt(match[2]) : today.getFullYear();
        let targetDate = new Date(year, monthNum, day);
        if (targetDate < today && !match[2]) {
          targetDate = new Date(year + 1, monthNum, day);
        }
        result.date = formatDate(targetDate);
        extractedParts.push(match[0]);
        workingText = workingText.replace(match[0], ' ');
        break;
      }
    }
  }

  // Check for numeric date patterns: "1/26", "01/26", "1-26", "01-26-25", "2025-01-26"
  if (!result.date) {
    const datePatterns = [
      // ISO format: 2025-01-26
      { pattern: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, groups: [1, 2, 3] as const }, // year, month, day
      // US format: 01/26/2025, 1/26/25, 01-26-2025
      { pattern: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/, groups: [3, 1, 2] as const }, // year, month, day
      // Short US format: 1/26, 01-26
      { pattern: /\b(\d{1,2})[\/\-](\d{1,2})\b(?![\/\-])/, groups: [null, 1, 2] as const }, // month, day only
    ];

    for (const { pattern, groups } of datePatterns) {
      const match = workingText.match(pattern);
      if (match) {
        let year: number, month: number, day: number;

        if (groups[0] === null) {
          // No year in pattern
          month = parseInt(match[groups[1]]) - 1;
          day = parseInt(match[groups[2]]);
          year = today.getFullYear();
          // If date is in the past, assume next year
          const testDate = new Date(year, month, day);
          if (testDate < today) {
            year++;
          }
        } else {
          year = parseInt(match[groups[0]]);
          month = parseInt(match[groups[1]]) - 1;
          day = parseInt(match[groups[2]]);
          // Handle 2-digit years
          if (year < 100) {
            year += 2000;
          }
        }

        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          result.date = formatDate(new Date(year, month, day));
          extractedParts.push(match[0]);
          workingText = workingText.replace(match[0], ' ');
          break;
        }
      }
    }
  }

  // ========== 7. EXTRACT TIME ==========
  // Check keyword times first
  for (const [keyword, time] of Object.entries(TIME_KEYWORDS)) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    const match = workingText.match(pattern);
    if (match) {
      result.time = time;
      extractedParts.push(match[0]);
      workingText = workingText.replace(pattern, ' ');
      break;
    }
  }

  // Check for time patterns: "1pm", "1:30pm", "13:00", "1:30 PM", "at 2pm", "@ 3:30"
  if (!result.time) {
    // Each pattern is handled with its specific capture group structure
    const timePatternHandlers: { pattern: RegExp; extract: (m: RegExpMatchArray) => { hours: number; minutes: number; meridiem?: string } | null }[] = [
      // "1:30pm", "1:30 pm", "1:30PM" - groups: [full, hours, minutes, am/pm]
      {
        pattern: /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
        extract: (m) => ({ hours: parseInt(m[1]), minutes: parseInt(m[2]), meridiem: m[3]?.toLowerCase() })
      },
      // "1pm", "1 pm", "1PM" - groups: [full, hours, am/pm] (NO minutes group)
      {
        pattern: /\b(\d{1,2})\s*(am|pm)\b/i,
        extract: (m) => ({ hours: parseInt(m[1]), minutes: 0, meridiem: m[2]?.toLowerCase() })
      },
      // "at 2pm", "@ 3:30pm", "at 2" - groups: [full, hours, minutes?, am/pm?]
      {
        pattern: /(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
        extract: (m) => ({ hours: parseInt(m[1]), minutes: m[2] ? parseInt(m[2]) : 0, meridiem: m[3]?.toLowerCase() })
      },
      // "13:00", "9:30" (24-hour or ambiguous) - groups: [full, hours, minutes]
      {
        pattern: /\b(\d{1,2}):(\d{2})\b(?!\s*(am|pm))/i,
        extract: (m) => ({ hours: parseInt(m[1]), minutes: parseInt(m[2]) })
      },
    ];

    for (const { pattern, extract } of timePatternHandlers) {
      const match = workingText.match(pattern);
      if (match) {
        const extracted = extract(match);
        if (!extracted) continue;

        let { hours, minutes, meridiem } = extracted;

        if (meridiem === 'pm' && hours !== 12) {
          hours += 12;
        } else if (meridiem === 'am' && hours === 12) {
          hours = 0;
        } else if (!meridiem && hours <= 12 && hours >= 1) {
          // Ambiguous time - assume PM for typical class/work times
          if (hours < 8) {
            hours += 12;
          }
        }

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          result.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          extractedParts.push(match[0]);
          workingText = workingText.replace(match[0], ' ');
          break;
        }
      }
    }

  }

  // Set default time for "tonight"
  if (/\btonight\b/i.test(originalInput) && !result.time) {
    result.time = '20:00';
  }

  // ========== 8. EXTRACT COURSE CODE AND NAME (for new course creation) ==========
  // Pattern 1: "CS 101 Intro to Computer Science" -> code: "CS 101", name: "Intro to Computer Science"
  // Pattern 2: "WRTG Writing and Rhetoric" -> code: "WRTG", name: "Writing and Rhetoric"
  const courseWithNumberMatch = originalInput.match(/^([A-Za-z]{2,5})\s*(\d{3,4}[A-Za-z]?)\s+(.+)$/i);
  const courseWithoutNumberMatch = originalInput.match(/^([A-Za-z]{2,5})\s+(.+)$/i);

  if (courseWithNumberMatch) {
    result.courseCode = `${courseWithNumberMatch[1].toUpperCase()} ${courseWithNumberMatch[2]}`;
    // Title case the course name (capitalize first letter of each word)
    result.courseName = courseWithNumberMatch[3].trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } else if (courseWithoutNumberMatch) {
    result.courseCode = courseWithoutNumberMatch[1].toUpperCase();
    // Title case the course name (capitalize first letter of each word)
    result.courseName = courseWithoutNumberMatch[2].trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // ========== 9. EXTRACT TITLE (what remains) ==========
  // The title is what's left after removing dates, times, courses, locations, etc.
  // We keep the original text to preserve the user's intent

  // Clean up the working text - collapse multiple spaces
  let titleText = workingText
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter if present
  if (titleText.length > 0) {
    titleText = titleText.charAt(0).toUpperCase() + titleText.slice(1);
  }

  result.title = titleText;

  return result;
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: QuickAddType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'note', label: 'Note' },
  { value: 'course', label: 'Course' },
];

const SHOPPING_LIST_OPTIONS: { value: ShoppingListType; label: string }[] = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'pantry', label: 'Pantry' },
];

const QUICK_INPUT_PLACEHOLDERS: Record<QuickAddType, string> = {
  task: 'e.g. Finish chapter 3 CS 101 tomorrow',
  assignment: 'e.g. Essay draft ENG 201 Jan 26 5pm',
  exam: 'e.g. Calc midterm Feb 2 1pm Room 102',
  note: 'e.g. Lecture notes CS 101',
  course: 'e.g. CS 101 Intro to Computer Science',
  shopping: 'e.g. 2 gallons milk',
};

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const isMobile = useIsMobile();
  const [selectedType, setSelectedType] = useState<QuickAddType>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [location, setLocation] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [shoppingListType, setShoppingListType] = useState<ShoppingListType>('grocery');
  const [quantity, setQuantity] = useState(1);

  // Store actions
  const addTask = useAppStore((state) => state.addTask);
  const addDeadline = useAppStore((state) => state.addDeadline);
  const addExam = useAppStore((state) => state.addExam);
  const addNote = useAppStore((state) => state.addNote);
  const addCourse = useAppStore((state) => state.addCourse);
  const addShoppingItem = useAppStore((state) => state.addShoppingItem);
  const courses = useAppStore((state) => state.courses);
  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);

  // Only use custom theme if premium
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  // Determine accent color based on custom theme or college palette
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : getCollegeColorPalette(university, theme).accent;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setQuickInput('');
    setTitle('');
    setCourseId(null);
    setDueDate('');
    setDueTime('');
    setLocation('');
    setCourseCode('');
    setCourseName('');
    setShoppingListType('grocery');
    setQuantity(1);
  };

  // Handle quick input parsing
  const handleQuickInputChange = useCallback((value: string) => {
    setQuickInput(value);

    if (!value.trim()) {
      // Clear all parsed fields when input is empty
      setTitle('');
      setCourseId(null);
      setDueDate('');
      setDueTime('');
      setLocation('');
      setCourseCode('');
      setCourseName('');
      return;
    }

    const parsed = parseNaturalLanguage(value, courses);

    // Apply parsed values based on selected type
    if (selectedType === 'course') {
      // For course type, use courseCode and courseName
      setCourseCode(parsed.courseCode || '');
      setCourseName(parsed.courseName || '');
    } else {
      // For other types, use title, course, date, time, location
      setTitle(parsed.title || '');
      setCourseId(parsed.courseId);
      setDueDate(parsed.date || '');
      setDueTime(parsed.time || '');
      setLocation(parsed.location || '');
    }
  }, [courses, selectedType]);

  // Re-parse quick input when type changes (but don't clear it) and refocus input
  useEffect(() => {
    if (quickInput.trim()) {
      // Re-run the parsing with the new selected type
      const parsed = parseNaturalLanguage(quickInput, courses);
      if (selectedType === 'course') {
        setCourseCode(parsed.courseCode || '');
        setCourseName(parsed.courseName || '');
      } else {
        setTitle(parsed.title || '');
        setCourseId(parsed.courseId);
        setDueDate(parsed.date || '');
        setDueTime(parsed.time || '');
        setLocation(parsed.location || '');
      }
    }
    // Refocus the quick input after type change
    quickInputRef.current?.focus();
  }, [selectedType]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getCategoryForListType = (listType: ShoppingListType): string => {
    switch (listType) {
      case 'grocery':
        return GROCERY_CATEGORIES[0];
      case 'wishlist':
        return WISHLIST_CATEGORIES[0];
      case 'pantry':
        return PANTRY_CATEGORIES[0];
      default:
        return 'Other';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      switch (selectedType) {
        case 'task': {
          if (!title.trim()) return;
          let dueAt: string | null = null;
          if (dueDate) {
            if (dueTime) {
              dueAt = `${dueDate}T${dueTime}:00`;
            } else {
              dueAt = `${dueDate}T23:59:59`;
            }
          }
          await addTask({
            title: title.trim(),
            courseId: courseId || null,
            dueAt,
            pinned: false,
            importance: null,
            checklist: [],
            notes: '',
            tags: [],
            links: [],
            status: 'open',
            workingOn: false,
            updatedAt: new Date().toISOString(),
            recurringPatternId: null,
            instanceDate: null,
            isRecurring: false,
          });
          break;
        }
        case 'assignment': {
          if (!title.trim()) return;
          let dueAt: string | null = null;
          if (dueDate) {
            if (dueTime) {
              dueAt = `${dueDate}T${dueTime}:00`;
            } else {
              dueAt = `${dueDate}T23:59:59`;
            }
          }
          await addDeadline({
            title: title.trim(),
            courseId: courseId || null,
            dueAt,
            priority: null,
            effort: null,
            notes: '',
            tags: [],
            links: [],
            status: 'open',
            workingOn: false,
            updatedAt: new Date().toISOString(),
            recurringPatternId: null,
            instanceDate: null,
            isRecurring: false,
          });
          break;
        }
        case 'exam': {
          if (!title.trim() || !dueDate) return;
          let examAt: string;
          if (dueTime) {
            examAt = `${dueDate}T${dueTime}:00`;
          } else {
            examAt = `${dueDate}T12:00:00`;
          }
          await addExam({
            title: title.trim(),
            courseId: courseId || null,
            examAt,
            location: location.trim() || null,
            notes: '',
            tags: [],
            links: [],
            status: 'scheduled',
          });
          break;
        }
        case 'note': {
          if (!title.trim()) return;
          await addNote({
            title: title.trim(),
            content: null,
            folderId: null,
            courseId: courseId || null,
            tags: [],
            isPinned: false,
            links: [],
          });
          break;
        }
        case 'course': {
          if (!courseCode.trim() || !courseName.trim()) return;
          await addCourse({
            code: courseCode.trim(),
            name: courseName.trim(),
            term: '',
            meetingTimes: [],
            links: [],
          });
          break;
        }
        case 'shopping': {
          if (!title.trim()) return;
          await addShoppingItem({
            listType: shoppingListType,
            name: title.trim(),
            quantity: quantity || 1,
            unit: null,
            category: getCategoryForListType(shoppingListType),
            notes: '',
            checked: false,
            priority: null,
            price: null,
            perishable: null,
          });
          break;
        }
      }
      handleClose();
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    switch (selectedType) {
      case 'task':
      case 'assignment':
      case 'note':
      case 'shopping':
        return title.trim().length > 0;
      case 'exam':
        return title.trim().length > 0 && dueDate.length > 0;
      case 'course':
        return courseCode.trim().length > 0 && courseName.trim().length > 0;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  const renderForm = () => {
    switch (selectedType) {
      case 'task':
      case 'assignment':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedType === 'task' ? 'What needs to be done?' : 'Assignment name'}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <CalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  label="Due Date"
                />
              </div>
              <div className={styles.formGroup}>
                <TimePicker
                  value={dueTime}
                  onChange={setDueTime}
                  label="Due Time"
                />
              </div>
            </div>
          </>
        );

      case 'exam':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Exam name"
                className={styles.input}
              />
            </div>
            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <CalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  label="Date *"
                />
              </div>
              <div className={styles.formGroup}>
                <TimePicker
                  value={dueTime}
                  onChange={setDueTime}
                  label="Time"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room or building"
                className={styles.input}
              />
            </div>
          </>
        );

      case 'note':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case 'course':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course Code *</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS 101"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course Name *</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Introduction to Computer Science"
                className={styles.input}
              />
            </div>
          </>
        );

      case 'shopping':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Item Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need?"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>List</label>
              <select
                value={shoppingListType}
                onChange={(e) => setShoppingListType(e.target.value as ShoppingListType)}
                className={styles.select}
              >
                {SHOPPING_LIST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className={styles.input}
                style={{ width: '100px' }}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Mobile: Full-screen slide-up modal
  if (isMobile) {
    return (
      <>
        <div className={styles.backdrop} onClick={handleClose} />
        <div className={styles.mobileModal}>
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>Quick Add</h2>
            <button
              onClick={handleClose}
              className={styles.closeButton}
              aria-label="Close"
              type="button"
            >
              <X size={24} />
            </button>
          </div>

          <div className={styles.mobileContent}>
            {/* Type Selector Pills */}
            <div className={styles.typeSelector}>
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`${styles.typePill} ${selectedType === option.value ? styles.typePillActive : ''}`}
                  style={selectedType === option.value ? {
                    backgroundColor: accentColor,
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                    boxShadow: `0 0 12px ${accentColor}40`,
                    borderColor: accentColor
                  } : {}}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Quick Input Box */}
            <div className={styles.quickInputContainer}>
              <div className={styles.quickInputWrapper}>
                <Sparkles size={16} className={styles.quickInputIcon} />
                <input
                  ref={quickInputRef}
                  type="text"
                  value={quickInput}
                  onChange={(e) => handleQuickInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit()) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder={QUICK_INPUT_PLACEHOLDERS[selectedType]}
                  className={styles.quickInput}
                  autoFocus
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {renderForm()}

              <button
                type="submit"
                disabled={!canSubmit() || isSubmitting}
                className={styles.submitButton}
                style={canSubmit() ? {
                  backgroundColor: accentColor,
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                  boxShadow: `0 0 12px ${accentColor}40`
                } : undefined}
              >
                {isSubmitting ? 'Creating...' : `Create ${TYPE_OPTIONS.find(o => o.value === selectedType)?.label}`}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Desktop: Centered floating modal
  return (
    <>
      <div className={styles.backdrop} onClick={handleClose} />
      <div className={styles.desktopModal}>
        <div className={styles.desktopHeader}>
          <h2 className={styles.desktopTitle}>Quick Add</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Selector Pills */}
        <div className={styles.typeSelector}>
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedType(option.value)}
              className={`${styles.typePill} ${selectedType === option.value ? styles.typePillActive : ''}`}
              style={selectedType === option.value ? {
                backgroundColor: accentColor,
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                boxShadow: `0 0 12px ${accentColor}40`,
                borderColor: accentColor
              } : {}}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Quick Input Box */}
        <div className={styles.quickInputContainer}>
          <div className={styles.quickInputWrapper}>
            <Sparkles size={16} className={styles.quickInputIcon} />
            <input
              ref={quickInputRef}
              type="text"
              value={quickInput}
              onChange={(e) => handleQuickInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit()) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder={QUICK_INPUT_PLACEHOLDERS[selectedType]}
              className={styles.quickInput}
              autoFocus
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {renderForm()}

          <button
            type="submit"
            disabled={!canSubmit() || isSubmitting}
            className={styles.submitButton}
            style={canSubmit() ? {
              backgroundColor: accentColor,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
              boxShadow: `0 0 12px ${accentColor}40`
            } : undefined}
          >
            {isSubmitting ? 'Creating...' : `Create ${TYPE_OPTIONS.find(o => o.value === selectedType)?.label}`}
          </button>
        </form>
      </div>
    </>
  );
}
