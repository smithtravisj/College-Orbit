import { useCallback } from 'react';
import useAppStore from '@/lib/store';
import {
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatTimeString as formatTimeStringUtil,
  formatDateString as formatDateStringUtil,
  formatDateNumeric as formatDateNumericUtil,
  getRelativeDateString,
  TimeFormat,
  DateFormat,
} from '@/lib/utils';

/**
 * Hook that provides date/time formatting functions using the user's preferences.
 * Use this hook in components that need to display dates or times.
 */
export function useFormatters() {
  const timeFormat = useAppStore((state) => state.settings.timeFormat) || '12h';
  const dateFormat = useAppStore((state) => state.settings.dateFormat) || 'MM/DD/YYYY';
  const showRelativeDates = useAppStore((state) => state.settings.showRelativeDates) ?? false;
  const showCourseCode = useAppStore((state) => state.settings.showCourseCode) ?? false;

  const formatDate = useCallback(
    (date: Date | string) => {
      if (showRelativeDates) {
        const relative = getRelativeDateString(date);
        if (relative) return relative;
      }
      return formatDateUtil(date, dateFormat as DateFormat);
    },
    [dateFormat, showRelativeDates]
  );

  const formatTime = useCallback(
    (date: Date | string) => formatTimeUtil(date, timeFormat as TimeFormat),
    [timeFormat]
  );

  const formatDateTime = useCallback(
    (date: Date | string) => formatDateTimeUtil(date, dateFormat as DateFormat, timeFormat as TimeFormat),
    [dateFormat, timeFormat]
  );

  // Format a time string like "14:30" to user's preferred format
  const formatTimeString = useCallback(
    (time: string) => formatTimeStringUtil(time, timeFormat as TimeFormat),
    [timeFormat]
  );

  // Format a date string like "2024-01-19" to user's preferred format
  const formatDateString = useCallback(
    (dateStr: string) => {
      if (showRelativeDates) {
        const relative = getRelativeDateString(dateStr);
        if (relative) return relative;
      }
      return formatDateStringUtil(dateStr, dateFormat as DateFormat);
    },
    [dateFormat, showRelativeDates]
  );

  // Format date as numeric (01/19/2024 or 19/01/2024)
  const formatDateNumeric = useCallback(
    (date: Date | string) => formatDateNumericUtil(date, dateFormat as DateFormat),
    [dateFormat]
  );

  // Get course display name based on showCourseCode setting
  const getCourseDisplayName = useCallback(
    (course: { code: string; name: string } | null | undefined): string => {
      if (!course) return '';
      return showCourseCode ? course.code : course.name;
    },
    [showCourseCode]
  );

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatTimeString,
    formatDateString,
    formatDateNumeric,
    getCourseDisplayName,
    showCourseCode,
    timeFormat: timeFormat as TimeFormat,
    dateFormat: dateFormat as DateFormat,
  };
}
