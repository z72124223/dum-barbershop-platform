import { createHash, randomUUID } from "node:crypto";
import {
  addTaipeiCalendarDays,
  getTaipeiClockSnapshot,
  isTaipeiCalendarDate,
  isTaipeiClockTime,
  isTaipeiSlotPast,
  taipeiSlotDateTime,
} from "../../domain/mvp/taipei-time";
import {
  ScheduleDataError,
  type AnonymizationVerification,
  type AnonymizeBookingCommand,
  type CreateBookingCommand,
  type CreateManualNoteCommand,
  type CreateStaffBookingCommand,
  type IssueAnonymizationVerificationCommand,
  type PublicAvailabilitySlot,
  type ScheduleEntryQuery,
  type ScheduleEntryKind,
  type ScheduleEntryRepository,
  type ScheduleEntrySource,
  type ScheduleStaffMember,
  type ScheduleWriteResult,
  type StoredScheduleEntry,
  type UpdateScheduleEntryNoteCommand,
} from "../../domain/schedule";
import {
  APPROVED_BOOKING_DAYS,
  APPROVED_FIRST_SLOT_MINUTES,
  APPROVED_LAST_SLOT_MINUTES,
  APPROVED_SLOT_DURATION_MINUTES,
  provisionApprovedScheduleConfig,
} from "./approved-config";
import {
  openControlledSqliteConnection,
  type ControlledSqliteConnection,
} from "./connection";
import { applyScheduleMigrations } from "./migrations";

const BOOKING_IDEMPOTENCY_SCOPE = "schedule.booking.create";
const NOTE_IDEMPOTENCY_SCOPE = "schedule.note.create";
const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1_000;
const ANONYMIZATION_VERIFICATION_TTL_MS = 15 * 60 * 1_000;

interface RepositoryOptions {
  clock?: () => Date;
}

interface StaffRow {
  id: string;
  role: "owner" | "staff";
  public_label: string;
  is_active: number;
}

interface ScheduleEntryRow {
  id: string;
  kind: ScheduleEntryKind;
  staff_member_id: string;
  service_definition_id: string | null;
  slot_date: string;
  slot_time_minutes: number;
  slot_starts_at_utc: string;
  duration_minutes: number | null;
  status: "confirmed" | null;
  customer_name: string | null;
  customer_phone: string | null;
  title_text: string | null;
  note_text: string;
  anonymized_at_utc: string | null;
  source: "customer" | "staff";
  version: number;
  created_at_utc: string;
  updated_at_utc: string;
}

interface IdempotencyRow {
  request_hash: string;
  resource_kind: ScheduleEntryKind;
  resource_id: string;
  result_json: string;
}

interface CanonicalSlot {
  date: string;
  time: string;
  minutes: number;
  startsAtUtc: string;
}

interface CanonicalBooking {
  idempotencyKey: string;
  staffMemberId: string;
  slot: CanonicalSlot;
  customerName: string;
  customerPhone: string;
  note: string;
  source: "customer" | "staff";
  actorId: string | null;
}

interface CanonicalManualNote {
  idempotencyKey: string;
  actorId: string;
  staffMemberId: string;
  slot: CanonicalSlot;
  title: string;
  note: string;
}

interface MinimalStoredResult {
  entryId: string;
  kind: ScheduleEntryKind;
  version: number;
}

export interface SqliteScheduleStore {
  repository: ScheduleEntryRepository;
  close(): void;
}

function requireString(
  value: unknown,
  options: { allowEmpty?: boolean; max: number },
): string {
  if (typeof value !== "string") {
    throw new ScheduleDataError("invalid_request", 400);
  }
  const normalized = value.trim();
  if ((!options.allowEmpty && !normalized) || normalized.length > options.max) {
    throw new ScheduleDataError("invalid_request", 400);
  }
  return normalized;
}

