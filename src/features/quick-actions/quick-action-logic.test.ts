import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockBookings, mockCalendarBlocks } from "../../data/mock";
import { buildQuickActionSnapshot } from "./quick-action-logic";

describe("quick action snapshot", () => {
  it("builds truthful same-day counts and the next active booking", () => {
    const result = buildQuickActionSnapshot(
      mockBookings,
      mockCalendarBlocks,
      "2026-07-14T04:30:00.000Z",
    );
    assert.equal(result.today.length, 4);
    assert.equal(result.next?.id, "booking-mock-charlie-pending");
    assert.equal(result.blocks.length, 1);
    assert.equal(result.checkedIn.length, 0);
    assert.equal(result.completed.length, 0);
  });
});
