import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  MvpBookingScheduleEntry,
  MvpNoteScheduleEntry,
  MvpScheduleEntry,
} from "./schedule-entry";
import { queryPastMvpScheduleEntries } from "./schedule-query";

function booking(
  id: string,
  date: string,
  startTime: string,
  overrides: Partial<MvpBookingScheduleEntry> = {},
): MvpBookingScheduleEntry {
  return {
    id,
    kind: "booking",
    date,
    startTime,
    staffId: "staff-mock-alpha",
    note: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    customerName: `虛構客人 ${id}`,
    phone: "0900-000-001",
    source: "customer",
    ...overrides,
  };
}

function note(
  id: string,
  date: string,
  startTime: string,
  overrides: Partial<MvpNoteScheduleEntry> = {},
): MvpNoteScheduleEntry {
  return {
    id,
    kind: "note",
    date,
    startTime,
    staffId: "staff-mock-alpha",
    note: `虛構註記 ${id}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    title: `提醒 ${id}`,
    source: "staff",
    ...overrides,
  };
}

describe("MVP past schedule query", () => {
  it("uses inclusive date bounds and returns only already-started slots", () => {
    const entries: MvpScheduleEntry[] = [
      booking("before-range", "2026-07-31", "18:00"),
      booking("range-start", "2026-08-01", "10:00"),
      note("today-past", "2026-08-02", "11:59"),
      booking("today-exact", "2026-08-02", "12:00"),
      booking("today-future", "2026-08-02", "12:01"),
      note("after-range", "2026-08-03", "09:00"),
    ];

    const result = queryPastMvpScheduleEntries(entries, {
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      kind: "all",
      now: new Date("2026-08-02T04:00:00.000Z"),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.entries.map((entry) => entry.id), [
      "today-exact",
      "today-past",
      "range-start",
    ]);
  });

  it("composes staff and kind filters", () => {
    const entries: MvpScheduleEntry[] = [
      booking("alpha-booking", "2026-07-29", "10:00"),
      note("alpha-note", "2026-07-29", "11:00"),
      booking("bravo-booking", "2026-07-29", "12:00", {
        staffId: "staff-mock-bravo",
      }),
      note("bravo-note", "2026-07-29", "13:00", {
        staffId: "staff-mock-bravo",
      }),
    ];

    const result = queryPastMvpScheduleEntries(entries, {
      fromDate: "2026-07-29",
      toDate: "2026-07-29",
      staffId: "staff-mock-bravo",
      kind: "booking",
      now: new Date("2026-07-29T08:00:00.000Z"),
    });

    assert.deepEqual(result, {
      ok: true,
      entries: [entries[2]],
    });
  });

  it("sorts newest first without mutating the input", () => {
    const entries: MvpScheduleEntry[] = [
      booking("oldest", "2026-07-27", "18:00"),
      note("newest", "2026-07-29", "14:00"),
      booking("middle", "2026-07-29", "10:00"),
    ];
    const sourceOrder = entries.map((entry) => entry.id);

    const result = queryPastMvpScheduleEntries(entries, {
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
      now: new Date("2026-07-31T00:00:00.000Z"),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.entries.map((entry) => entry.id), [
      "newest",
      "middle",
      "oldest",
    ]);
    assert.deepEqual(entries.map((entry) => entry.id), sourceOrder);
  });

  it("rejects invalid dates and reversed ranges", () => {
    const now = new Date("2026-07-31T00:00:00.000Z");

    assert.deepEqual(
      queryPastMvpScheduleEntries([], {
        fromDate: "2026-02-30",
        toDate: "2026-07-31",
        now,
      }),
      { ok: false, error: "invalid_from_date" },
    );
    assert.deepEqual(
      queryPastMvpScheduleEntries([], {
        fromDate: "2026-07-01",
        toDate: "2026-13-01",
        now,
      }),
      { ok: false, error: "invalid_to_date" },
    );
    assert.deepEqual(
      queryPastMvpScheduleEntries([], {
        fromDate: "2026-08-01",
        toDate: "2026-07-31",
        now,
      }),
      { ok: false, error: "invalid_range" },
    );
  });

  it("uses schedule date and time instead of createdAt for occurrence filtering", () => {
    const scheduledOnJuly30 = booking(
      "scheduled-july-30",
      "2026-07-30",
      "10:00",
      { createdAt: "2026-07-29T15:59:59.999Z" },
    );
    const createdOnJuly30 = booking(
      "created-july-30",
      "2026-07-29",
      "10:00",
      { createdAt: "2026-07-29T16:00:00.000Z" },
    );

    const result = queryPastMvpScheduleEntries(
      [scheduledOnJuly30, createdOnJuly30],
      {
        fromDate: "2026-07-30",
        toDate: "2026-07-30",
        now: new Date("2026-07-31T00:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      ok: true,
      entries: [scheduledOnJuly30],
    });
  });

  it("applies the same-minute cutoff at a UTC-to-Taipei date boundary", () => {
    const entries: MvpScheduleEntry[] = [
      booking("previous-day", "2026-07-29", "23:59"),
      booking("midnight", "2026-07-30", "00:00"),
      booking("after-midnight", "2026-07-30", "00:01"),
    ];

    const result = queryPastMvpScheduleEntries(entries, {
      fromDate: "2026-07-29",
      toDate: "2026-07-30",
      now: new Date("2026-07-29T16:00:00.000Z"),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.entries.map((entry) => entry.id), [
      "midnight",
      "previous-day",
    ]);
  });
});
