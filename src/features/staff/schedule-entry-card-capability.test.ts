import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  scheduleEntryEditorCapability,
  SCHEDULE_ENTRY_READ_ONLY_MESSAGE,
} from "./schedule-entry-card-capability";

describe("Schedule entry editor capability", () => {
  it("becomes explicitly read-only when save capability disappears mid-edit", () => {
    assert.equal(scheduleEntryEditorCapability(true, true), "editable");
    assert.equal(scheduleEntryEditorCapability(true, false), "read_only");
    assert.match(SCHEDULE_ENTRY_READ_ONLY_MESSAGE, /唯讀/);
  });

  it("keeps a closed editor closed regardless of capability", () => {
    assert.equal(scheduleEntryEditorCapability(false, true), "closed");
    assert.equal(scheduleEntryEditorCapability(false, false), "closed");
  });
});
