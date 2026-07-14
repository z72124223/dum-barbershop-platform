import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Booking } from "../models";
import {
  rankSafeWaitlist,
  requestCustomerCancellation,
  rescheduleBooking,
} from "./lifecycle";

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-original",
    branchId: "branch-mock-taipei",
    staffId: "staff-mock-alpha",
    serviceId: "service-mock-cut",
    customerId: "customer-mock-one",
    startsAt: "2026-07-14T03:00:00.000Z",
    endsAt: "2026-07-14T04:00:00.000Z",
    status: "confirmed",
    depositStatus: "not_required",
    createdAt: "2026-07-10T02:00:00.000Z",
    updatedAt: "2026-07-10T02:00:00.000Z",
    source: "mock_seed",
    ...overrides,
  };
}

describe("booking lifecycle", () => {
  it("preserves a two-way reschedule lineage and audit trail", () => {
    const result = rescheduleBooking(
      booking(),
      booking({
        id: "booking-replacement",
        startsAt: "2026-07-15T05:00:00.000Z",
        endsAt: "2026-07-15T06:00:00.000Z",
        status: "pending",
      }),
      "staff-mock-alpha",
      "2026-07-14T08:00:00.000Z",
    );

    assert.equal(result.original.status, "rescheduled");
    assert.equal(result.original.rescheduledToBookingId, "booking-replacement");
    assert.equal(result.replacement.status, "confirmed");
    assert.equal(result.replacement.rescheduledFromBookingId, "booking-original");
    assert.equal(result.auditEvents.length, 2);
  });

  it("cancels eligible customer bookings through the status engine", () => {
    const result = requestCustomerCancellation(
      booking(),
      "customer-mock-one",
      "2026-07-14T08:00:00.000Z",
    );
    assert.equal(result.booking.status, "cancelled_by_customer");
    assert.equal(result.auditEvent.metadata.to, "cancelled_by_customer");
  });

  it("ranks only pending and waitlisted records without displacing confirmed bookings", () => {
    const ranked = rankSafeWaitlist([
      booking({ id: "confirmed", status: "confirmed", depositStatus: "paid" }),
      booking({ id: "older-unpaid", status: "waitlisted", createdAt: "2026-07-10T01:00:00.000Z" }),
      booking({ id: "newer-paid", status: "pending", depositStatus: "paid", createdAt: "2026-07-10T03:00:00.000Z" }),
    ]);
    assert.deepEqual(ranked.map((item) => item.id), ["newer-paid", "older-unpaid"]);
  });
});
