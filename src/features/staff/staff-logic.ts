import {
  overlaps,
  type Booking,
  type BookingStatus,
  type CalendarBlock,
  type Customer,
  type EntityId,
  type StaffRole,
} from "../../domain";
export { canStaffRole } from "../../domain";

export const ALL_STAFF = "all" as const;
export type StaffFilter = EntityId | typeof ALL_STAFF;

export function resolveMockStaffFilter(
  role: StaffRole,
  identityStaffId: EntityId | undefined,
  requestedFilter: StaffFilter,
): StaffFilter | null {
  if (role !== "barber") return requestedFilter;
  return identityStaffId ?? null;
}

export function isBookingInMockIdentityScope(
  booking: Booking,
  role: StaffRole,
  identityStaffId: EntityId | undefined,
): boolean {
  return role !== "barber" || Boolean(identityStaffId && booking.staffId === identityStaffId);
}

export function filterMockCustomersForIdentity(
  customers: Customer[],
  role: StaffRole,
  identityStaffId: EntityId | undefined,
): Customer[] {
  if (role !== "barber") return customers;
  if (!identityStaffId) return [];
  return customers.filter((customer) => customer.preferredStaffId === identityStaffId);
}

const NON_BLOCKING_STATUSES = new Set<BookingStatus>([
  "cancelled_by_customer",
  "cancelled_by_shop",
  "no_show",
  "rescheduled",
  "waitlisted",
]);

export type StaffTimelineItem =
  | { id: EntityId; kind: "booking"; startsAt: string; endsAt: string; staffId: EntityId; booking: Booking }
  | { id: EntityId; kind: "block"; startsAt: string; endsAt: string; staffId: EntityId; block: CalendarBlock };

export function filterBookings(bookings: Booking[], staffFilter: StaffFilter): Booking[] {
  return bookings
    .filter((booking) => staffFilter === ALL_STAFF || booking.staffId === staffFilter)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function findNextBooking(
  bookings: Booking[],
  staffFilter: StaffFilter,
  after: string,
): Booking | null {
  return filterBookings(bookings, staffFilter).find((booking) =>
    booking.startsAt >= after && !NON_BLOCKING_STATUSES.has(booking.status),
  ) ?? null;
}

export function buildTimeline(
  bookings: Booking[],
  blocks: CalendarBlock[],
  staffFilter: StaffFilter,
): StaffTimelineItem[] {
  const bookingItems: StaffTimelineItem[] = filterBookings(bookings, staffFilter).map((booking) => ({
    id: booking.id,
    kind: "booking",
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    staffId: booking.staffId,
    booking,
  }));
  const blockItems: StaffTimelineItem[] = blocks
    .filter((block) => staffFilter === ALL_STAFF || block.staffId === staffFilter)
    .map((block) => ({
      id: block.id,
      kind: "block",
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      staffId: block.staffId,
      block,
    }));
  return [...bookingItems, ...blockItems].sort((left, right) =>
    left.startsAt.localeCompare(right.startsAt) || left.staffId.localeCompare(right.staffId),
  );
}

export function canPlaceBlock(
  candidate: CalendarBlock,
  bookings: Booking[],
  blocks: CalendarBlock[],
): boolean {
  const start = new Date(candidate.startsAt);
  const end = new Date(candidate.endsAt);
  if (start >= end) return false;

  const bookingConflict = bookings.some((booking) =>
    booking.staffId === candidate.staffId &&
    !NON_BLOCKING_STATUSES.has(booking.status) &&
    overlaps(start, end, new Date(booking.startsAt), new Date(booking.endsAt)),
  );
  const blockConflict = blocks.some((block) =>
    block.staffId === candidate.staffId &&
    overlaps(start, end, new Date(block.startsAt), new Date(block.endsAt)),
  );
  return !bookingConflict && !blockConflict;
}

export interface StaffWeekDay {
  date: string;
  bookings: Booking[];
  blocks: CalendarBlock[];
}

function taipeiDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function buildWeekDays(
  weekStart: string,
  bookings: Booking[],
  blocks: CalendarBlock[],
  staffFilter: StaffFilter,
): StaffWeekDay[] {
  const start = new Date(`${weekStart}T00:00:00+08:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(start.getTime() + index * 24 * 60 * 60 * 1000));
    return {
      date,
      bookings: filterBookings(bookings, staffFilter).filter((booking) => taipeiDate(booking.startsAt) === date),
      blocks: blocks.filter((block) =>
        (staffFilter === ALL_STAFF || block.staffId === staffFilter) && taipeiDate(block.startsAt) === date,
      ),
    };
  });
}
