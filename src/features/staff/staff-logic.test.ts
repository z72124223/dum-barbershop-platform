import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockBookings, mockBranch, mockCalendarBlocks, mockCustomers } from "../../data/mock";
import type { CalendarBlock } from "../../domain";
import {
  ALL_STAFF,
  buildTimeline,
  buildWeekDays,
  canPlaceBlock,
  canStaffRole,
  filterMockCustomersForIdentity,
  filterBookings,
  findNextBooking,
  isBookingInMockIdentityScope,
  resolveMockStaffFilter,
} from "./staff-logic";

function block(overrides: Partial<CalendarBlock> = {}): CalendarBlock {
  return {
    id: "block-test-staff",
    branchId: mockBranch.id,
    staffId: "staff-mock-alpha",
    startsAt: "2026-07-14T03:15:00.000Z",
    endsAt: "2026-07-14T03:45:00.000Z",
    kind: "blocked",
    reason: "Fictional block test",
    source: "mock_staff_action",
    ...overrides,
  };
}

describe("staff workspace logic", () => {
  it("filters one staff schedule without changing chronological order", () => {
    const result = filterBookings(mockBookings, "staff-mock-alpha");
    assert.ok(result.every((booking) => booking.staffId === "staff-mock-alpha"));
    assert.deepEqual(result.map((booking) => booking.id), ["booking-mock-alpha-1100", "booking-mock-alpha-waitlist"]);
  });

  it("finds the next active customer and ignores a waitlist entry", () => {
    const result = findNextBooking(mockBookings, ALL_STAFF, "2026-07-14T04:30:00.000Z");
    assert.equal(result?.id, "booking-mock-charlie-pending");
  });

  it("rejects a block over an existing booking for the same staff", () => {
    assert.equal(canPlaceBlock(block(), mockBookings, mockCalendarBlocks), false);
  });

  it("allows the same block time for a different staff member", () => {
    assert.equal(canPlaceBlock(block({ staffId: "staff-mock-charlie" }), mockBookings, mockCalendarBlocks), true);
  });

  it("combines bookings and blocks into one sorted full-day timeline", () => {
    const result = buildTimeline(mockBookings, mockCalendarBlocks, ALL_STAFF);
    assert.ok(result.some((item) => item.kind === "block"));
    assert.equal(result[0]?.startsAt, "2026-07-14T03:00:00.000Z");
  });

  it("groups a seven-day schedule without leaking other weeks", () => {
    const result = buildWeekDays("2026-07-14", mockBookings, mockCalendarBlocks, ALL_STAFF);
    assert.equal(result.length, 7);
    assert.equal(result[0]?.bookings.length, 4);
    assert.equal(result[1]?.bookings.length, 0);
  });

  it("enforces local role-preview permissions", () => {
    assert.equal(canStaffRole("barber", "booking:write"), true);
    assert.equal(canStaffRole("barber", "settings:preview"), false);
    assert.equal(canStaffRole("read_only", "booking:write"), false);
    assert.equal(canStaffRole("owner", "integration:read"), true);
  });

  it("locks the mock barber identity to its linked staff record", () => {
    assert.equal(resolveMockStaffFilter("barber", "staff-mock-bravo", ALL_STAFF), "staff-mock-bravo");
    assert.equal(resolveMockStaffFilter("barber", undefined, ALL_STAFF), null);
    assert.equal(resolveMockStaffFilter("manager", undefined, "staff-mock-alpha"), "staff-mock-alpha");
  });

  it("keeps mock barber booking actions inside the linked staff scope", () => {
    const alphaBooking = mockBookings.find((booking) => booking.staffId === "staff-mock-alpha");
    const bravoBooking = mockBookings.find((booking) => booking.staffId === "staff-mock-bravo");
    assert.ok(alphaBooking);
    assert.ok(bravoBooking);
    assert.equal(isBookingInMockIdentityScope(alphaBooking, "barber", "staff-mock-bravo"), false);
    assert.equal(isBookingInMockIdentityScope(bravoBooking, "barber", "staff-mock-bravo"), true);
    assert.equal(isBookingInMockIdentityScope(alphaBooking, "reception", undefined), true);
  });

  it("shows a mock barber only customers linked to that staff record", () => {
    const barberCustomers = filterMockCustomersForIdentity(mockCustomers, "barber", "staff-mock-bravo");
    assert.deepEqual(barberCustomers.map((customer) => customer.id), ["customer-mock-two"]);
    assert.equal(filterMockCustomersForIdentity(mockCustomers, "barber", undefined).length, 0);
    assert.equal(filterMockCustomersForIdentity(mockCustomers, "owner", "staff-mock-alpha").length, mockCustomers.length);
  });
});
