export type ScheduleEntryKind = "booking" | "note";
export type ScheduleEntrySource = "customer" | "staff";

export interface ScheduleStaffMember {
  id: string;
  role: "owner" | "staff";
  publicLabel: string;
  active: boolean;
}

export interface StoredScheduleEntry {
  id: string;
  kind: ScheduleEntryKind;
  staffMemberId: string;
  serviceDefinitionId: string | null;
  slotDate: string;
  slotTimeMinutes: number;
  slotStartsAtUtc: string;
  durationMinutes: number | null;
  status: "confirmed" | null;
  customerName: string | null;
  customerPhone: string | null;
  note: string;
  source: ScheduleEntrySource;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateBookingCommand {
  idempotencyKey: string;
  staffMemberId: string;
  slotDate: string;
  slotTime: string;
  customerName: string;
  customerPhone: string;
  note?: string;
}

export interface CreateManualNoteCommand {
  idempotencyKey: string;
  staffMemberId: string;
  slotDate: string;
  slotTime: string;
  note: string;
}

export interface UpdateScheduleEntryNoteCommand {
  entryId: string;
  expectedVersion: number;
  note: string;
}

export interface ScheduleWriteResult {
  entryId: string;
  kind: ScheduleEntryKind;
  version: number;
  replayed: boolean;
}

export type ScheduleDataErrorCode =
  | "invalid_request"
  | "slot_unavailable"
  | "idempotency_conflict"
  | "version_conflict"
  | "not_found"
  | "temporarily_unavailable"
  | "storage_failure";

const SAFE_ERROR_MESSAGES: Record<ScheduleDataErrorCode, string> = {
  invalid_request: "The schedule request is invalid.",
  slot_unavailable: "The selected schedule slot is unavailable.",
  idempotency_conflict: "The request key was already used for different data.",
  version_conflict: "The schedule entry was updated by another request.",
  not_found: "The schedule entry was not found.",
  temporarily_unavailable: "The schedule service is temporarily unavailable. Please retry.",
  storage_failure: "The schedule service could not complete the request.",
};

export class ScheduleDataError extends Error {
  readonly name = "ScheduleDataError";

  constructor(
    readonly code: ScheduleDataErrorCode,
    readonly status: 400 | 404 | 409 | 500 | 503,
    readonly retryable = false,
  ) {
    super(SAFE_ERROR_MESSAGES[code]);
  }
}

export interface SafeScheduleErrorResponse {
  status: 400 | 404 | 409 | 500 | 503;
  body: {
    error: ScheduleDataErrorCode;
    message: string;
    retryable: boolean;
  };
}

export function toSafeScheduleErrorResponse(
  error: unknown,
): SafeScheduleErrorResponse {
  const safeError = error instanceof ScheduleDataError
    ? error
    : new ScheduleDataError("storage_failure", 500);

  return {
    status: safeError.status,
    body: {
      error: safeError.code,
      message: safeError.message,
      retryable: safeError.retryable,
    },
  };
}

export interface ScheduleEntryRepository {
  listStaffMembers(): Promise<ScheduleStaffMember[]>;
  listEntries(): Promise<StoredScheduleEntry[]>;
  createCustomerBooking(command: CreateBookingCommand): Promise<ScheduleWriteResult>;
  createStaffBooking(command: CreateBookingCommand): Promise<ScheduleWriteResult>;
  createManualNote(
    command: CreateManualNoteCommand,
  ): Promise<ScheduleWriteResult>;
  updateNote(
    command: UpdateScheduleEntryNoteCommand,
  ): Promise<StoredScheduleEntry>;
}
