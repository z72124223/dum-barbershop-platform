import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WORKSPACE_TABS,
  workspaceTabAfterKey,
  workspaceTabId,
  workspaceTabPanelId,
} from "./staff-tabs";

describe("Staff workspace tabs", () => {
  it("wraps ArrowLeft and ArrowRight through the tab order", () => {
    assert.equal(workspaceTabAfterKey("agenda", "ArrowLeft"), "add");
    assert.equal(workspaceTabAfterKey("agenda", "ArrowRight"), "history");
    assert.equal(workspaceTabAfterKey("add", "ArrowRight"), "agenda");
  });

  it("moves Home and End to the first and last tab", () => {
    assert.equal(workspaceTabAfterKey("history", "Home"), "agenda");
    assert.equal(workspaceTabAfterKey("history", "End"), "add");
  });

  it("leaves Tab, Enter, and Space to native button behavior", () => {
    for (const key of ["Tab", "Enter", " "]) {
      assert.equal(workspaceTabAfterKey("history", key), null);
    }
  });

  it("provides stable, unique tab and panel relationships", () => {
    assert.equal(new Set(WORKSPACE_TABS.map(workspaceTabId)).size, WORKSPACE_TABS.length);
    assert.equal(
      new Set(WORKSPACE_TABS.map(workspaceTabPanelId)).size,
      WORKSPACE_TABS.length,
    );
    for (const tab of WORKSPACE_TABS) {
      assert.match(workspaceTabId(tab), new RegExp(`${tab}$`));
      assert.match(workspaceTabPanelId(tab), new RegExp(`${tab}$`));
    }
  });
});
