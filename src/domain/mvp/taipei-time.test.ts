import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addTaipeiCalendarDays,
  defaultTaipeiHistoryRange,
  getTaipeiClockSnapshot,
  isTaipeiSlotPast,
  taipeiToday,
  upcomingTaipeiDates,
} from "./taipei-time";

describe("MVP Asia/Taipei time helpers", () => {
  it("changes calendar date exactly at the UTC-to-Taipei midnight boundary", () => {
    const beforeMidnight = new Date("2026-07-29T15:59:59.999Z");
    const atMidnight = new Date("2026-07-29T16:00:00.000Z");

    assert.deepEqual(getTaipeiClockSnapshot(beforeMidnight), {
      date: "2026-07-29",
      time: "23:59",
    });
    assert.deepEqual(getTaipeiClockSnapshot(atMidnight), {
      date: "2026-07-30",
      time: "00:00",
    });
    assert.equal(taipeiToday(beforeMidnight), "2026-07-29");
    assert.equal(taipeiToday(atMidnight), "2026-07-30");
  });

  it("moves into the next year at Taipei midnight", () => {
    assert.deepEqual(
      getTaipeiClockSnapshot(new Date("2026-12-31T16:00:00.000Z")),
      { date: "2027-01-01", time: "00:00" },
    );
  });

  it("adds Taipei calendar days across leap days and year boundaries", () => {
    assert.equal(addTaipeiCalendarDays("2028-02-28", 1), "2028-02-29");
    assert.equal(addTaipeiCalendarDays("2028-02-28", 2), "2028-03-01");
    assert.equal(addTaipeiCalendarDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addTaipeiCalendarDays("2027-01-01", -1), "2026-12-31");
    assert.throws(() => addTaipeiCalendarDays("2026-02-30", 1), TypeError);
    assert.throws(() => addTaipeiCalendarDays("2026-07-29", 1.5), TypeError);
  });

  it("builds upcoming dates without skipping leap or month boundaries", () => {
    assert.deepEqual(upcomingTaipeiDates(4, "2028-02-28"), [
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
      "2028-03-02",
    ]);
    assert.deepEqual(upcomingTaipeiDates(3, "2026-12-31"), [
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
    assert.throws(() => upcomingTaipeiDates(-1, "2026-07-29"), TypeError);
  });

  it("treats an exact current Taipei minute as already started", () => {
    const now = new Date("2026-07-29T02:30:00.000Z");

    assert.equal(isTaipeiSlotPast("2026-07-28", "23:59", now), true);
    assert.equal(isTaipeiSlotPast("2026-07-29", "10:00", now), true);
    assert.equal(isTaipeiSlotPast("2026-07-29", "10:30", now), true);
    assert.equal(isTaipeiSlotPast("2026-07-29", "10:31", now), false);
    assert.equal(isTaipeiSlotPast("2026-07-30", "00:00", now), false);
    assert.equal(isTaipeiSlotPast("2026-02-30", "10:00", now), false);
    assert.equal(isTaipeiSlotPast("2026-07-29", "24:00", now), false);
  });

  it("returns an inclusive default history range in Taipei calendar days", () => {
    const now = new Date("2026-07-29T16:00:00.000Z");

    assert.deepEqual(defaultTaipeiHistoryRange(now, 30), {
      fromDate: "2026-07-01",
      toDate: "2026-07-30",
    });
    assert.deepEqual(defaultTaipeiHistoryRange(now, 1), {
      fromDate: "2026-07-30",
      toDate: "2026-07-30",
    });
    assert.throws(() => defaultTaipeiHistoryRange(now, 0), TypeError);
    assert.throws(
      () => defaultTaipeiHistoryRange(new Date("invalid"), 30),
      TypeError,
    );
  });
});
