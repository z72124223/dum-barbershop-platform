import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockMvpScheduleEntries } from "./mvp";

describe("MVP mock schedule entries", () => {
  it("uses the injected base date for deterministic fixtures", () => {
    const entries = createMockMvpScheduleEntries("2026-08-01");
    assert.equal(entries.length, 4);
    assert.ok(entries.every((entry) => entry.date === "2026-08-01"));
    assert.deepEqual(
      [...new Set(entries.map((entry) => entry.staffId))].sort(),
      ["staff-mock-alpha", "staff-mock-bravo"],
    );
  });

  it("gives each mock staff member one booking and one note", () => {
    const entries = createMockMvpScheduleEntries("2026-08-01");
    for (const staffId of ["staff-mock-alpha", "staff-mock-bravo"]) {
      const staffEntries = entries.filter((entry) => entry.staffId === staffId);
      assert.deepEqual(
        staffEntries.map((entry) => entry.kind).sort(),
        ["booking", "note"],
      );
    }
  });

  it("rejects invalid injected dates", () => {
    assert.throws(
      () => createMockMvpScheduleEntries("2026-02-30"),
      TypeError,
    );
  });
});
