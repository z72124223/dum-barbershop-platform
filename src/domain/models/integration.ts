import type { EntityId, IsoInstant } from "./common";

export type IntegrationProvider =
  | "booking"
  | "calendar"
  | "notification"
  | "payment"
  | "membership"
  | "identity"
  | "line";

export type IntegrationMode = "mock" | "disabled";

export type IntegrationOperationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "retry_scheduled"
  | "conflict"
  | "timed_out"
  | "partial_failure"
  | "disabled";

export interface IntegrationOperation {
  id: EntityId;
  provider: IntegrationProvider;
  mode: IntegrationMode;
  action: string;
  entityId?: EntityId;
  idempotencyKey: string;
  attempt: number;
  maxAttempts: number;
  status: IntegrationOperationStatus;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
  errorCode?: string;
}

export interface CalendarSyncMetadata {
  bookingId: EntityId;
  direction: "platform_to_calendar" | "calendar_to_platform";
  status: IntegrationOperationStatus;
  revision: number;
  externalEventId?: string;
  lastSyncedAt?: IsoInstant;
}
