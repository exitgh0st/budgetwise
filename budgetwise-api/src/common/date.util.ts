const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Creates a UTC Date for a calendar date, anchored at noon (12:00 UTC).
 * Noon avoids DST edge cases where midnight UTC can flip to the previous local day.
 *
 * @param year - Full year (e.g. 2026)
 * @param monthIndex - Zero-based month (0 = January)
 * @param day - Day of month
 */
export function createDateOnlyUtc(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
}

/**
 * Fallback parser for non-ISO date strings (e.g. stored legacy values).
 * Throws if the string produces an invalid Date.
 */
function parseLegacyDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}

/**
 * Parses a YYYY-MM-DD string into a UTC Date anchored at noon.
 * Falls back to `parseLegacyDate` for non-ISO formats to maintain
 * backward compatibility with older stored values.
 *
 * @param value - ISO date string (YYYY-MM-DD) or legacy date string
 */
export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return parseLegacyDate(value);
  }

  const [, year, month, day] = match;

  return createDateOnlyUtc(Number(year), Number(month) - 1, Number(day));
}

/**
 * Parses a YYYY-MM-DD string into a UTC Date representing the start or end of that day.
 * Used to build inclusive date range filters for database queries.
 *
 * @param value - ISO date string (YYYY-MM-DD) or legacy date string
 * @param boundary - 'start' → 00:00:00.000 UTC, 'end' → 23:59:59.999 UTC
 */
export function parseDateBoundary(
  value: string,
  boundary: 'start' | 'end',
): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return parseLegacyDate(value);
  }

  const [, year, month, day] = match;

  return boundary === 'start'
    ? new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0),
      )
    : new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999),
      );
}

/**
 * Returns the UTC start and end timestamps for a given calendar month.
 * Uses `month - 1` for the JS zero-based month index; day 0 of the
 * following month resolves to the last day of the target month.
 *
 * @param month - 1-based month (1–12)
 * @param year - Full year (e.g. 2026)
 */
export function getUtcMonthRange(month: number, year: number) {
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

/**
 * Returns midnight (00:00:00) of the given date in the server's local timezone.
 * Used for cron/notification comparisons that should respect local calendar days.
 */
export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/**
 * Returns 23:59:59.999 of the given date in the server's local timezone.
 * Used to build inclusive end-of-day boundaries for due-date checks.
 */
export function endOfLocalDay(value: Date): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

/**
 * Returns the number of whole calendar days between two local dates.
 * Normalizes both dates to UTC midnight before computing the difference
 * so that time-of-day has no effect on the result.
 *
 * @param from - Start date
 * @param to - End date (positive result when `to` is after `from`)
 */
export function differenceInLocalCalendarDays(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((toDay - fromDay) / 86400000);
}
