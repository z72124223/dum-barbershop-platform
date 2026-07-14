import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError, type Booking } from "../models";
import { canTransitionBooking, transitionBooking } from "./transitions";

const confirmedBooking: Booking = {
  id: "booking-transition-test",
  branchId: "branch-test",
  staffId: "staff-test",
  serviceId: "service-test",
  customerId: "customer-test",
  startsAt: "2026-07-14T02:00:00.000Z",
  endsAt: "2026-07-14T03:00:00.000Z",
  status: "confirmed",
  depositStatus: "unpaid",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
  source: "mock_seed",
};

describe("booking status transitions", () => {
  it("allows the checked-in to in-service to completed path", () => {
    assert.equal(canTransitionBooking("confirmed", "checked_in"), true);
    assert.equal(canTransitionBooking("checked_in", "in_service"), true);
    assert.equal(canTransitionBooking("in_service", "completed"), true);
  });

  it("returns an audit event and does not change deposit state", () => {
    const result = transitionBooking(
      confirmedBooking,
      "checked_in",
      "staff-actor",
      "2026-07-14T01:55:00.000Z",
    );
    assert.equal(result.booking.status, "checked_in");
    assert.equal(result.booking.depositStatus, "unpaid");
    assert.deepEqual(result.auditEvent.metadata, { from: "confirmed", to: "checked_in" });
    assert.equal(result.auditEvent.action, "booking_status_changed");
  });

  it("rejects illegal direct completion", () => {
    assert.throws(() =>
      transitionBooking(
        confirmedBooking,
        "completed",
        "staff-actor",
        "2026-07-14T02:00:00.000Z",
      ),
      DomainError,
    );
  });

  it("keeps terminal states terminal", () => {
    assert.equal(canTransitionBooking("completed", "confirmed"), false);
    assert.equal(canTransitionBooking("cancelled_by_customer", "confirmed"), false);
  });
});
