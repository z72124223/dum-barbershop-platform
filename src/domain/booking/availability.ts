import {
  DEFAULT_TIME_ZONE,
  DomainError,
  type AvailabilityRequest,
  type AvailabilityResult,
  type AvailabilitySlot,
  type Booking,
  type Branch,
  type CalendarBlock,
  type Service,
  type Staff,
} from "../models";
import {
  addMinutes,
  dayOfWeekInTaipei,
  formatTaipeiTime,
  overlaps,
  subtractMinutes,
  toTaipeiInstant,
} from "./time";

export interface AvailabilityContext {
  branches: Branch[];
  staff: Staff[];
  services: Service[];
  bookings: Booking[];
  blocks: CalendarBlock[];
}

const NON_BLOCKING_BOOKING_STATUSES = new Set<Booking["status"]>([
  "cancelled_by_customer",
  "cancelled_by_shop",
  "no_show",
  "rescheduled",
  "waitlisted",
]);

export function calculateAvailability(
  request: AvailabilityRequest,
  context: AvailabilityContext,
): AvailabilityResult {
  const branch = context.branches.find((item) => item.id === request.branchId && item.active);
  if (!branch) {
    throw new DomainError("BRANCH_NOT_FOUND", `Branch ${request.branchId} is not available.`);
  }

  const member = context.staff.find(
    (item) => item.id === request.staffId && item.branchId === branch.id && item.active,
  );
  if (!member) {
    throw new DomainError("STAFF_NOT_FOUND", `Staff ${request.staffId} is not available at this branch.`);
  }

  const service = context.services.find((item) => item.id === request.serviceId && item.active);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Service ${request.serviceId} is not available.`);
  }

  if (!member.serviceIds.includes(service.id)) {
    return {
      request,
      timeZone: DEFAULT_TIME_ZONE,
      slots: [],
      emptyReason: "service_not_supported",
    };
  }

  const scheduleDay = member.schedule.days.find(
    (item) => item.dayOfWeek === dayOfWeekInTaipei(request.date),
  );
  if (!scheduleDay || scheduleDay.intervals.length === 0) {
    return {
      request,
      timeZone: DEFAULT_TIME_ZONE,
      slots: [],
      emptyReason: "staff_not_scheduled",
    };
  }

  const memberBookings = context.bookings.filter(
    (booking) => booking.staffId === member.id && !NON_BLOCKING_BOOKING_STATUSES.has(booking.status),
  );
  const memberBlocks = context.blocks.filter((block) => block.staffId === member.id);
  const slots: AvailabilitySlot[] = [];

  for (const interval of scheduleDay.intervals) {
    const shiftStart = toTaipeiInstant(request.date, interval.start);
    const shiftEnd = toTaipeiInstant(request.date, interval.end);
    if (shiftStart >= shiftEnd) {
      throw new DomainError(
        "INVALID_TIME_RANGE",
        `Schedule interval ${interval.start}-${interval.end} must end after it starts.`,
      );
    }

    let candidateStart = addMinutes(shiftStart, service.bufferBeforeMinutes);
    const latestCandidateStart = subtractMinutes(
      shiftEnd,
      service.durationMinutes + service.bufferAfterMinutes,
    );

    while (candidateStart <= latestCandidateStart) {
      const candidateEnd = addMinutes(candidateStart, service.durationMinutes);
      const occupiedStart = subtractMinutes(candidateStart, service.bufferBeforeMinutes);
      const occupiedEnd = addMinutes(candidateEnd, service.bufferAfterMinutes);

      const bookingConflict = memberBookings.some((booking) => {
        const bookedService = context.services.find((item) => item.id === booking.serviceId);
        const bookedStart = new Date(booking.startsAt);
        const bookedEnd = new Date(booking.endsAt);
        const bookedOccupiedStart = subtractMinutes(bookedStart, bookedService?.bufferBeforeMinutes ?? 0);
        const bookedOccupiedEnd = addMinutes(bookedEnd, bookedService?.bufferAfterMinutes ?? 0);
        return overlaps(occupiedStart, occupiedEnd, bookedOccupiedStart, bookedOccupiedEnd);
      });

      const blockConflict = memberBlocks.some((block) =>
        overlaps(occupiedStart, occupiedEnd, new Date(block.startsAt), new Date(block.endsAt)),
      );

      if (!bookingConflict && !blockConflict) {
        slots.push({
          startsAt: candidateStart.toISOString(),
          endsAt: candidateEnd.toISOString(),
          label: formatTaipeiTime(candidateStart),
        });
      }

      candidateStart = addMinutes(candidateStart, member.schedule.slotStepMinutes);
    }
  }

  return {
    request,
    timeZone: DEFAULT_TIME_ZONE,
    slots,
    ...(slots.length === 0 ? { emptyReason: "fully_booked" as const } : {}),
  };
}