function canonicalizeSlot(slotDate: unknown, slotTime: unknown): CanonicalSlot {
  const date = requireString(slotDate, { max: 10 });
  const time = requireString(slotTime, { max: 5 });
  if (!isTaipeiCalendarDate(date) || !isTaipeiClockTime(time)) {
    throw new ScheduleDataError("invalid_request", 400);
  }

  const [hours, minutesPart] = time.split(":").map(Number);
  const minutes = hours * 60 + minutesPart;
  if (
    minutesPart !== 0
    || minutes < APPROVED_FIRST_SLOT_MINUTES
    || minutes > APPROVED_LAST_SLOT_MINUTES
    || minutes % APPROVED_SLOT_DURATION_MINUTES !== 0
  ) {
    throw new ScheduleDataError("invalid_request", 400);
  }

  return {
    date,
    time,
    minutes,
    startsAtUtc: new Date(taipeiSlotDateTime(date, time)).toISOString(),
  };
}

function canonicalizeBooking(
  command: CreateBookingCommand | CreateStaffBookingCommand,
  source: ScheduleEntrySource,
): CanonicalBooking {
  if (source !== "customer" && source !== "staff") {
    throw new ScheduleDataError("invalid_request", 400);
  }
  return {
    idempotencyKey: requireString(command.idempotencyKey, { max: 200 }),
    staffMemberId: requireString(command.staffMemberId, { max: 200 }),
    slot: canonicalizeSlot(command.slotDate, command.slotTime),
    customerName: requireString(command.customerName, { max: 100 }),
    customerPhone: requireString(command.customerPhone, { max: 50 }),
    note: requireString(command.note ?? "", { allowEmpty: true, max: 2_000 }),
    source,
    actorId: source === "staff"
      ? requireString((command as CreateStaffBookingCommand).actorId, { max: 200 })
      : null,
  };
}

function canonicalizeManualNote(
  command: CreateManualNoteCommand,
): CanonicalManualNote {
  return {
    idempotencyKey: requireString(command.idempotencyKey, { max: 200 }),
    actorId: requireString(command.actorId, { max: 200 }),
    staffMemberId: requireString(command.staffMemberId, { max: 200 }),
    slot: canonicalizeSlot(command.slotDate, command.slotTime),
    title: requireString(command.title, { max: 100 }),
    note: requireString(command.note, { max: 2_000 }),
  };
}

function hashCanonicalValue(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function bookingRequestHash(command: CanonicalBooking): string {
  return hashCanonicalValue({
    staffMemberId: command.staffMemberId,
    slotDate: command.slot.date,
    slotTimeMinutes: command.slot.minutes,
    customerName: command.customerName,
    customerPhone: command.customerPhone,
    note: command.note,
    source: command.source,
    actorId: command.actorId,
  });
}

function noteRequestHash(command: CanonicalManualNote): string {
  return hashCanonicalValue({
    actorId: command.actorId,
    staffMemberId: command.staffMemberId,
    slotDate: command.slot.date,
    slotTimeMinutes: command.slot.minutes,
    title: command.title,
    note: command.note,
  });
}

function weekdayForTaipeiDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function assertOperationalSlot(
  database: ControlledSqliteConnection,
  staffMemberId: string,
  slot: CanonicalSlot,
  now: Date,
): void {
  const clock = getTaipeiClockSnapshot(now);
  const finalDate = addTaipeiCalendarDays(
    clock.date,
    APPROVED_BOOKING_DAYS - 1,
  );
  if (
    slot.date < clock.date
    || slot.date > finalDate
    || isTaipeiSlotPast(slot.date, slot.time, now)
  ) {
    throw new ScheduleDataError("slot_unavailable", 409);
  }

  const staff = database.prepare(`
    SELECT id
    FROM staff_members
    WHERE id = ? AND is_active = 1
  `).get(staffMemberId);
  if (!staff) throw new ScheduleDataError("slot_unavailable", 409);

  const availability = database.prepare(`
    SELECT id
    FROM staff_availability_windows
    WHERE staff_member_id = ?
      AND weekday = ?
      AND start_time_minutes <= ?
      AND end_time_minutes >= ?
    LIMIT 1
  `).get(
    staffMemberId,
    weekdayForTaipeiDate(slot.date),
    slot.minutes,
    slot.minutes + APPROVED_SLOT_DURATION_MINUTES,
  );
  if (!availability) throw new ScheduleDataError("slot_unavailable", 409);

  const timeBlock = database.prepare(`
    SELECT id
    FROM staff_time_blocks
    WHERE staff_member_id = ?
      AND block_date = ?
      AND start_time_minutes < ?
      AND end_time_minutes > ?
    LIMIT 1
  `).get(
    staffMemberId,
    slot.date,
    slot.minutes + APPROVED_SLOT_DURATION_MINUTES,
    slot.minutes,
  );
  if (timeBlock) throw new ScheduleDataError("slot_unavailable", 409);
}

function isSqliteCode(error: unknown, prefixes: readonly string[]): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? String(error.code) : "";
  return prefixes.some((prefix) => code.startsWith(prefix));
}

