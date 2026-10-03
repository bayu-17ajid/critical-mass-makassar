import { CalculatedEventState } from '@/types';

/**
 * Returns the Date representing the Last Friday of a given year and month (0-indexed month, 0 = Jan, 11 = Dec).
 * Sets the default time to 18:30 (typical start time for Critical Mass Makassar).
 */
export function getLastFriday(year: number, month: number, hours = 18, minutes = 30): Date {
  // Start from the last day of the month
  const lastDay = new Date(year, month + 1, 0, hours, minutes, 0, 0);
  const dayOfWeek = lastDay.getDay(); // 0 is Sunday, 5 is Friday
  
  // Calculate difference to previous Friday
  // If dayOfWeek is 5 (Friday), diff is 0
  // If dayOfWeek is 6 (Saturday), diff is 1
  // If dayOfWeek is 0 (Sunday), diff is 2
  // If dayOfWeek < 5, diff is (dayOfWeek + 7 - 5) % 7
  const diff = (dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2);
  const lastFridayDate = lastDay.getDate() - diff;
  
  return new Date(year, month, lastFridayDate, hours, minutes, 0, 0);
}

/**
 * Calculates the next Critical Mass event date.
 * If today is before or on the last Friday (and before finish time, ~21:30), returns this month's last Friday.
 * Otherwise, advances to next month's last Friday.
 */
export function getNextCriticalMassDate(fromDate: Date = new Date()): Date {
  const currentYear = fromDate.getFullYear();
  const currentMonth = fromDate.getMonth();
  
  // Check this month's last Friday finish time (e.g. 21:30)
  const thisMonthLastFriday = getLastFriday(currentYear, currentMonth, 18, 30);
  const thisMonthFinishTime = new Date(thisMonthLastFriday);
  thisMonthFinishTime.setHours(21, 30, 0, 0);

  if (fromDate.getTime() <= thisMonthFinishTime.getTime()) {
    return thisMonthLastFriday;
  }

  // Next month
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  return getLastFriday(nextYear, nextMonth, 18, 30);
}

/**
 * Evaluates the calculated status of an event relative to a given reference time.
 */
export function getEventStatus(
  eventDate: Date,
  startTime?: Date,
  finishTime?: Date,
  now: Date = new Date()
): CalculatedEventState {
  const start = startTime || new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 18, 30, 0);
  const finish = finishTime || new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 21, 30, 0);
  
  const isSameDay =
    now.getFullYear() === eventDate.getFullYear() &&
    now.getMonth() === eventDate.getMonth() &&
    now.getDate() === eventDate.getDate();

  const nowTime = now.getTime();

  if (nowTime > finish.getTime()) {
    return 'COMPLETED';
  }

  if (isSameDay) {
    if (nowTime >= start.getTime() && nowTime <= finish.getTime()) {
      return 'LIVE';
    }
    return 'TODAY';
  }

  if (nowTime < start.getTime()) {
    return 'UPCOMING';
  }

  return 'COMPLETED';
}

/**
 * Formats a Date to Indonesian locale format: e.g. "Jumat, 31 Oktober 2025"
 */
export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Calculates remaining time breakdown for countdown.
 */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function calculateTimeRemaining(targetDate: Date, now: Date = new Date()): CountdownTime {
  const total = targetDate.getTime() - now.getTime();
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, isExpired: false };
}
