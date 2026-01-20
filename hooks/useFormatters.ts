import { useCallback } from 'react';
import useAppStore from '@/lib/store';
import {
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatTimeString as formatTimeStringUtil,
  formatDateString as formatDateStringUtil,
  formatDateNumeric as formatDateNumericUtil,
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

  const formatDate = useCallback(
    (date: Date | string) => formatDateUtil(date, dateFormat as DateFormat),
    [dateFormat]
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
    (dateStr: string) => formatDateStringUtil(dateStr, dateFormat as DateFormat),
    [dateFormat]
  );

  // Format date as numeric (01/19/2024 or 19/01/2024)
  const formatDateNumeric = useCallback(
    (date: Date | string) => formatDateNumericUtil(date, dateFormat as DateFormat),
    [dateFormat]
  );

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatTimeString,
    formatDateString,
    formatDateNumeric,
    timeFormat: timeFormat as TimeFormat,
    dateFormat: dateFormat as DateFormat,
  };
}
