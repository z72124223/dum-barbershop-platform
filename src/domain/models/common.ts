export type EntityId = string;
export type IsoDate = `${number}-${number}-${number}`;
export type IsoInstant = string;
export type LocalTime = `${number}:${number}`;

export const DEFAULT_TIME_ZONE = "Asia/Taipei" as const;

export type DomainErrorCode =
  | "BRANCH_NOT_FOUND"
  | "STAFF_NOT_FOUND"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_NOT_SUPPORTED"
  | "INVALID_DATE"
  | "INVALID_TIME_RANGE"
  | "INVALID_TRANSITION"
  | "INVALID_RESCHEDULE"
  | "INVALID_INTEGRATION_OPERATION"
  | "BOOKING_CONFLICT"
  | "BOOKING_NOT_FOUND"
  | "CUSTOMER_NOT_FOUND";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
