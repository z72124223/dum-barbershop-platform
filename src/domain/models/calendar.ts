import type { EntityId, IsoInstant } from "./common";

export interface CalendarBlock {
  id: EntityId;
  branchId: EntityId;
  staffId: EntityId;
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  kind: "blocked" | "leave";
  reason: string;
  source: "mock_staff_action" | "mock_calendar" | "mock_seed";
}
