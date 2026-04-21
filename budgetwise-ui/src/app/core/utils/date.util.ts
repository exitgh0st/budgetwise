/**
 * Converts a Date or date string to a `YYYY-MM-DD` string using LOCAL calendar parts.
 * Using local parts (not UTC) avoids off-by-one issues when the local timezone is behind UTC.
 */
export function toDateOnlyString(
  value: Date | string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parses a `YYYY-MM-DD` string into a LOCAL Date (midnight in the user's timezone).
 * Using `new Date(year, month - 1, day)` rather than `new Date(isoString)` avoids
 * the UTC-midnight interpretation that shifts the displayed date in negative-offset timezones.
 */
export function fromDateOnlyString(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}
