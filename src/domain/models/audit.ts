import type { EntityId, IsoInstant } from "./common";

export type AuditAction =
  | "booking_created"
  | "booking_status_changed"
  | "booking_rescheduled"
  | "integration_operation_changed"
  | "calendar_block_created";

export interface AuditEvent {
  id: EntityId;
  occurredAt: IsoInstant;
  actorId: EntityId;
  action: AuditAction;
  entityType: "booking" | "calendar_block" | "integration_operation";
  entityId: EntityId;
  metadata: Record<string, string>;
}