function runWithStorageBoundary<T>(
  operation: () => T,
  uniqueConflictCode?: "slot_unavailable" | "idempotency_conflict",
): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof ScheduleDataError) throw error;
    if (isSqliteCode(error, ["SQLITE_BUSY", "SQLITE_LOCKED"])) {
      throw new ScheduleDataError("temporarily_unavailable", 503, true);
    }
    if (
      uniqueConflictCode
      && isSqliteCode(error, ["SQLITE_CONSTRAINT_UNIQUE", "SQLITE_CONSTRAINT_PRIMARYKEY"])
    ) {
      throw new ScheduleDataError(uniqueConflictCode, 409);
    }
    throw new ScheduleDataError("storage_failure", 500);
  }
}

function parseStoredResult(row: IdempotencyRow): MinimalStoredResult {
  try {
    const parsed = JSON.parse(row.result_json) as Partial<MinimalStoredResult>;
    if (
      parsed.entryId !== row.resource_id
      || parsed.kind !== row.resource_kind
      || !Number.isInteger(parsed.version)
      || Number(parsed.version) < 1
    ) {
      throw new Error("invalid result");
    }
    return {
      entryId: parsed.entryId,
      kind: parsed.kind,
      version: Number(parsed.version),
    };
  } catch {
    throw new ScheduleDataError("storage_failure", 500);
  }
}

function replayIdempotentResult(
  row: IdempotencyRow | undefined,
  requestHash: string,
): ScheduleWriteResult | null {
  if (!row) return null;
  if (row.request_hash !== requestHash) {
    throw new ScheduleDataError("idempotency_conflict", 409);
  }
  return { ...parseStoredResult(row), replayed: true };
}

function toStoredEntry(row: ScheduleEntryRow): StoredScheduleEntry {
  return {
    id: row.id,
    kind: row.kind,
    staffMemberId: row.staff_member_id,
    serviceDefinitionId: row.service_definition_id,
    slotDate: row.slot_date,
    slotTimeMinutes: row.slot_time_minutes,
    slotStartsAtUtc: row.slot_starts_at_utc,
    durationMinutes: row.duration_minutes,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    title: row.title_text,
    note: row.note_text,
    anonymizedAtUtc: row.anonymized_at_utc,
    source: row.source,
    version: row.version,
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  };
}

class SqliteScheduleEntryRepository implements ScheduleEntryRepository {
  private readonly clock: () => Date;

  constructor(
    private readonly database: ControlledSqliteConnection,
    options: RepositoryOptions = {},
  ) {
    this.clock = options.clock ?? (() => new Date());
  }

  async listStaffMembers(): Promise<ScheduleStaffMember[]> {
    return runWithStorageBoundary(() => {
      const rows = this.database.prepare(`
        SELECT id, role, public_label, is_active
        FROM staff_members
        ORDER BY role ASC, public_label ASC, id ASC
      `).all() as StaffRow[];
      return rows.map((row) => ({
        id: row.id,
        role: row.role,
        publicLabel: row.public_label,
        active: row.is_active === 1,
      }));
    });
  }

