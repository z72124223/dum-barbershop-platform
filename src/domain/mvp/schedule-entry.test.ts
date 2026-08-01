import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterMvpScheduleEntriesByStaff,
  hasMvpBookingConflict,
  isMvpScheduleEntryDate,
  isMvpScheduleEntryTime,
  parseMvpScheduleEntries,
  sortMvpScheduleEntries,
  validateMvpScheduleEntry,
  type MvpBookingScheduleEntry,
  type MvpNoteScheduleEntry,
} from "./schedule-entry";

const booking: MvpBookingScheduleEntry = {
  id: "booking-one",
  kind: "booking",
  date: "2026-07-29",
  startTime: "10:00",
  staffId: "staff-mock-alpha",
  note: "確認瀏海長度",
  createdAt: "2026-07-29T01:00:00.000Z",
  customerName: "虛構客人一號",
  phone: "0900-000-001",
  source: "customer",
};

const note: MvpNoteScheduleEntry = {
  id: "note-one",
  kind: "note",
  date: "2026-07-29",
  startTime: "10:00",
  staffId: "staff-mock-alpha",
  note: "先確認現場用品",
  createdAt: "2026-07-29T01:05:00.000Z",
  title: "開店提醒",
  source: "staff",
};

describe("MVP schedule entry domain", () => {
  it("normalizes accepted text input", () => {
    const result = validateMvpScheduleEntry({
      ...booking,
      id: " booking-two ",
      customerName: " 虛構客人二號 ",
      phone: " 0900-000-002 ",
      note: " 需要安靜座位 ",
      staffId: " staff-mock-bravo ",
    });

    assert.equal(result.ok, true);
    if (!result.ok || result.entry.kind !== "booking") return;
    assert.equal(result.entry.id, "booking-two");
    assert.equal(result.entry.customerName, "虛構客人二號");
    assert.equal(result.entry.phone, "0900-000-002");
    assert.equal(result.entry.note, "需要安靜座位");
    assert.equal(result.entry.staffId, "staff-mock-bravo");
  });

  it("rejects blank text fields", () => {
    const bookingWithoutNote = validateMvpScheduleEntry({ ...booking, note: "   " });
    assert.equal(bookingWithoutNote.ok, true);
    if (bookingWithoutNote.ok) assert.equal(bookingWithoutNote.entry.note, "");
    assert.deepEqual(
      validateMvpScheduleEntry({ ...note, note: "   " }),
      { ok: false, error: "empty_note" },
    );
    assert.deepEqual(
      validateMvpScheduleEntry({ ...note, title: "\n\t" }),
      { ok: false, error: "empty_title" },
    );
    assert.deepEqual(
      validateMvpScheduleEntry({ ...booking, customerName: "" }),
      { ok: false, error: "empty_customer_name" },
    );
  });

  it("validates real calendar dates and 24-hour times", () => {
    assert.equal(isMvpScheduleEntryDate("2024-02-29"), true);
    assert.equal(isMvpScheduleEntryDate("2025-02-29"), false);
    assert.equal(isMvpScheduleEntryTime("00:00"), true);
    assert.equal(isMvpScheduleEntryTime("23:59"), true);
    assert.equal(isMvpScheduleEntryTime("24:00"), false);
  });

  it("sorts by date and time without mutating the source", () => {
    const later = { ...booking, id: "booking-later", startTime: "11:00" };
    const source = [later, note, booking];
    const result = sortMvpScheduleEntries(source);

    assert.deepEqual(
      result.map((entry) => entry.id),
      ["booking-one", "note-one", "booking-later"],
    );
    assert.deepEqual(
      source.map((entry) => entry.id),
      ["booking-later", "note-one", "booking-one"],
    );
  });

  it("filters entries by staff", () => {
    const bravo = { ...booking, id: "booking-bravo", staffId: "staff-mock-bravo" };
    const result = filterMvpScheduleEntriesByStaff(
      [booking, note, bravo],
      " staff-mock-alpha ",
    );
    assert.deepEqual(result.map((entry) => entry.id), ["booking-one", "note-one"]);
  });

  it("detects booking conflicts while notes remain non-blocking", () => {
    const candidate = { ...booking, id: "booking-candidate" };
    assert.equal(hasMvpBookingConflict([booking], candidate), true);
    assert.equal(hasMvpBookingConflict([note], candidate), false);
    assert.equal(
      hasMvpBookingConflict(
        [booking],
        { ...candidate, staffId: "staff-mock-bravo" },
      ),
      false,
    );
    assert.equal(hasMvpBookingConflict([booking], booking, booking.id), false);
  });

  it("rejects malformed arrays without leaking partial data", () => {
    assert.deepEqual(parseMvpScheduleEntries([booking, note]), [booking, note]);
    assert.equal(parseMvpScheduleEntries([booking, { ...note, source: "customer" }]), null);
    assert.equal(parseMvpScheduleEntries({ entries: [booking] }), null);
  });

  it("requires createdAt to carry an explicit timezone", () => {
    assert.deepEqual(
      validateMvpScheduleEntry({
        ...booking,
        createdAt: "2026-07-29T10:00:00",
      }),
      { ok: false, error: "invalid_created_at" },
    );
    assert.deepEqual(
      validateMvpScheduleEntry({
        ...booking,
        createdAt: "2026-07-29",
      }),
      { ok: false, error: "invalid_created_at" },
    );

    const withOffset = validateMvpScheduleEntry({
      ...booking,
      createdAt: "2026-07-29T10:00:00+08:00",
    });
    assert.equal(withOffset.ok, true);
    if (withOffset.ok) {
      assert.equal(withOffset.entry.createdAt, "2026-07-29T02:00:00.000Z");
    }
  });
});
