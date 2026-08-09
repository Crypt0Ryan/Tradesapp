/**
 * Formats a date for display as DD/MM/YYYY (Australian convention).
 *
 * Plain "YYYY-MM-DD" values (no time component, e.g. TravelEntry.date) are
 * calendar dates with no timezone attached - formatted directly, no
 * conversion. Full ISO timestamps (e.g. TimeEntry.start_time, taken_at) are
 * moments in time stored in UTC - converted to the viewer's local calendar
 * date, since that's the date the user actually experienced. Naively
 * slicing a timestamp's UTC date can be off by a day for timezones ahead of
 * UTC (e.g. Australia).
 */
export function formatDate(isoDateOrDateTime: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateOrDateTime)) {
    const [year, month, day] = isoDateOrDateTime.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(isoDateOrDateTime);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converts a full ISO timestamp to a "YYYY-MM-DD" value suitable for an
 * HTML <input type="date">, using the viewer's local calendar date (same
 * reasoning as formatDate - avoids the UTC-slice timezone bug).
 */
export function toDateInputValue(isoDateTime: string): string {
  return dateToInputValue(new Date(isoDateTime));
}

/** Same as toDateInputValue but takes a Date object directly (e.g. one computed from date-range math). */
export function dateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Monday of the week containing the given date (Australian/ISO week start). */
export function mondayOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(date, diffToMonday);
}
