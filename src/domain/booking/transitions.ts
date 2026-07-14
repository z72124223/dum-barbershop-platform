import {
  DomainError,
  type AuditEvent,
  type Booking,
  type BookingStatus,
  type EntityId,
  type IsoInstant,
} from "../models";

const TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  pending: ["confirmed", "waitlisted", "cancelled_by_customer", "cancelled_by_shop"],
  confirmed: [
    "checked_in",
    "rescheduled",
    "cancelled_by_customer",
    "cancelled_by_shop",
    "no_show",
  ],
  checked_in: ["in_service", "cancelled_by_shop"],
  in_service: ["completed"],
  completed: [],
  cancelled_by_customer: [],
  cancelled_by_shop: [],
  no_show: [],
  rescheduled: ["confirmed"],
  waitlisted: ["confirmed", "cancelled_by_customer", "cancelled_by_shop"],
};

export function allowedBookingTransitions(status: BookingStatus): readonly BookingStatus[] {
  return TRANSITIONS[status];
}

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface BookingTransitionResult {
  booking: Booking;
  auditEvent: AuditEvent;
}

export function transitionBooking(
  booking: Booking,
  to: BookingStatus,
  actorId: EntityId,
  occurredAt: IsoInstant,
): BookingTransitionResult {
  if (!canTransitionBooking(booking.status, to)) {
    throw new DomainError(
      "INVALID_TRANSITION",
      `Booking ${booking.id} cannot transition from ${booking.status} to ${to}.`,
    );
  }

  const from = booking.status;
  const updated: Booking = {
    ...booking,
    status: to,
    updatedAt: occurredAt,
  };

  return {
    booking: updated,
    auditEvent: {
      id: `audit-${booking.id}-${from}-${to}-${occurredAt}`,
      occurredAt,
      actorId,
      action: "booking_status_changed",
      entityType: "booking",
      entityId: booking.id,
      metadata: { from, to },
    },
  };
}
