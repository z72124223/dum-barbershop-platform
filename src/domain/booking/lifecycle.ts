import {
  DomainError,
  type AuditEvent,
  type Booking,
  type EntityId,
  type IsoInstant,
} from "../models";
import { transitionBooking } from "./transitions";

export interface RescheduleBookingResult {
  original: Booking;
  replacement: Booking;
  auditEvents: AuditEvent[];
}

export function rescheduleBooking(
  original: Booking,
  replacement: Booking,
  actorId: EntityId,
  occurredAt: IsoInstant,
): RescheduleBookingResult {
  if (
    original.status !== "confirmed" ||
    original.id === replacement.id ||
    original.customerId !== replacement.customerId ||
    original.serviceId !== replacement.serviceId
  ) {
    throw new DomainError(
      "INVALID_RESCHEDULE",
      "A reschedule requires one confirmed booking and a distinct replacement for the same customer and service.",
    );
  }

  const transitioned = transitionBooking(original, "rescheduled", actorId, occurredAt);
  const previous: Booking = {
    ...transitioned.booking,
    rescheduledToBookingId: replacement.id,
  };
  const next: Booking = {
    ...replacement,
    status: "confirmed",
    rescheduledFromBookingId: original.id,
    updatedAt: occurredAt,
  };
  const lineageAudit: AuditEvent = {
    id: `audit-${original.id}-rescheduled-to-${replacement.id}-${occurredAt}`,
    occurredAt,
    actorId,
    action: "booking_rescheduled",
    entityType: "booking",
    entityId: replacement.id,
    metadata: {
      fromBookingId: original.id,
      toBookingId: replacement.id,
    },
  };

  return {
    original: previous,
    replacement: next,
    auditEvents: [transitioned.auditEvent, lineageAudit],
  };
}

export function requestCustomerCancellation(
  booking: Booking,
  actorId: EntityId,
  occurredAt: IsoInstant,
) {
  return transitionBooking(booking, "cancelled_by_customer", actorId, occurredAt);
}

export function rankSafeWaitlist(bookings: readonly Booking[]): Booking[] {
  return bookings
    .filter((booking) => booking.status === "pending" || booking.status === "waitlisted")
    .slice()
    .sort((left, right) => {
      const leftPaid = left.depositStatus === "paid" ? 1 : 0;
      const rightPaid = right.depositStatus === "paid" ? 1 : 0;
      return rightPaid - leftPaid || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
    });
}
