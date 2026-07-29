export const MVP_TIME_ZONE = "Asia/Taipei" as const;
export const MVP_TIME_ZONE_LABEL = "台北時間";

export interface TaipeiClockSnapshot {
  date: string;
  time: string;
}

export interface TaipeiHistoryRange {
  fromDate: string;
  toDate: string;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const TAIPEI_CLOCK_FORMATTER = new Intl.DateTimeFormat(
  "en-US-u-ca-gregory-nu-latn",
  {
    timeZone: MVP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  },
);

const TAIPEI_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("zh-TW", {
  timeZone: MVP_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

function calendarDate(year: number, month: number, day: number): Date {
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(year, month - 1, day);
  return value;
}

function formatCalendarDate(value: Date): string {
  const year = value.getUTCFullYear();
  if (!Number.isFinite(value.getTime()) || year < 0 || year > 9999) {
    throw new RangeError("Taipei calendar date must remain within years 0000 through 9999.");
  }
  return [
    String(year).padStart(4, "0"),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function requireValidInstant(now: Date): void {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("now must be a valid Date.");
  }
}

function partValue(
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPart["type"],
): string {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) throw new RangeError(`Unable to resolve Taipei ${type}.`);
  return value;
}

export function isTaipeiCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = calendarDate(year, month, day);

  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function isTaipeiClockTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function getTaipeiClockSnapshot(now: Date): TaipeiClockSnapshot {
  requireValidInstant(now);
  const parts = TAIPEI_CLOCK_FORMATTER.formatToParts(now);
  const year = partValue(parts, "year");
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");
  const hour = partValue(parts, "hour");
  const minute = partValue(parts, "minute");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

export function taipeiToday(now = new Date()): string {
  return getTaipeiClockSnapshot(now).date;
}

export function addTaipeiCalendarDays(date: string, amount: number): string {
  if (!isTaipeiCalendarDate(date)) {
    throw new TypeError("date must be a real YYYY-MM-DD calendar date.");
  }
  if (!Number.isInteger(amount)) {
    throw new TypeError("amount must be an integer number of calendar days.");
  }

  const match = DATE_PATTERN.exec(date);
  if (!match) throw new TypeError("date must be a real YYYY-MM-DD calendar date.");
  const value = calendarDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
  value.setUTCDate(value.getUTCDate() + amount);
  return formatCalendarDate(value);
}

export function upcomingTaipeiDates(
  count = 7,
  from = taipeiToday(),
): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError("count must be a non-negative integer.");
  }
  if (!isTaipeiCalendarDate(from)) {
    throw new TypeError("from must be a real YYYY-MM-DD calendar date.");
  }

  return Array.from(
    { length: count },
    (_, index) => addTaipeiCalendarDays(from, index),
  );
}

export function formatTaipeiDate(date: string): string {
  if (!isTaipeiCalendarDate(date)) {
    throw new TypeError("date must be a real YYYY-MM-DD calendar date.");
  }

  const parts = TAIPEI_DATE_LABEL_FORMATTER.formatToParts(
    new Date(taipeiSlotDateTime(date, "12:00")),
  );
  const month = partValue(parts, "month");
  const day = partValue(parts, "day");
  const weekday = partValue(parts, "weekday");
  return `${month}/${day}（${weekday}）`;
}

export function taipeiSlotDateTime(date: string, time: string): string {
  if (!isTaipeiCalendarDate(date)) {
    throw new TypeError("date must be a real YYYY-MM-DD calendar date.");
  }
  if (!isTaipeiClockTime(time)) {
    throw new TypeError("time must use valid 24-hour HH:mm format.");
  }
  return `${date}T${time}:00+08:00`;
}

export function isTaipeiSlotPast(
  date: string,
  time: string,
  now: Date,
): boolean {
  if (!isTaipeiCalendarDate(date) || !isTaipeiClockTime(time)) return false;
  const current = getTaipeiClockSnapshot(now);
  return date < current.date
    || (date === current.date && time <= current.time);
}

export function defaultTaipeiHistoryRange(
  now: Date,
  days = 30,
): TaipeiHistoryRange {
  if (!Number.isInteger(days) || days < 1) {
    throw new TypeError("days must be a positive integer.");
  }
  const toDate = taipeiToday(now);
  return {
    fromDate: addTaipeiCalendarDays(toDate, -(days - 1)),
    toDate,
  };
}
