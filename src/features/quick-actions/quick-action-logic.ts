import type { Booking, CalendarBlock } from "../../domain";

const INACTIVE = new Set<Booking["status"]>([
  "completed",
  "cancelled_by_customer",
  "cancelled_by_shop",
  "no_show",
  "rescheduled",
  "waitlisted",
]);

function taipeiDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export interface QuickActionSnapshot {
  today: Booking[];
  next: Booking | null;
  blocks: CalendarBlock[];
  checkedIn: Booking[];
  completed: Booking[];
}

export function buildQuickActionSnapshot(
  bookings: readonly Booking[],
  blocks: readonly CalendarBlock[],
  now: string,
): QuickActionSnapshot {
  const date = taipeiDate(now);
  const today = bookings
    .filter((booking) => taipeiDate(booking.startsAt) === date)
    .slice()
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  return {
    today,
    next: today.find((booking) => booking.startsAt >= now && !INACTIVE.has(booking.status)) ?? null,
    blocks: blocks.filter((block) => taipeiDate(block.startsAt) === date),
    checkedIn: today.filter((booking) => booking.status === "checked_in"),
    completed: today.filter((booking) => booking.status === "completed"),
  };
}
