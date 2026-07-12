import type { BookingStatus } from "./models";

const transitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled_by_customer", "cancelled_by_shop", "waitlisted"],
  confirmed: ["checked_in", "cancelled_by_customer", "cancelled_by_shop", "no_show", "rescheduled"],
  checked_in: ["in_service", "cancelled_by_shop"],
  in_service: ["completed"],
  completed: [],
  cancelled_by_customer: [],
  cancelled_by_shop: [],
  no_show: [],
  rescheduled: ["confirmed"],
  waitlisted: ["confirmed", "cancelled_by_customer", "cancelled_by_shop"]
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return transitions[from].includes(to);
}

export function transitionBooking(from: BookingStatus, to: BookingStatus): BookingStatus {
  if (!canTransitionBooking(from, to)) {
    throw new Error(`Invalid mock booking transition: ${from} → ${to}`);
  }
  return to;
}
