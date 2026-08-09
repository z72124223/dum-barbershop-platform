import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { Worker } from "node:worker_threads";
import { randomUUID } from "node:crypto";
import {
  ScheduleDataError,
  toSafeScheduleErrorResponse,
  type CreateBookingCommand,
} from "../../domain/schedule";
import {
  ApprovedScheduleConfigError,
  APPROVED_AVAILABILITY_END_MINUTES,
  APPROVED_FIRST_SLOT_MINUTES,
} from "./approved-config";
import {
  SQLITE_BUSY_TIMEOUT_MS,
  openControlledSqliteConnection,
} from "./connection";
import {
  SCHEDULE_SCHEMA_TABLES,
  ScheduleMigrationIntegrityError,
  applyScheduleMigrations,
} from "./migrations";
import { openSqliteScheduleStore } from "./sqlite-schedule-entry-repository";

const FIXED_NOW = "2026-08-09T00:00:00.000Z";
const tempDirectories: string[] = [];

after(() => {
  for (const directory of tempDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function createDatabasePath(label: string): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `dum-${label}-`));
  tempDirectories.push(directory);
  return path.join(directory, "schedule.sqlite");
}

function fixedClock(): Date {
  return new Date(FIXED_NOW);
}

function scalar(
  database: ReturnType<typeof openControlledSqliteConnection>,
  sql: string,
): number {
  const row = database.prepare(sql).get() as { value: number };
  return row.value;
}

function assertScheduleError(
  expectedCode: string,
  expectedStatus: number,
): (error: unknown) => boolean {
  return (error: unknown): boolean => {
    assert.equal(error instanceof ScheduleDataError, true);
    if (!(error instanceof ScheduleDataError)) return false;
    assert.equal(error.code, expectedCode);
    assert.equal(error.status, expectedStatus);
    return true;
  };
}

async function waitForBarrier(
  signal: Int32Array,
  expected: number,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Atomics.load(signal, 0) < expected) {
    if (Date.now() >= deadline) throw new Error("worker barrier timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

interface WorkerOutcome {
  ok: boolean;
  entryId?: string;
  code?: string;
  status?: number;
  retryable?: boolean;
}

function collectWorkerOutcome(worker: Worker): Promise<WorkerOutcome> {
  return new Promise((resolve, reject) => {
    let outcome: WorkerOutcome | undefined;
    worker.on("message", (message: WorkerOutcome) => {
      outcome = message;
    });
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`worker exited with code ${code}`));
      } else if (!outcome) {
        reject(new Error("worker exited without a result"));
      } else {
        resolve(outcome);
      }
    });
  });
}

const BOOKING_WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const { openSqliteScheduleStore } = require(workerData.modulePath);
(async () => {
  const store = openSqliteScheduleStore(workerData.databasePath, {
    clock: () => new Date(workerData.now),
  });
  const signal = new Int32Array(workerData.barrier);
  Atomics.add(signal, 0, 1);
  Atomics.wait(signal, 1, 0);
  try {
    const result = await store.repository.createCustomerBooking(
      workerData.command,
    );
    parentPort.postMessage({ ok: true, entryId: result.entryId });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      code: error && error.code,
      status: error && error.status,
      retryable: error && error.retryable,
    });
  } finally {
    store.close();
  }
})();
`;

const LOCK_WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const { openControlledSqliteConnection } = require(workerData.modulePath);
const database = openControlledSqliteConnection(workerData.databasePath);
const signal = new Int32Array(workerData.barrier);
try {
  database.exec("BEGIN IMMEDIATE");
  Atomics.add(signal, 0, 1);
  Atomics.wait(signal, 1, 0);
  database.exec("ROLLBACK");
  parentPort.postMessage({ ok: true });
} finally {
  if (database.inTransaction) database.exec("ROLLBACK");
  database.close();
}
`;

