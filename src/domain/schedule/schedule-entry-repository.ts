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
  title: string | null;
  note: string;
  anonymizedAtUtc: string | null;
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

export interface CreateStaffBookingCommand extends CreateBookingCommand {
  actorId: string;
}

export interface CreateManualNoteCommand {
  idempotencyKey: string;
  actorId: string;
  staffMemberId: string;
  slotDate: string;
  slotTime: string;
  title: string;
  note: string;
}

export interface UpdateScheduleEntryNoteCommand {
  actorId: string;
  entryId: string;
  expectedVersion: number;
  note: string;
}

export interface ScheduleEntryQuery {
  fromDate?: string;
  toDate?: string;
}

export interface PublicAvailabilitySlot {
  staffMemberId: string;
  staffLabel: string;
  slotDate: string;
  slotTime: string;
  available: boolean;
}

export interface IssueAnonymizationVerificationCommand {
  actorId: string;
  bookingEntryId: string;
}

export interface AnonymizationVerification {
  verificationId: string;
  bookingEntryId: string;
  expiresAtUtc: string;
}

export interface AnonymizeBookingCommand {
  actorId: string;
  bookingEntryId: string;
  verificationId: string;
  expectedVersion: number;
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
  listAvailability(): Promise<PublicAvailabilitySlot[]>;
  listEntries(query?: ScheduleEntryQuery): Promise<StoredScheduleEntry[]>;
  createCustomerBooking(command: CreateBookingCommand): Promise<ScheduleWriteResult>;
  createStaffBooking(command: CreateStaffBookingCommand): Promise<ScheduleWriteResult>;
  createManualNote(
    command: CreateManualNoteCommand,
  ): Promise<ScheduleWriteResult>;
  updateNote(
    command: UpdateScheduleEntryNoteCommand,
  ): Promise<StoredScheduleEntry>;
  issueAnonymizationVerification(
    command: IssueAnonymizationVerificationCommand,
  ): Promise<AnonymizationVerification>;
  anonymizeBooking(command: AnonymizeBookingCommand): Promise<StoredScheduleEntry>;
}
