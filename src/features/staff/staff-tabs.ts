export const WORKSPACE_TABS = ["agenda", "history", "add"] as const;

export type WorkspaceTab = typeof WORKSPACE_TABS[number];

export function workspaceTabId(tab: WorkspaceTab): string {
  return `staff-workspace-tab-${tab}`;
}

export function workspaceTabPanelId(tab: WorkspaceTab): string {
  return `staff-workspace-panel-${tab}`;
}

export function workspaceTabAfterKey(
  current: WorkspaceTab,
  key: string,
): WorkspaceTab | null {
  const currentIndex = WORKSPACE_TABS.indexOf(current);
  if (key === "Home") return WORKSPACE_TABS[0];
  if (key === "End") return WORKSPACE_TABS[WORKSPACE_TABS.length - 1];
  if (key === "ArrowRight") {
    return WORKSPACE_TABS[(currentIndex + 1) % WORKSPACE_TABS.length];
  }
  if (key === "ArrowLeft") {
    return WORKSPACE_TABS[
      (currentIndex - 1 + WORKSPACE_TABS.length) % WORKSPACE_TABS.length
    ];
  }
  return null;
}