describe("SQLite schedule core", () => {
  it("rebuilds the exact #33 schema and verifies every connection pragma", () => {
    const databasePath = createDatabasePath("schema");
    const database = openControlledSqliteConnection(databasePath);
    try {
      applyScheduleMigrations(database, fixedClock());

      assert.equal(database.pragma("foreign_keys", { simple: true }), 1);
      assert.equal(database.pragma("journal_mode", { simple: true }), "wal");
      assert.equal(database.pragma("synchronous", { simple: true }), 2);
      assert.equal(database.pragma("secure_delete", { simple: true }), 1);
      assert.equal(
        database.pragma("busy_timeout", { simple: true }),
        SQLITE_BUSY_TIMEOUT_MS,
      );

      const tables = (database.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all() as Array<{ name: string }>).map((row) => row.name);
      assert.deepEqual(tables, [...SCHEDULE_SCHEMA_TABLES]);
      assert.equal(tables.some((table) => /auth|account|session|rate/i.test(table)), false);

      const migration = database.prepare(`
        SELECT version, name, checksum
        FROM schema_migrations
      `).get() as { version: number; name: string; checksum: string };
      assert.equal(migration.version, 1);
      assert.equal(migration.name, "create_schedule_core");
      assert.match(migration.checksum, /^[a-f0-9]{64}$/);

      const index = database.prepare(`
        SELECT sql
        FROM sqlite_master
        WHERE type = 'index' AND name = 'schedule_entries_booking_slot_unique'
      `).get() as { sql: string };
      assert.match(index.sql, /WHERE kind = 'booking'/i);
      assert.throws(() => database.prepare(`
        INSERT INTO staff_time_blocks (
          id, staff_member_id, block_date,
          start_time_minutes, end_time_minutes, created_at_utc
        ) VALUES (?, ?, '2026-08-09', 600, 660, ?)
      `).run(randomUUID(), randomUUID(), FIXED_NOW));
    } finally {
      database.close();
    }

    const reopened = openControlledSqliteConnection(databasePath);
    try {
      applyScheduleMigrations(reopened, fixedClock());
      assert.equal(
        scalar(reopened, "SELECT count(*) AS value FROM schema_migrations"),
        1,
      );
    } finally {
      reopened.close();
    }
  });

  it("fails closed on a changed checksum or unknown migration history", () => {
    const checksumPath = createDatabasePath("checksum");
    const checksumDatabase = openControlledSqliteConnection(checksumPath);
    let correctChecksum = "";
    try {
      applyScheduleMigrations(checksumDatabase, fixedClock());
      correctChecksum = (checksumDatabase.prepare(`
        SELECT checksum FROM schema_migrations WHERE version = 1
      `).get() as { checksum: string }).checksum;
      checksumDatabase.prepare(`
        UPDATE schema_migrations SET checksum = ? WHERE version = 1
      `).run("0".repeat(64));
    } finally {
      checksumDatabase.close();
    }

    const tampered = openControlledSqliteConnection(checksumPath);
    try {
      assert.throws(
        () => applyScheduleMigrations(tampered, fixedClock()),
        (error: unknown) => error instanceof ScheduleMigrationIntegrityError
          && error.code === "migration_checksum_mismatch",
      );
    } finally {
      tampered.close();
    }

    const renamed = openControlledSqliteConnection(checksumPath);
    try {
      renamed.prepare(`
        UPDATE schema_migrations SET name = 'renamed', checksum = ? WHERE version = 1
      `).run(correctChecksum);
      assert.throws(
        () => applyScheduleMigrations(renamed, fixedClock()),
        (error: unknown) => error instanceof ScheduleMigrationIntegrityError
          && error.code === "migration_name_mismatch",
      );
    } finally {
      renamed.close();
    }

    const unknownPath = createDatabasePath("unknown-migration");
    const unknownDatabase = openControlledSqliteConnection(unknownPath);
    try {
      applyScheduleMigrations(unknownDatabase, fixedClock());
      unknownDatabase.prepare(`
        INSERT INTO schema_migrations (
          version, name, checksum, applied_at_utc
        ) VALUES (2, 'unrecognized', ?, ?)
      `).run("1".repeat(64), FIXED_NOW);
      assert.throws(
        () => applyScheduleMigrations(unknownDatabase, fixedClock()),
        (error: unknown) => error instanceof ScheduleMigrationIntegrityError
          && error.code === "unknown_migration",
      );
    } finally {
      unknownDatabase.close();
    }
  });

  it("provisions configuration only and never reads browser storage", async () => {
    const databasePath = createDatabasePath("seed");
    let storageReadCount = 0;
    const originalStorage = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        storageReadCount += 1;
        return { getItem: () => "browser sentinel" };
      },
    });

    const store = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    try {
      const staff = await store.repository.listStaffMembers();
      assert.equal(staff.length, 2);
      assert.deepEqual(staff.map((member) => member.role).sort(), ["owner", "staff"]);
      assert.deepEqual(staff.map((member) => member.publicLabel).sort(), ["老闆", "職員"]);
      for (const member of staff) {
        assert.match(member.id, /^[a-f0-9-]{36}$/i);
        assert.notEqual(member.id, member.role);
        assert.notEqual(member.id, member.publicLabel);
      }

      const inspection = openControlledSqliteConnection(databasePath);
      try {
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM staff_members"), 2);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM service_definitions"), 1);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM staff_availability_windows"), 14);
        for (const table of [
          "staff_time_blocks",
          "schedule_entries",
          "idempotency_requests",
          "audit_events",
        ]) {
          assert.equal(scalar(inspection, `SELECT count(*) AS value FROM ${table}`), 0);
        }
        const service = inspection.prepare(`
          SELECT code, duration_minutes FROM service_definitions
        `).get() as { code: string; duration_minutes: number };
        assert.deepEqual(service, {
          code: "standard_booking",
          duration_minutes: 60,
        });
        const availability = inspection.prepare(`
          SELECT min(start_time_minutes) AS start_time, max(end_time_minutes) AS end_time
          FROM staff_availability_windows
        `).get() as { start_time: number; end_time: number };
        assert.equal(availability.start_time, APPROVED_FIRST_SLOT_MINUTES);
        assert.equal(availability.end_time, APPROVED_AVAILABILITY_END_MINUTES);
        assert.throws(() => inspection.prepare(`
          UPDATE service_definitions SET duration_minutes = 120
        `).run());
      } finally {
        inspection.close();
      }
      assert.equal(storageReadCount, 0);
    } finally {
      store.close();
      if (originalStorage) {
        Object.defineProperty(globalThis, "localStorage", originalStorage);
      } else {
        Reflect.deleteProperty(globalThis, "localStorage");
      }
    }
  });

  it("fails closed when approved production configuration has extra staff", () => {
    const databasePath = createDatabasePath("config-integrity");
    const store = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    store.close();
    const tamper = openControlledSqliteConnection(databasePath);
    tamper.prepare(`
      INSERT INTO staff_members (
        id, role, public_label, is_active, created_at_utc
      ) VALUES (?, 'staff', '未核准職員', 1, ?)
    `).run(randomUUID(), FIXED_NOW);
    tamper.close();

    assert.throws(
      () => openSqliteScheduleStore(databasePath, { clock: fixedClock }),
      (error: unknown) => error instanceof ApprovedScheduleConfigError,
    );
  });

  it("shares committed data across independent clients and survives reopen", async () => {
    const databasePath = createDatabasePath("persistence");
    const first = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    const second = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    let entryId = "";
    try {
      const [staffMember] = await first.repository.listStaffMembers();
      const command: CreateBookingCommand = {
        idempotencyKey: "persistence-key",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "10:00",
        customerName: "虛構顧客甲",
        customerPhone: "0900-000-101",
        note: "只供測試",
      };
      const created = await first.repository.createCustomerBooking(command);
      entryId = created.entryId;
      assert.equal(created.replayed, false);
      assert.equal(JSON.stringify(created).includes(command.customerPhone), false);

      const sharedRead = await second.repository.listEntries();
      assert.equal(sharedRead.length, 1);
      assert.equal(sharedRead[0].id, entryId);
      assert.equal(sharedRead[0].slotTimeMinutes, 600);
      assert.equal(sharedRead[0].slotStartsAtUtc, "2026-08-09T02:00:00.000Z");
      assert.equal(sharedRead[0].status, "confirmed");
      assert.equal(sharedRead[0].durationMinutes, 60);

      const replayed = await second.repository.createCustomerBooking({
        ...command,
        customerName: ` ${command.customerName} `,
        note: ` ${command.note} `,
        slotTime: " 10:00 ",
      });
      assert.deepEqual(replayed, { ...created, replayed: true });
      await assert.rejects(
        first.repository.createCustomerBooking({
          ...command,
          customerPhone: "0900-000-999",
        }),
        assertScheduleError("idempotency_conflict", 409),
      );

      const inspection = openControlledSqliteConnection(databasePath);
      try {
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM schedule_entries"), 1);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM audit_events"), 1);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM idempotency_requests"), 1);
        const idempotency = inspection.prepare(`
          SELECT request_hash, result_json FROM idempotency_requests
        `).get() as { request_hash: string; result_json: string };
        assert.match(idempotency.request_hash, /^[a-f0-9]{64}$/);
        for (const forbidden of [
          command.customerName,
          command.customerPhone,
          command.note ?? "",
        ]) {
          assert.equal(idempotency.result_json.includes(forbidden), false);
        }
        const auditJson = JSON.stringify(inspection.prepare(`
          SELECT * FROM audit_events
        `).all());
        assert.equal(auditJson.includes(command.customerName), false);
        assert.equal(auditJson.includes(command.customerPhone), false);
        assert.equal(auditJson.includes(command.note ?? ""), false);
      } finally {
        inspection.close();
      }
    } finally {
      second.close();
      first.close();
    }

    const reopened = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    try {
      const entries = await reopened.repository.listEntries();
      assert.equal(entries.length, 1);
      assert.equal(entries[0].id, entryId);
    } finally {
      reopened.close();
    }
  });

  it("allows booking and notes to coexist while conflicts roll back fully", async () => {
    const databasePath = createDatabasePath("coexist");
    const store = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    try {
      const [staffMember] = await store.repository.listStaffMembers();
      const booking: CreateBookingCommand = {
        idempotencyKey: "shared-key",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "10:00",
        customerName: "虛構顧客乙",
        customerPhone: "0900-000-202",
        note: "",
      };
      await store.repository.createCustomerBooking(booking);
      await store.repository.createManualNote({
        idempotencyKey: "shared-key",
        staffMemberId: staffMember.id,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        note: "第一筆手動註記",
      });
      await store.repository.createManualNote({
        idempotencyKey: "second-note",
        staffMemberId: staffMember.id,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        note: "第二筆手動註記",
      });

      const losingKey = "losing-booking-key";
      await assert.rejects(
        store.repository.createCustomerBooking({
          ...booking,
          idempotencyKey: losingKey,
        }),
        assertScheduleError("slot_unavailable", 409),
      );
      await store.repository.createCustomerBooking({
        ...booking,
        idempotencyKey: losingKey,
        slotTime: "11:00",
      });

      const entries = await store.repository.listEntries();
      assert.equal(entries.filter((entry) => entry.kind === "booking").length, 2);
      assert.equal(entries.filter((entry) => entry.kind === "note").length, 2);

      const inspection = openControlledSqliteConnection(databasePath);
      try {
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM audit_events"), 4);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM idempotency_requests"), 4);
      } finally {
        inspection.close();
      }
    } finally {
      store.close();
    }
  });

  it("uses version CAS and preserves the winning note", async () => {
    const databasePath = createDatabasePath("cas");
    const store = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    try {
      const [staffMember] = await store.repository.listStaffMembers();
      const createdNote = await store.repository.createManualNote({
        idempotencyKey: "cas-note",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "10:00",
        note: "初始註記",
      });
      const updated = await store.repository.updateNote({
        entryId: createdNote.entryId,
        expectedVersion: 1,
        note: "勝出的新版本",
      });
      assert.equal(updated.version, 2);
      assert.equal(updated.note, "勝出的新版本");

      await assert.rejects(
        store.repository.updateNote({
          entryId: createdNote.entryId,
          expectedVersion: 1,
          note: "過期覆寫",
        }),
        assertScheduleError("version_conflict", 409),
      );
      await assert.rejects(
        store.repository.updateNote({
          entryId: createdNote.entryId,
          expectedVersion: 2,
          note: "   ",
        }),
        assertScheduleError("invalid_request", 400),
      );
      const preserved = (await store.repository.listEntries()).find(
        (entry) => entry.id === createdNote.entryId,
      );
      assert.equal(preserved?.version, 2);
      assert.equal(preserved?.note, "勝出的新版本");

      const booking = await store.repository.createStaffBooking({
        idempotencyKey: "cas-booking",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "11:00",
        customerName: "虛構顧客丙",
        customerPhone: "0900-000-303",
        note: "可清空",
      });
      const cleared = await store.repository.updateNote({
        entryId: booking.entryId,
        expectedVersion: 1,
        note: "   ",
      });
      assert.equal(cleared.note, "");
      assert.equal(cleared.version, 2);

      const inspection = openControlledSqliteConnection(databasePath);
      try {
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM audit_events"), 4);
      } finally {
        inspection.close();
      }
    } finally {
      store.close();
    }
  });

  it("revalidates Taipei dates, elapsed slots, availability and time blocks", async () => {
    const databasePath = createDatabasePath("validation");
    const nowAtTen = () => new Date("2026-08-09T02:00:00.000Z");
    const store = openSqliteScheduleStore(databasePath, { clock: nowAtTen });
    try {
      const [staffMember] = await store.repository.listStaffMembers();
      const base: CreateBookingCommand = {
        idempotencyKey: "validation",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "11:00",
        customerName: "虛構顧客丁",
        customerPhone: "0900-000-404",
      };
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, slotDate: "2026-02-30" }),
        assertScheduleError("invalid_request", 400),
      );
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, slotTime: "11:30" }),
        assertScheduleError("invalid_request", 400),
      );
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, slotTime: "09:00" }),
        assertScheduleError("invalid_request", 400),
      );
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, slotTime: "10:00" }),
        assertScheduleError("slot_unavailable", 409),
      );
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, slotDate: "2026-08-16" }),
        assertScheduleError("slot_unavailable", 409),
      );
      await assert.rejects(
        store.repository.createCustomerBooking({ ...base, staffMemberId: randomUUID() }),
        assertScheduleError("slot_unavailable", 409),
      );

      const inspection = openControlledSqliteConnection(databasePath);
      try {
        inspection.prepare(`
          INSERT INTO staff_time_blocks (
            id, staff_member_id, block_date,
            start_time_minutes, end_time_minutes, created_at_utc
          ) VALUES (?, ?, '2026-08-09', 660, 720, ?)
        `).run(randomUUID(), staffMember.id, FIXED_NOW);
      } finally {
        inspection.close();
      }
      await assert.rejects(
        store.repository.createManualNote({
          idempotencyKey: "blocked-note",
          staffMemberId: staffMember.id,
          slotDate: "2026-08-09",
          slotTime: "11:00",
          note: "不可落入封鎖時段",
        }),
        assertScheduleError("slot_unavailable", 409),
      );
    } finally {
      store.close();
    }
  });

  it("settles a real two-worker same-slot race as one success and one 409", async () => {
    const databasePath = createDatabasePath("race");
    const initializer = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    const [staffMember] = await initializer.repository.listStaffMembers();
    initializer.close();

    const barrier = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const signal = new Int32Array(barrier);
    const modulePath = path.join(__dirname, "sqlite-schedule-entry-repository.js");
    const command: CreateBookingCommand = {
      idempotencyKey: "race-one",
      staffMemberId: staffMember.id,
      slotDate: "2026-08-09",
      slotTime: "10:00",
      customerName: "虛構競爭顧客",
      customerPhone: "0900-000-505",
      note: "race fixture",
    };
    const workers = ["race-one", "race-two"].map((idempotencyKey) =>
      new Worker(BOOKING_WORKER_SOURCE, {
        eval: true,
        workerData: {
          modulePath,
          databasePath,
          now: FIXED_NOW,
          barrier,
          command: { ...command, idempotencyKey },
        },
      })
    );
    const outcomes = workers.map(collectWorkerOutcome);
    let settled: WorkerOutcome[] | undefined;
    let workersCompleted = false;
    try {
      await waitForBarrier(signal, 2);
      Atomics.store(signal, 1, 1);
      Atomics.notify(signal, 1, 2);
      settled = await Promise.all(outcomes);
      workersCompleted = true;
    } finally {
      Atomics.store(signal, 1, 1);
      Atomics.notify(signal, 1, 2);
      if (!workersCompleted) {
        await Promise.all(workers.map((worker) => worker.terminate()));
      }
    }
    assert.ok(settled);
    assert.equal(settled.filter((outcome) => outcome.ok).length, 1);
    const conflict = settled.find((outcome) => !outcome.ok);
    assert.deepEqual(conflict, {
      ok: false,
      code: "slot_unavailable",
      status: 409,
      retryable: false,
    });

    const verification = openControlledSqliteConnection(databasePath);
    try {
      assert.equal(scalar(verification, "SELECT count(*) AS value FROM schedule_entries"), 1);
      assert.equal(scalar(verification, "SELECT count(*) AS value FROM audit_events"), 1);
      assert.equal(scalar(verification, "SELECT count(*) AS value FROM idempotency_requests"), 1);
    } finally {
      verification.close();
    }
  });

  it("maps a real busy timeout to retryable 503 and permits an idempotent retry", async () => {
    const databasePath = createDatabasePath("busy");
    const store = openSqliteScheduleStore(databasePath, { clock: fixedClock });
    try {
      const [staffMember] = await store.repository.listStaffMembers();
      const barrier = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
      const signal = new Int32Array(barrier);
      const locker = new Worker(LOCK_WORKER_SOURCE, {
        eval: true,
        workerData: {
          modulePath: path.join(__dirname, "connection.js"),
          databasePath,
          barrier,
        },
      });
      const lockerOutcome = collectWorkerOutcome(locker);
      const command: CreateBookingCommand = {
        idempotencyKey: "busy-retry-key",
        staffMemberId: staffMember.id,
        slotDate: "2026-08-09",
        slotTime: "10:00",
        customerName: "虛構忙碌測試顧客",
        customerPhone: "0900-000-606",
        note: "不得出現在錯誤",
      };
      let busyError: unknown;
      const startedAt = Date.now();
      let lockerResult: WorkerOutcome | undefined;
      let lockerCompleted = false;
      try {
        await waitForBarrier(signal, 1);
        try {
          await store.repository.createCustomerBooking(command);
          assert.fail("busy write unexpectedly succeeded");
        } catch (error) {
          busyError = error;
        }
        const elapsed = Date.now() - startedAt;
        assert.equal(busyError instanceof ScheduleDataError, true);
        if (busyError instanceof ScheduleDataError) {
          assert.equal(busyError.code, "temporarily_unavailable");
          assert.equal(busyError.status, 503);
          assert.equal(busyError.retryable, true);
        }
        assert.equal(elapsed >= SQLITE_BUSY_TIMEOUT_MS - 250, true);

        const safe = toSafeScheduleErrorResponse(busyError);
        assert.deepEqual(safe, {
          status: 503,
          body: {
            error: "temporarily_unavailable",
            message: "The schedule service is temporarily unavailable. Please retry.",
            retryable: true,
          },
        });
        const safeJson = JSON.stringify(safe);
        for (const forbidden of [
          "SQLITE",
          databasePath,
          command.customerName,
          command.customerPhone,
          command.note ?? "",
          "stack",
        ]) {
          assert.equal(safeJson.includes(forbidden), false);
        }
      } finally {
        Atomics.store(signal, 1, 1);
        Atomics.notify(signal, 1, 1);
        try {
          lockerResult = await lockerOutcome;
          lockerCompleted = true;
        } finally {
          if (!lockerCompleted) await locker.terminate();
        }
      }
      assert.deepEqual(lockerResult, { ok: true });

      const retry = await store.repository.createCustomerBooking(command);
      assert.equal(retry.replayed, false);
      const inspection = openControlledSqliteConnection(databasePath);
      try {
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM schedule_entries"), 1);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM audit_events"), 1);
        assert.equal(scalar(inspection, "SELECT count(*) AS value FROM idempotency_requests"), 1);
      } finally {
        inspection.close();
      }
    } finally {
      store.close();
    }
  });

  it("serializes unknown failures without database details or PII", () => {
    const internal = new Error(
      "SQLITE_ERROR SELECT * FROM schedule_entries C:\\secret\\customer.db "
      + "虛構顧客 0900-000-707 private note",
    );
    internal.stack = `${internal.message}\ninternal stack`;
    const response = toSafeScheduleErrorResponse(internal);
    assert.equal(response.status, 500);
    assert.equal(response.body.error, "storage_failure");
    const serialized = JSON.stringify(response);
    for (const forbidden of [
      "SQLITE",
      "SELECT",
      "customer.db",
      "虛構顧客",
      "0900-000-707",
      "private note",
      "stack",
    ]) {
      assert.equal(serialized.includes(forbidden), false);
    }
  });
});
