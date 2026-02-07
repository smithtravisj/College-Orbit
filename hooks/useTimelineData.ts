'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import useAppStore from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { isDateExcluded } from '@/lib/calendarUtils';
import { isToday as checkIsToday, isOverdue } from '@/lib/utils';
import {
  TimelineItem,
  TimelineRange,
  TimelineProgress,
  TimelineDayData,
  TimelineGroupedData,
  TimelineItemType,
} from '@/types/timeline';
import { Course, ExcludedDate } from '@/types';
import { toLocalDateString } from '@/lib/utils';

const CACHE_KEY = 'timeline_cache';

// Get cached data synchronously for instant display
function getCachedData(range: TimelineRange): TimelineGroupedData | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${range}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is from today (invalidate at midnight)
      const today = toLocalDateString(new Date());
      if (parsed.date === today) {
        return parsed.data;
      }
    }
  } catch {}
  return null;
}

// Save to cache asynchronously
function setCachedData(range: TimelineRange, data: TimelineGroupedData) {
  if (typeof window === 'undefined') return;
  try {
    const today = toLocalDateString(new Date());
    localStorage.setItem(`${CACHE_KEY}_${range}`, JSON.stringify({ date: today, data }));
  } catch {}
}

interface UseTimelineDataOptions {
  range: TimelineRange;
  itemTypes?: TimelineItemType[];
}

interface UseTimelineDataReturn {
  groupedData: TimelineGroupedData;
  isLoading: boolean;
}

// Helper to check if a course is active on a specific date
function isCourseCurrent(
  course: Course,
  checkDate: Date,
  excludedDates: ExcludedDate[]
): boolean {
  const dateStr = toLocalDateString(checkDate);

  if (course.startDate) {
    const startStr = course.startDate.split('T')[0];
    if (startStr > dateStr) return false;
  }

  if (course.endDate) {
    const endStr = course.endDate.split('T')[0];
    if (endStr < dateStr) return false;
  }

  if (isDateExcluded(checkDate, course.id, excludedDates)) {
    return false;
  }

  return true;
}

