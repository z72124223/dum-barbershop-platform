import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockBookings, mockBranch, mockCalendarBlocks, mockServices, mockStaff } from "../../data/mock";
import { ANY_STAFF, calculateBookingOptions } from "./booking-logic";

const context = {
  branches: [mockBranch],
  staff: mockStaff,
  services: mockServices,
  bookings: mockBookings,
  blocks: mockCalendarBlocks,
};

describe("calculateBookingOptions", () => {
  it("assigns every no-preference option to one actual staff member", () => {
    const result = calculateBookingOptions({
      branchId: mockBranch.id,
      serviceId: "service-mock-cut",
      staffChoice: ANY_STAFF,
      date: "2026-07-14",
    }, context);
    assert.ok(result.slots.length > 0);
    assert.ok(result.slots.every((slot) => mockStaff.some((staff) => staff.id === slot.staffId)));
  });

  it("collapses the same time across staff into one earliest assignment", () => {
    const result = calculateBookingOptions({
      branchId: mockBranch.id,
      serviceId: "service-mock-cut",
      staffChoice: ANY_STAFF,
      date: "2026-07-15",
    }, context);
    assert.equal(new Set(result.slots.map((slot) => slot.startsAt)).size, result.slots.length);
  });

  it("reports an unsupported selected staff and service combination", () => {
    const result = calculateBookingOptions({
      branchId: mockBranch.id,
      serviceId: "service-mock-texture",
      staffChoice: "staff-mock-charlie",
      date: "2026-07-14",
    }, context);
    assert.deepEqual(result.slots, []);
    assert.equal(result.emptyReason, "service_not_supported");
  });
});
