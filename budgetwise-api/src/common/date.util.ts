const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function createDateOnlyUtc(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
}

function parseLegacyDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}

export function parseDateOnly(value: string): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    return parseLegacyDate(value);
  }

  const [, year, month, day] = match;

  return createDateOnlyUtc(Number(year), Number(month) - 1, Number(day));
}

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

export function getUtcMonthRange(month: number, year: number) {
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

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

export function differenceInLocalCalendarDays(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((toDay - fromDay) / 86400000);
}