// Helper to format time from Date to HH:mm
function formatTimeFromDate(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Helper to check if a class is currently in session
function isClassInSession(start: string, end: string): boolean {
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return start <= nowTime && end > nowTime;
}

// Helper to check if time is 23:59 (default "no specific time")
function isDefaultTime(date: Date): boolean {
  return date.getHours() === 23 && date.getMinutes() === 59;
}

export function useTimelineData({
  range,
  itemTypes = ['class', 'task', 'deadline', 'exam', 'event'],
}: UseTimelineDataOptions): UseTimelineDataReturn {
  // Load from cache instantly for fast initial render
  const [cachedData] = useState<TimelineGroupedData | null>(() => getCachedData(range));

  // Track overdue item IDs from initial load - items in this set stay visible even after completion
  // This prevents items from disappearing immediately when marked complete (they disappear on refresh)
  const initialOverdueIdsRef = useRef<Set<string> | null>(null);

  // Single selector with shallow comparison to reduce re-renders
  const { courses, tasks, deadlines, workItems, exams, calendarEvents, excludedDates, loading, initialized } = useAppStore(
    useShallow((state) => ({
      courses: state.courses,
      tasks: state.tasks,
      deadlines: state.deadlines,
      workItems: state.workItems,
      exams: state.exams,
      calendarEvents: state.calendarEvents,
      excludedDates: state.excludedDates,
      loading: state.loading,
      initialized: state.initialized,
    }))
  );

  // Use workItems if available, otherwise fall back to tasks + deadlines for backward compatibility
  const useWorkItems = workItems.length > 0 || (tasks.length === 0 && deadlines.length === 0);

  const groupedData = useMemo<TimelineGroupedData>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const numDays = range === 'today' ? 1 : 7;

    const days: TimelineDayData[] = [];
    let totalCompleted = 0;
    let totalActionable = 0;
    let hasOverdue = false;

    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateKey = toLocalDateString(date);
      const dayIndex = date.getDay();
      const dayAbbrev = dayNames[dayIndex];
      const isToday = i === 0;

      const items: TimelineItem[] = [];
      let dayCompleted = 0;
      let dayTotal = 0;

      // 1. Classes for this day
      if (itemTypes.includes('class')) {
        courses
          .filter((course) => isCourseCurrent(course, date, excludedDates))
          .forEach((course) => {
            (course.meetingTimes || [])
              .filter((mt) => mt.days?.includes(dayAbbrev))
              .forEach((mt) => {
                const isCurrent = isToday && isClassInSession(mt.start, mt.end);
                items.push({
                  id: `class-${course.id}-${mt.start}`,
                  type: 'class',
                  title: course.name || course.code,
                  time: mt.start,
                  endTime: mt.end,
                  courseId: course.id,
                  courseName: course.name,
                  courseCode: course.code,
                  location: mt.location,
                  isAllDay: false,
                  isCurrent,
                  originalItem: { ...course, meetingTime: mt },
                  links: course.links,
                  files: course.files,
                  canComplete: false,
                });
              });
          });
      }

      // 2. Tasks and Deadlines for this day
      // Use workItems if available, otherwise fall back to separate tasks + deadlines
      if (useWorkItems) {
        // Unified work items
        if (itemTypes.includes('task') || itemTypes.includes('deadline')) {
          workItems
            .filter((item) => {
              if (!item.dueAt) return false;
              const itemDate = new Date(item.dueAt);
              itemDate.setHours(0, 0, 0, 0);
              return itemDate.getTime() === date.getTime();
            })
            .forEach((item) => {
              const itemDate = new Date(item.dueAt!);
              const course = item.courseId ? courses.find((c) => c.id === item.courseId) : null;
              const itemIsOverdue = item.status === 'open' && isOverdue(item.dueAt!);
              // Map work item type to timeline type
              const getTimelineType = (workItemType: string): TimelineItemType => {
                switch (workItemType) {
                  case 'assignment': return 'deadline';
                  case 'reading': return 'reading';
                  case 'project': return 'project';
                  default: return 'task';
                }
              };
              const timelineType: TimelineItemType = getTimelineType(item.type);

              // Skip if this type is not requested (reading/project are filtered with task)
              const filterType = timelineType === 'reading' || timelineType === 'project' ? 'task' : timelineType;
              if (!itemTypes.includes(filterType)) return;

              if (itemIsOverdue && isToday) {
                hasOverdue = true;
              }

              if (item.status === 'open') {
                dayTotal++;
                totalActionable++;
              } else if (item.status === 'done') {
                dayCompleted++;
                totalCompleted++;
                dayTotal++;
                totalActionable++;
              }

              items.push({
                id: `${timelineType}-${item.id}`,
                type: timelineType,
                title: item.title,
                time: isDefaultTime(itemDate) ? null : formatTimeFromDate(itemDate),
                courseId: item.courseId,
                courseName: course?.name,
                courseCode: course?.code,
                isAllDay: isDefaultTime(itemDate),
                isOverdue: itemIsOverdue,
                isCompleted: item.status === 'done',
                originalItem: item,
                links: item.links,
                files: item.files,
                canComplete: true,
              });
            });
        }
      } else {
        // Legacy: separate tasks and deadlines
        if (itemTypes.includes('task')) {
          tasks
            .filter((task) => {
              if (!task.dueAt) return false;
              const taskDate = new Date(task.dueAt);
              taskDate.setHours(0, 0, 0, 0);
              return taskDate.getTime() === date.getTime();
            })
            .forEach((task) => {
              const taskDate = new Date(task.dueAt!);
              const course = task.courseId ? courses.find((c) => c.id === task.courseId) : null;
              const taskIsOverdue = task.status === 'open' && isOverdue(task.dueAt!);

              if (taskIsOverdue && isToday) {
                hasOverdue = true;
              }

              if (task.status === 'open') {
                dayTotal++;
                totalActionable++;
              } else if (task.status === 'done') {
                dayCompleted++;
                totalCompleted++;
                dayTotal++;
                totalActionable++;
              }

              items.push({
                id: `task-${task.id}`,
                type: 'task',
                title: task.title,
                time: isDefaultTime(taskDate) ? null : formatTimeFromDate(taskDate),
                courseId: task.courseId,
                courseName: course?.name,
                courseCode: course?.code,
                isAllDay: isDefaultTime(taskDate),
                isOverdue: taskIsOverdue,
                isCompleted: task.status === 'done',
                originalItem: task,
                links: task.links,
                files: task.files,
                canComplete: true,
              });
            });
        }

        if (itemTypes.includes('deadline')) {
          deadlines
            .filter((deadline) => {
              if (!deadline.dueAt) return false;
              const deadlineDate = new Date(deadline.dueAt);
              deadlineDate.setHours(0, 0, 0, 0);
              return deadlineDate.getTime() === date.getTime();
            })
            .forEach((deadline) => {
              const deadlineDate = new Date(deadline.dueAt!);
              const course = deadline.courseId ? courses.find((c) => c.id === deadline.courseId) : null;
              const deadlineIsOverdue = deadline.status === 'open' && isOverdue(deadline.dueAt!);

              if (deadlineIsOverdue && isToday) {
                hasOverdue = true;
              }

              if (deadline.status === 'open') {
                dayTotal++;
                totalActionable++;
              } else if (deadline.status === 'done') {
                dayCompleted++;
                totalCompleted++;
                dayTotal++;
                totalActionable++;
              }

              items.push({
                id: `deadline-${deadline.id}`,
                type: 'deadline',
                title: deadline.title,
                time: isDefaultTime(deadlineDate) ? null : formatTimeFromDate(deadlineDate),
                courseId: deadline.courseId,
                courseName: course?.name,
                courseCode: course?.code,
                isAllDay: isDefaultTime(deadlineDate),
                isOverdue: deadlineIsOverdue,
                isCompleted: deadline.status === 'done',
                originalItem: deadline,
                links: deadline.links,
                files: deadline.files,
                canComplete: true,
              });
            });
        }
      }

      // 4. Exams for this day
      if (itemTypes.includes('exam')) {
        exams
          .filter((exam) => {
            if (!exam.examAt) return false;
            const examDate = new Date(exam.examAt);
            examDate.setHours(0, 0, 0, 0);
            return examDate.getTime() === date.getTime();
          })
          .forEach((exam) => {
            const examDate = new Date(exam.examAt!);
            const course = exam.courseId ? courses.find((c) => c.id === exam.courseId) : null;

            items.push({
              id: `exam-${exam.id}`,
              type: 'exam',
              title: exam.title,
              time: formatTimeFromDate(examDate),
              courseId: exam.courseId,
              courseName: course?.name,
              courseCode: course?.code,
              location: exam.location,
              isAllDay: false,
              originalItem: exam,
              links: exam.links,
              files: exam.files,
              canComplete: false,
            });
          });
      }

      // 5. Calendar Events for this day
      if (itemTypes.includes('event')) {
        (calendarEvents || [])
          .filter((evt) => {
            const evtDate = new Date(evt.startAt);
            evtDate.setHours(0, 0, 0, 0);
            return evtDate.getTime() === date.getTime();
          })
          .forEach((evt) => {
            const evtDate = new Date(evt.startAt);

            items.push({
              id: `event-${evt.id}`,
              type: 'event',
              title: evt.title,
              time: evt.allDay ? null : formatTimeFromDate(evtDate),
              endTime: evt.endAt ? formatTimeFromDate(new Date(evt.endAt)) : null,
              courseId: null,
              location: evt.location,
              isAllDay: evt.allDay,
              originalItem: evt,
              canComplete: false,
            });
          });
      }

      // Sort items by time (timed items first, then all-day items)
      items.sort((a, b) => {
        // Timed items first, all-day items last
        if (a.isAllDay && !b.isAllDay) return 1;
        if (!a.isAllDay && b.isAllDay) return -1;
        if (a.isAllDay && b.isAllDay) return 0;

        // Then by time
        const timeA = a.time || '23:59';
        const timeB = b.time || '23:59';
        return timeA.localeCompare(timeB);
      });

      const dayProgress: TimelineProgress = {
        completed: dayCompleted,
        total: dayTotal,
        percentage: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 100,
        hasOverdue: items.some((item) => item.isOverdue),
      };

      days.push({
        date,
        dateKey,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
        items,
        progress: dayProgress,
      });
    }

    // Also include overdue items from previous days in both views
    // For week view, overdue items are added to today (first day)
    {
      const overdueItems: TimelineItem[] = [];

      // Build list of currently open overdue item IDs (for initializing the ref on first load)
      const currentOpenOverdueIds = new Set<string>();

      if (useWorkItems) {
        // Unified work items for overdue
        if (itemTypes.includes('task') || itemTypes.includes('deadline')) {
          workItems
            .filter((item) => item.dueAt && isOverdue(item.dueAt))
            .forEach((item) => {
              const itemDate = new Date(item.dueAt!);
              // Skip if it's already in today's items
              if (checkIsToday(itemDate)) return;

              const timelineType: TimelineItemType = item.type === 'assignment' ? 'deadline' : 'task';
              // Skip if this type is not requested
              if (!itemTypes.includes(timelineType)) return;

              const itemId = `${timelineType}-${item.id}`;
              const isItemCompleted = item.status === 'done';

              // Track open overdue items for initial ref population
              if (!isItemCompleted) {
                currentOpenOverdueIds.add(itemId);
              }

              // Show item if it's open OR if it was in the initial overdue set (completed during this session)
              const wasInitiallyOverdue = initialOverdueIdsRef.current?.has(itemId) ?? false;
              if (!isItemCompleted || wasInitiallyOverdue) {
                const course = item.courseId ? courses.find((c) => c.id === item.courseId) : null;

                if (!isItemCompleted) {
                  hasOverdue = true;
                }
                totalActionable++;
                if (isItemCompleted) {
                  totalCompleted++;
                }

                overdueItems.push({
                  id: itemId,
                  type: timelineType,
                  title: item.title,
                  time: isDefaultTime(itemDate) ? null : formatTimeFromDate(itemDate),
                  courseId: item.courseId,
                  courseName: course?.name,
                  courseCode: course?.code,
                  isAllDay: isDefaultTime(itemDate),
                  isOverdue: !isItemCompleted,
                  isCompleted: isItemCompleted,
                  originalItem: item,
                  links: item.links,
                  files: item.files,
                  canComplete: true,
                });
              }
            });
        }
      } else {
        // Legacy: Overdue tasks
        if (itemTypes.includes('task')) {
          tasks
            .filter((task) => task.dueAt && isOverdue(task.dueAt))
            .forEach((task) => {
              const taskDate = new Date(task.dueAt!);
              // Skip if it's already in today's items
              if (checkIsToday(taskDate)) return;

              const taskId = `task-${task.id}`;
              const isTaskCompleted = task.status === 'done';

              // Track open overdue items for initial ref population
              if (!isTaskCompleted) {
                currentOpenOverdueIds.add(taskId);
              }

              // Show item if it's open OR if it was in the initial overdue set (completed during this session)
              const wasInitiallyOverdue = initialOverdueIdsRef.current?.has(taskId) ?? false;
              if (!isTaskCompleted || wasInitiallyOverdue) {
                const course = task.courseId ? courses.find((c) => c.id === task.courseId) : null;

                if (!isTaskCompleted) {
                  hasOverdue = true;
                }
                totalActionable++;
                if (isTaskCompleted) {
                  totalCompleted++;
                }

                overdueItems.push({
                  id: taskId,
                  type: 'task',
                  title: task.title,
                  time: isDefaultTime(taskDate) ? null : formatTimeFromDate(taskDate),
                  courseId: task.courseId,
                  courseName: course?.name,
                  courseCode: course?.code,
                  isAllDay: isDefaultTime(taskDate),
                  isOverdue: !isTaskCompleted,
                  isCompleted: isTaskCompleted,
                  originalItem: task,
                  links: task.links,
                  files: task.files,
                  canComplete: true,
                });
              }
            });
        }

        // Legacy: Overdue deadlines
        if (itemTypes.includes('deadline')) {
          deadlines
            .filter((deadline) => deadline.dueAt && isOverdue(deadline.dueAt))
            .forEach((deadline) => {
              const deadlineDate = new Date(deadline.dueAt!);
              // Skip if it's already in today's items
              if (checkIsToday(deadlineDate)) return;

              const deadlineId = `deadline-${deadline.id}`;
              const isDeadlineCompleted = deadline.status === 'done';

              // Track open overdue items for initial ref population
              if (!isDeadlineCompleted) {
                currentOpenOverdueIds.add(deadlineId);
              }

              // Show item if it's open OR if it was in the initial overdue set (completed during this session)
              const wasInitiallyOverdue = initialOverdueIdsRef.current?.has(deadlineId) ?? false;
              if (!isDeadlineCompleted || wasInitiallyOverdue) {
                const course = deadline.courseId ? courses.find((c) => c.id === deadline.courseId) : null;

                if (!isDeadlineCompleted) {
                  hasOverdue = true;
                }
                totalActionable++;
                if (isDeadlineCompleted) {
                  totalCompleted++;
                }

                overdueItems.push({
                  id: deadlineId,
                  type: 'deadline',
                  title: deadline.title,
                  time: isDefaultTime(deadlineDate) ? null : formatTimeFromDate(deadlineDate),
                  courseId: deadline.courseId,
                  courseName: course?.name,
                  courseCode: course?.code,
                  isAllDay: isDefaultTime(deadlineDate),
                  isOverdue: !isDeadlineCompleted,
                  isCompleted: isDeadlineCompleted,
                  originalItem: deadline,
                  links: deadline.links,
                  files: deadline.files,
                  canComplete: true,
                });
              }
            });
        }
      }

      // Initialize the ref on first computation with actual data
      // This captures which items were open+overdue at page load
      if (initialOverdueIdsRef.current === null && (tasks.length > 0 || deadlines.length > 0 || workItems.length > 0)) {
        initialOverdueIdsRef.current = currentOpenOverdueIds;
      }

      // Add overdue items at the top of today's items
      if (overdueItems.length > 0 && days.length > 0) {
        days[0].items = [...overdueItems, ...days[0].items];
        days[0].progress.hasOverdue = true;
      }
    }

    const totalProgress: TimelineProgress = {
      completed: totalCompleted,
      total: totalActionable,
      percentage: totalActionable > 0 ? Math.round((totalCompleted / totalActionable) * 100) : 100,
      hasOverdue,
    };

    return { days, totalProgress };
  }, [courses, tasks, deadlines, workItems, useWorkItems, exams, calendarEvents, excludedDates, range, itemTypes]);

  // Cache the computed data for next load
  useEffect(() => {
    if (!loading && groupedData.days.length > 0) {
      setCachedData(range, groupedData);
    }
  }, [groupedData, loading, range]);


  // Check if store has actual data (not just empty arrays)
  const storeHasData = courses.length > 0 || tasks.length > 0 || deadlines.length > 0 || workItems.length > 0 || exams.length > 0 || (calendarEvents?.length || 0) > 0;

  // Use store data if it has content, otherwise fall back to cache
  // This prevents flashing empty state when component remounts
  const shouldUseCache = !storeHasData && cachedData !== null;

  const finalData = shouldUseCache ? cachedData : groupedData;
  const isLoadingResult = !initialized && !cachedData;


  return {
    groupedData: finalData,
    isLoading: isLoadingResult,
  };
}