  async listAvailability(): Promise<PublicAvailabilitySlot[]> {
    return runWithStorageBoundary(() => {
      const now = this.currentInstant();
      const clock = getTaipeiClockSnapshot(now);
      const dates = Array.from(
        { length: APPROVED_BOOKING_DAYS },
        (_, index) => addTaipeiCalendarDays(clock.date, index),
      );
      const staff = this.database.prepare(`
        SELECT id, role, public_label, is_active
        FROM staff_members
        WHERE is_active = 1
        ORDER BY role ASC, public_label ASC, id ASC
      `).all() as StaffRow[];
      const bookings = this.database.prepare(`
        SELECT staff_member_id, slot_date, slot_time_minutes
        FROM schedule_entries
        WHERE kind = 'booking' AND slot_date BETWEEN ? AND ?
      `).all(dates[0], dates[dates.length - 1]) as Array<{
        staff_member_id: string;
        slot_date: string;
        slot_time_minutes: number;
      }>;
      const blocks = this.database.prepare(`
        SELECT staff_member_id, block_date, start_time_minutes, end_time_minutes
        FROM staff_time_blocks
        WHERE block_date BETWEEN ? AND ?
      `).all(dates[0], dates[dates.length - 1]) as Array<{
        staff_member_id: string;
        block_date: string;
        start_time_minutes: number;
        end_time_minutes: number;
      }>;
      const windows = this.database.prepare(`
        SELECT staff_member_id, weekday, start_time_minutes, end_time_minutes
        FROM staff_availability_windows
      `).all() as Array<{
        staff_member_id: string;
        weekday: number;
        start_time_minutes: number;
        end_time_minutes: number;
      }>;

      const occupied = new Set(bookings.map((booking) =>
        `${booking.staff_member_id}|${booking.slot_date}|${booking.slot_time_minutes}`,
      ));
      const slots: PublicAvailabilitySlot[] = [];
      for (const member of staff) {
        for (const date of dates) {
          const weekday = weekdayForTaipeiDate(date);
          const window = windows.find((item) =>
            item.staff_member_id === member.id && item.weekday === weekday,
          );
          for (
            let minutes = APPROVED_FIRST_SLOT_MINUTES;
            minutes <= APPROVED_LAST_SLOT_MINUTES;
            minutes += APPROVED_SLOT_DURATION_MINUTES
          ) {
            const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`;
            const blocked = blocks.some((block) =>
              block.staff_member_id === member.id
              && block.block_date === date
              && block.start_time_minutes < minutes + APPROVED_SLOT_DURATION_MINUTES
              && block.end_time_minutes > minutes,
            );
            slots.push({
              staffMemberId: member.id,
              staffLabel: member.public_label,
              slotDate: date,
              slotTime: time,
              available: Boolean(window)
                && window!.start_time_minutes <= minutes
                && window!.end_time_minutes >= minutes + APPROVED_SLOT_DURATION_MINUTES
                && !blocked
                && !occupied.has(`${member.id}|${date}|${minutes}`)
                && !isTaipeiSlotPast(date, time, now),
            });
          }
        }
      }
      return slots;
    });
  }

  async listEntries(query: ScheduleEntryQuery = {}): Promise<StoredScheduleEntry[]> {
    return runWithStorageBoundary(() => {
      const values: string[] = [];
      const where: string[] = [];
      if (query.fromDate !== undefined) {
        if (!isTaipeiCalendarDate(query.fromDate)) {
          throw new ScheduleDataError("invalid_request", 400);
        }
        where.push("slot_date >= ?");
        values.push(query.fromDate);
      }
      if (query.toDate !== undefined) {
        if (!isTaipeiCalendarDate(query.toDate)) {
          throw new ScheduleDataError("invalid_request", 400);
        }
        where.push("slot_date <= ?");
        values.push(query.toDate);
      }
      if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
        throw new ScheduleDataError("invalid_request", 400);
      }
      const rows = this.database.prepare(`
        SELECT
          id,
          kind,
          staff_member_id,
          service_definition_id,
          slot_date,
          slot_time_minutes,
          slot_starts_at_utc,
          duration_minutes,
          status,
          customer_name,
          customer_phone,
          title_text,
          note_text,
          anonymized_at_utc,
          source,
          version,
          created_at_utc,
          updated_at_utc
        FROM schedule_entries
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY slot_date, slot_time_minutes, kind, created_at_utc, id
      `).all(...values) as ScheduleEntryRow[];
      return rows.map(toStoredEntry);
    });
  }

  async createCustomerBooking(
    command: CreateBookingCommand,
  ): Promise<ScheduleWriteResult> {
    return this.createBooking(command, "customer");
  }

  async createStaffBooking(
    command: CreateStaffBookingCommand,
  ): Promise<ScheduleWriteResult> {
    return this.createBooking(command, "staff");
  }

  private async createBooking(
    command: CreateBookingCommand | CreateStaffBookingCommand,
    source: ScheduleEntrySource,
  ): Promise<ScheduleWriteResult> {
    const canonical = canonicalizeBooking(command, source);
    const requestHash = bookingRequestHash(canonical);
    const create = this.database.transaction((): ScheduleWriteResult => {
      const existing = this.readIdempotency(
        BOOKING_IDEMPOTENCY_SCOPE,
        canonical.idempotencyKey,
      );
      const replay = replayIdempotentResult(existing, requestHash);
      if (replay) return replay;

      const now = this.currentInstant();
      assertOperationalSlot(
        this.database,
        canonical.staffMemberId,
        canonical.slot,
        now,
      );
      const service = this.database.prepare(`
        SELECT id
        FROM service_definitions
        WHERE code = 'standard_booking'
          AND duration_minutes = 60
          AND is_active = 1
      `).get() as { id: string } | undefined;
      if (!service) throw new ScheduleDataError("slot_unavailable", 409);

      const conflict = this.database.prepare(`
        SELECT id
        FROM schedule_entries
        WHERE kind = 'booking'
          AND staff_member_id = ?
          AND slot_date = ?
          AND slot_time_minutes = ?
        LIMIT 1
      `).get(
        canonical.staffMemberId,
        canonical.slot.date,
        canonical.slot.minutes,
      );
      if (conflict) throw new ScheduleDataError("slot_unavailable", 409);

      const entryId = randomUUID();
      const timestamp = now.toISOString();
      this.database.prepare(`
        INSERT INTO schedule_entries (
          id,
          kind,
          staff_member_id,
          service_definition_id,
          slot_date,
          slot_time_minutes,
          slot_starts_at_utc,
          duration_minutes,
          status,
          customer_name,
          customer_phone,
          note_text,
          source,
          version,
          created_at_utc,
          updated_at_utc
        ) VALUES (?, 'booking', ?, ?, ?, ?, ?, 60, 'confirmed', ?, ?, ?, ?, 1, ?, ?)
      `).run(
        entryId,
        canonical.staffMemberId,
        service.id,
        canonical.slot.date,
        canonical.slot.minutes,
        canonical.slot.startsAtUtc,
        canonical.customerName,
        canonical.customerPhone,
        canonical.note,
        canonical.source,
        timestamp,
        timestamp,
      );

      this.insertAudit({
        actorType: canonical.source,
        actorId: canonical.actorId,
        action: "schedule_entry.created",
        entryId,
        version: 1,
        occurredAt: timestamp,
      });
      const result: MinimalStoredResult = {
        entryId,
        kind: "booking",
        version: 1,
      };
      this.insertIdempotency({
        scope: BOOKING_IDEMPOTENCY_SCOPE,
        key: canonical.idempotencyKey,
        requestHash,
        result,
        createdAt: timestamp,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY_RETENTION_MS).toISOString(),
      });
      return { ...result, replayed: false };
    });

    return runWithStorageBoundary(
      () => create.immediate(),
      "slot_unavailable",
    );
  }

  async createManualNote(
    command: CreateManualNoteCommand,
  ): Promise<ScheduleWriteResult> {
    const canonical = canonicalizeManualNote(command);
    const requestHash = noteRequestHash(canonical);
    const create = this.database.transaction((): ScheduleWriteResult => {
      const existing = this.readIdempotency(
        NOTE_IDEMPOTENCY_SCOPE,
        canonical.idempotencyKey,
      );
      const replay = replayIdempotentResult(existing, requestHash);
      if (replay) return replay;

      const now = this.currentInstant();
      assertOperationalSlot(
        this.database,
        canonical.staffMemberId,
        canonical.slot,
        now,
      );
      const entryId = randomUUID();
      const timestamp = now.toISOString();
      this.database.prepare(`
        INSERT INTO schedule_entries (
          id,
          kind,
          staff_member_id,
          service_definition_id,
          slot_date,
          slot_time_minutes,
          slot_starts_at_utc,
          duration_minutes,
          status,
          customer_name,
          customer_phone,
          title_text,
          note_text,
          anonymized_at_utc,
          source,
          version,
          created_at_utc,
          updated_at_utc
        ) VALUES (?, 'note', ?, NULL, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, NULL, 'staff', 1, ?, ?)
      `).run(
        entryId,
        canonical.staffMemberId,
        canonical.slot.date,
        canonical.slot.minutes,
        canonical.slot.startsAtUtc,
        canonical.title,
        canonical.note,
        timestamp,
        timestamp,
      );
      this.insertAudit({
        actorType: "staff",
        actorId: canonical.actorId,
        action: "schedule_entry.created",
        entryId,
        version: 1,
        occurredAt: timestamp,
      });
      const result: MinimalStoredResult = {
        entryId,
        kind: "note",
        version: 1,
      };
      this.insertIdempotency({
        scope: NOTE_IDEMPOTENCY_SCOPE,
        key: canonical.idempotencyKey,
        requestHash,
        result,
        createdAt: timestamp,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY_RETENTION_MS).toISOString(),
      });
      return { ...result, replayed: false };
    });

    return runWithStorageBoundary(
      () => create.immediate(),
      "idempotency_conflict",
    );
  }

  async updateNote(
    command: UpdateScheduleEntryNoteCommand,
  ): Promise<StoredScheduleEntry> {
    const actorId = requireString(command.actorId, { max: 200 });
    const entryId = requireString(command.entryId, { max: 200 });
    if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1) {
      throw new ScheduleDataError("invalid_request", 400);
    }
    const rawNote = requireString(command.note, {
      allowEmpty: true,
      max: 2_000,
    });

    const update = this.database.transaction((): StoredScheduleEntry => {
      const existing = this.readEntry(entryId);
      if (!existing) throw new ScheduleDataError("not_found", 404);

      const now = this.currentInstant();
      const slotTime = `${String(Math.floor(existing.slot_time_minutes / 60)).padStart(2, "0")}:${String(existing.slot_time_minutes % 60).padStart(2, "0")}`;
      if (
        existing.anonymized_at_utc !== null
        || isTaipeiSlotPast(existing.slot_date, slotTime, now)
      ) {
        throw new ScheduleDataError("entry_read_only", 409);
      }
      if (existing.kind === "note" && !rawNote) {
        throw new ScheduleDataError("invalid_request", 400);
      }

      const timestamp = now.toISOString();
      const result = this.database.prepare(`
        UPDATE schedule_entries
        SET note_text = ?, version = version + 1, updated_at_utc = ?
        WHERE id = ? AND version = ?
      `).run(rawNote, timestamp, entryId, command.expectedVersion);
      if (result.changes === 0) {
        throw new ScheduleDataError("version_conflict", 409);
      }

      const updated = this.readEntry(entryId);
      if (!updated) throw new ScheduleDataError("storage_failure", 500);
      this.insertAudit({
        actorType: "staff",
        actorId,
        action: "schedule_entry.note_updated",
        entryId,
        version: updated.version,
        occurredAt: timestamp,
      });
      return toStoredEntry(updated);
    });

    return runWithStorageBoundary(() => update.immediate());
  }

  async issueAnonymizationVerification(
    command: IssueAnonymizationVerificationCommand,
  ): Promise<AnonymizationVerification> {
    const actorId = requireString(command.actorId, { max: 200 });
    const bookingEntryId = requireString(command.bookingEntryId, { max: 200 });
    const issue = this.database.transaction((): AnonymizationVerification => {
      const actor = this.database.prepare(`
        SELECT id
        FROM staff_members
        WHERE id = ?
          AND role = 'owner'
          AND is_active = 1
          AND auth_user_id IS NOT NULL
      `).get(actorId);
      if (!actor) throw new ScheduleDataError("not_found", 404);

      const booking = this.database.prepare(`
        SELECT id
        FROM schedule_entries
        WHERE id = ? AND kind = 'booking' AND anonymized_at_utc IS NULL
      `).get(bookingEntryId);
      if (!booking) throw new ScheduleDataError("not_found", 404);

      const now = this.currentInstant();
      const verification: AnonymizationVerification = {
        verificationId: randomUUID(),
        bookingEntryId,
        expiresAtUtc: new Date(
          now.getTime() + ANONYMIZATION_VERIFICATION_TTL_MS,
        ).toISOString(),
      };
      this.database.prepare(`
        INSERT INTO customer_data_verifications (
          id, booking_entry_id, purpose, issued_by_staff_id,
          issued_at_utc, expires_at_utc, consumed_at_utc, consumed_by_staff_id
        ) VALUES (?, ?, 'anonymize_booking', ?, ?, ?, NULL, NULL)
      `).run(
        verification.verificationId,
        bookingEntryId,
        actorId,
        now.toISOString(),
        verification.expiresAtUtc,
      );
      return verification;
    });

    return runWithStorageBoundary(() => issue.immediate());
  }

  async anonymizeBooking(
    command: AnonymizeBookingCommand,
  ): Promise<StoredScheduleEntry> {
    const actorId = requireString(command.actorId, { max: 200 });
    const bookingEntryId = requireString(command.bookingEntryId, { max: 200 });
    const verificationId = requireString(command.verificationId, { max: 200 });
    if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1) {
      throw new ScheduleDataError("invalid_request", 400);
    }

    const anonymize = this.database.transaction((): StoredScheduleEntry => {
      const actor = this.database.prepare(`
        SELECT id
        FROM staff_members
        WHERE id = ? AND is_active = 1 AND auth_user_id IS NOT NULL
      `).get(actorId);
      if (!actor) throw new ScheduleDataError("not_found", 404);

      const now = this.currentInstant();
      const timestamp = now.toISOString();
      const verification = this.database.prepare(`
        SELECT id
        FROM customer_data_verifications
        WHERE id = ?
          AND booking_entry_id = ?
          AND purpose = 'anonymize_booking'
          AND consumed_at_utc IS NULL
          AND expires_at_utc > ?
      `).get(verificationId, bookingEntryId, timestamp);
      if (!verification) throw new ScheduleDataError("not_found", 404);

      const updated = this.database.prepare(`
        UPDATE schedule_entries
        SET
          customer_name = NULL,
          customer_phone = NULL,
          note_text = '',
          anonymized_at_utc = ?,
          version = version + 1,
          updated_at_utc = ?
        WHERE id = ?
          AND kind = 'booking'
          AND anonymized_at_utc IS NULL
          AND version = ?
      `).run(
        timestamp,
        timestamp,
        bookingEntryId,
        command.expectedVersion,
      );
      if (updated.changes === 0) {
        throw new ScheduleDataError("version_conflict", 409);
      }

      this.database.prepare(`
        DELETE FROM idempotency_requests WHERE resource_id = ?
      `).run(bookingEntryId);

      const consumed = this.database.prepare(`
        UPDATE customer_data_verifications
        SET consumed_at_utc = ?, consumed_by_staff_id = ?
        WHERE id = ? AND consumed_at_utc IS NULL
      `).run(timestamp, actorId, verificationId);
      if (consumed.changes !== 1) {
        throw new ScheduleDataError("version_conflict", 409);
      }

      const result = this.readEntry(bookingEntryId);
      if (!result) throw new ScheduleDataError("storage_failure", 500);
      this.insertAudit({
        actorType: "staff",
        actorId,
        action: "schedule_entry.anonymized",
        entryId: bookingEntryId,
        version: result.version,
        occurredAt: timestamp,
      });
      return toStoredEntry(result);
    });

    return runWithStorageBoundary(() => anonymize.immediate());
  }

  private currentInstant(): Date {
    const now = this.clock();
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      throw new ScheduleDataError("storage_failure", 500);
    }
    return new Date(now.getTime());
  }

  private readEntry(entryId: string): ScheduleEntryRow | undefined {
    return this.database.prepare(`
      SELECT
        id,
        kind,
        staff_member_id,
        service_definition_id,
        slot_date,
        slot_time_minutes,
        slot_starts_at_utc,
        duration_minutes,
        status,
        customer_name,
        customer_phone,
        title_text,
        note_text,
        anonymized_at_utc,
        source,
        version,
        created_at_utc,
        updated_at_utc
      FROM schedule_entries
      WHERE id = ?
    `).get(entryId) as ScheduleEntryRow | undefined;
  }

  private readIdempotency(
    scope: string,
    key: string,
  ): IdempotencyRow | undefined {
    return this.database.prepare(`
      SELECT request_hash, resource_kind, resource_id, result_json
      FROM idempotency_requests
      WHERE scope = ? AND idempotency_key = ?
    `).get(scope, key) as IdempotencyRow | undefined;
  }

  private insertAudit(input: {
    actorType: "customer" | "staff";
    actorId: string | null;
    action:
      | "schedule_entry.created"
      | "schedule_entry.note_updated"
      | "schedule_entry.anonymized";
    entryId: string;
    version: number;
    occurredAt: string;
  }): void {
    this.database.prepare(`
      INSERT INTO audit_events (
        id,
        actor_type,
        actor_id,
        action,
        resource_type,
        resource_id,
        resource_version,
        occurred_at_utc
      ) VALUES (?, ?, ?, ?, 'schedule_entry', ?, ?, ?)
    `).run(
      randomUUID(),
      input.actorType,
      input.actorId,
      input.action,
      input.entryId,
      input.version,
      input.occurredAt,
    );
  }

  private insertIdempotency(input: {
    scope: string;
    key: string;
    requestHash: string;
    result: MinimalStoredResult;
    createdAt: string;
    expiresAt: string;
  }): void {
    this.database.prepare(`
      INSERT INTO idempotency_requests (
        id,
        scope,
        idempotency_key,
        request_hash,
        resource_kind,
        resource_id,
        result_json,
        created_at_utc,
        expires_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      input.scope,
      input.key,
      input.requestHash,
      input.result.kind,
      input.result.entryId,
      JSON.stringify(input.result),
      input.createdAt,
      input.expiresAt,
    );
  }
}

export function createSqliteScheduleEntryRepository(
  database: ControlledSqliteConnection,
  options: RepositoryOptions = {},
): ScheduleEntryRepository {
  return new SqliteScheduleEntryRepository(database, options);
}

export function openSqliteScheduleStore(
  filename: string,
  options: RepositoryOptions = {},
): SqliteScheduleStore {
  const database = openControlledSqliteConnection(filename);
  try {
    const initializedAt = options.clock?.() ?? new Date();
    applyScheduleMigrations(database, initializedAt);
    provisionApprovedScheduleConfig(database, initializedAt);
    return {
      repository: createSqliteScheduleEntryRepository(database, options),
      close: () => database.close(),
    };
  } catch (error) {
    database.close();
    throw error;
  }
}
