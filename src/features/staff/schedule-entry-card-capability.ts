export const SCHEDULE_ENTRY_READ_ONLY_MESSAGE =
  "此時段已開始或已設為唯讀，不能再修改註記。";

export type ScheduleEntryEditorCapability =
  | "closed"
  | "editable"
  | "read_only";

export function scheduleEntryEditorCapability(
  editing: boolean,
  canSave: boolean,
): ScheduleEntryEditorCapability {
  if (!editing) return "closed";
  return canSave ? "editable" : "read_only";
}
