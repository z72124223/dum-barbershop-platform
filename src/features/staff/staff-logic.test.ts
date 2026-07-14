import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockBookings, mockBranch, mockCalendarBlocks } from "../../data/mock";
import type { CalendarBlock } from "../../domain";
import { ALL_STAFF, buildTimeline, canPlaceBlock, filterBookings, findNextBooking } from "./staff-logic";

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
});
