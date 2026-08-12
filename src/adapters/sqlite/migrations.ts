import { createHash } from "node:crypto";
import type { ControlledSqliteConnection } from "./connection";

export const SCHEDULE_SCHEMA_TABLES = [
  "audit_events",
  "customer_data_verifications",
  "idempotency_requests",
  "schedule_entries",
  "schema_migrations",
  "service_definitions",
  "staff_availability_windows",
  "staff_members",
  "staff_time_blocks",
] as const;

export const FORMAL_AUTH_SCHEMA_TABLES = [
  "account",
  "auth_rate_limits",
  "session",
  "user",
  "verification",
] as const;

interface ScheduleMigration {
  version: number;
  name: string;
  sql: string;
}

interface AppliedMigrationRow {
  version: number;
  name: string;
  checksum: string;
}

export class ScheduleMigrationIntegrityError extends Error {
  readonly name = "ScheduleMigrationIntegrityError";

  constructor(
    readonly code:
      | "unknown_migration"
      | "migration_order_invalid"
      | "migration_checksum_mismatch"
      | "migration_name_mismatch"
      | "migration_apply_failed",
  ) {
    super("The schedule database migration history failed integrity checks.");
  }
}

const MIGRATIONS: readonly ScheduleMigration[] = [
  {
    version: 1,
    name: "create_schedule_core",
    sql: `
CREATE TABLE staff_members (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  public_label TEXT NOT NULL CHECK (length(trim(public_label)) > 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at_utc TEXT NOT NULL,
  UNIQUE (role, public_label)
);

CREATE TABLE service_definitions (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  code TEXT NOT NULL UNIQUE CHECK (code = 'standard_booking'),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes = 60),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active = 1),
  created_at_utc TEXT NOT NULL
);

CREATE TABLE staff_availability_windows (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  staff_member_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time_minutes INTEGER NOT NULL CHECK (
    start_time_minutes BETWEEN 0 AND 1439
    AND start_time_minutes % 60 = 0
  ),
  end_time_minutes INTEGER NOT NULL CHECK (
    end_time_minutes BETWEEN 1 AND 1440
    AND end_time_minutes % 60 = 0
    AND end_time_minutes > start_time_minutes
  ),
  created_at_utc TEXT NOT NULL,
  UNIQUE (staff_member_id, weekday)
);

CREATE TABLE staff_time_blocks (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  staff_member_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
  block_date TEXT NOT NULL CHECK (
    block_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  start_time_minutes INTEGER NOT NULL CHECK (start_time_minutes BETWEEN 0 AND 1439),
  end_time_minutes INTEGER NOT NULL CHECK (
    end_time_minutes BETWEEN 1 AND 1440
    AND end_time_minutes > start_time_minutes
  ),
  created_at_utc TEXT NOT NULL
);

CREATE TABLE schedule_entries (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  kind TEXT NOT NULL CHECK (kind IN ('booking', 'note')),
  staff_member_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
  service_definition_id TEXT REFERENCES service_definitions(id) ON DELETE RESTRICT,
  slot_date TEXT NOT NULL CHECK (
    slot_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  slot_time_minutes INTEGER NOT NULL CHECK (
    slot_time_minutes BETWEEN 600 AND 1080
    AND slot_time_minutes % 60 = 0
  ),
  slot_starts_at_utc TEXT NOT NULL,
  duration_minutes INTEGER,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  note_text TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('customer', 'staff')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK (
    (
      kind = 'booking'
      AND service_definition_id IS NOT NULL
      AND duration_minutes = 60
      AND status = 'confirmed'
      AND customer_name IS NOT NULL
      AND length(trim(customer_name)) > 0
      AND customer_phone IS NOT NULL
      AND length(trim(customer_phone)) > 0
    )
    OR
    (
      kind = 'note'
      AND service_definition_id IS NULL
      AND duration_minutes IS NULL
      AND status IS NULL
      AND customer_name IS NULL
      AND customer_phone IS NULL
      AND source = 'staff'
      AND length(trim(note_text)) > 0
    )
  )
);

CREATE UNIQUE INDEX schedule_entries_booking_slot_unique
ON schedule_entries (staff_member_id, slot_date, slot_time_minutes)
WHERE kind = 'booking';

CREATE TABLE idempotency_requests (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  scope TEXT NOT NULL CHECK (length(trim(scope)) > 0),
  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) > 0),
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  resource_kind TEXT NOT NULL CHECK (resource_kind IN ('booking', 'note')),
  resource_id TEXT NOT NULL REFERENCES schedule_entries(id) ON DELETE RESTRICT,
  result_json TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  UNIQUE (scope, idempotency_key)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'staff', 'system')),
  actor_id TEXT,
  action TEXT NOT NULL CHECK (
    action IN ('schedule_entry.created', 'schedule_entry.note_updated')
  ),
  resource_type TEXT NOT NULL CHECK (resource_type = 'schedule_entry'),
  resource_id TEXT NOT NULL,
  resource_version INTEGER NOT NULL CHECK (resource_version >= 1),
  occurred_at_utc TEXT NOT NULL
);

CREATE TRIGGER service_definitions_immutable_update
BEFORE UPDATE ON service_definitions
BEGIN
  SELECT RAISE(ABORT, 'immutable service definition');
END;

CREATE TRIGGER service_definitions_immutable_delete
BEFORE DELETE ON service_definitions
BEGIN
  SELECT RAISE(ABORT, 'immutable service definition');
END;
`,
  },
  {
    version: 2,
    name: "add_better_auth_1_6_26",
    sql: `
CREATE TABLE "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL,
  "image" TEXT,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL,
  "username" TEXT UNIQUE,
  "displayUsername" TEXT
);

CREATE TABLE "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" DATE NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATE,
  "refreshTokenExpiresAt" DATE,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE TABLE "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATE NOT NULL,
  "createdAt" DATE NOT NULL,
  "updatedAt" DATE NOT NULL
);

CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE auth_rate_limits (
  key_hash TEXT PRIMARY KEY NOT NULL CHECK (length(key_hash) = 64),
  failure_count INTEGER NOT NULL CHECK (failure_count BETWEEN 0 AND 5),
  window_started_at_utc TEXT NOT NULL,
  blocked_until_utc TEXT,
  updated_at_utc TEXT NOT NULL
);

CREATE INDEX auth_rate_limits_updated_at_idx
ON auth_rate_limits (updated_at_utc);

ALTER TABLE staff_members
ADD COLUMN auth_user_id TEXT REFERENCES "user" ("id") ON DELETE RESTRICT;

CREATE UNIQUE INDEX staff_members_auth_user_id_unique
ON staff_members (auth_user_id)
WHERE auth_user_id IS NOT NULL;
`,
  },
  {
    version: 3,
    name: "add_cross_device_schedule_and_anonymization",
    sql: `
PRAGMA defer_foreign_keys = ON;

ALTER TABLE idempotency_requests RENAME TO idempotency_requests_v2;
ALTER TABLE schedule_entries RENAME TO schedule_entries_v2;
DROP INDEX schedule_entries_booking_slot_unique;

CREATE TABLE schedule_entries (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  kind TEXT NOT NULL CHECK (kind IN ('booking', 'note')),
  staff_member_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
  service_definition_id TEXT REFERENCES service_definitions(id) ON DELETE RESTRICT,
  slot_date TEXT NOT NULL CHECK (
    slot_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  slot_time_minutes INTEGER NOT NULL CHECK (
    slot_time_minutes BETWEEN 600 AND 1080
    AND slot_time_minutes % 60 = 0
  ),
  slot_starts_at_utc TEXT NOT NULL,
  duration_minutes INTEGER,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  title_text TEXT,
  note_text TEXT NOT NULL DEFAULT '',
  anonymized_at_utc TEXT,
  source TEXT NOT NULL CHECK (source IN ('customer', 'staff')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK (
    (
      kind = 'booking'
      AND service_definition_id IS NOT NULL
      AND duration_minutes = 60
      AND status = 'confirmed'
      AND title_text IS NULL
      AND (
        (
          anonymized_at_utc IS NULL
          AND customer_name IS NOT NULL
          AND length(trim(customer_name)) > 0
          AND customer_phone IS NOT NULL
          AND length(trim(customer_phone)) > 0
        )
        OR
        (
          anonymized_at_utc IS NOT NULL
          AND customer_name IS NULL
          AND customer_phone IS NULL
          AND note_text = ''
        )
      )
    )
    OR
    (
      kind = 'note'
      AND service_definition_id IS NULL
      AND duration_minutes IS NULL
      AND status IS NULL
      AND customer_name IS NULL
      AND customer_phone IS NULL
      AND title_text IS NOT NULL
      AND length(trim(title_text)) > 0
      AND anonymized_at_utc IS NULL
      AND source = 'staff'
      AND length(trim(note_text)) > 0
    )
  )
);

INSERT INTO schedule_entries (
  id, kind, staff_member_id, service_definition_id, slot_date,
  slot_time_minutes, slot_starts_at_utc, duration_minutes, status,
  customer_name, customer_phone, title_text, note_text, anonymized_at_utc,
  source, version, created_at_utc, updated_at_utc
)
SELECT
  id, kind, staff_member_id, service_definition_id, slot_date,
  slot_time_minutes, slot_starts_at_utc, duration_minutes, status,
  customer_name, customer_phone,
  CASE WHEN kind = 'note' THEN '文字註記' ELSE NULL END,
  note_text, NULL, source, version, created_at_utc, updated_at_utc
FROM schedule_entries_v2;

CREATE UNIQUE INDEX schedule_entries_booking_slot_unique
ON schedule_entries (staff_member_id, slot_date, slot_time_minutes)
WHERE kind = 'booking';

CREATE TABLE idempotency_requests (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  scope TEXT NOT NULL CHECK (length(trim(scope)) > 0),
  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) > 0),
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  resource_kind TEXT NOT NULL CHECK (resource_kind IN ('booking', 'note')),
  resource_id TEXT NOT NULL REFERENCES schedule_entries(id) ON DELETE RESTRICT,
  result_json TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  UNIQUE (scope, idempotency_key)
);

INSERT INTO idempotency_requests
SELECT * FROM idempotency_requests_v2;

DROP TABLE idempotency_requests_v2;
DROP TABLE schedule_entries_v2;

ALTER TABLE audit_events RENAME TO audit_events_v2;

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'staff', 'system')),
  actor_id TEXT,
  action TEXT NOT NULL CHECK (
    action IN (
      'schedule_entry.created',
      'schedule_entry.note_updated',
      'schedule_entry.anonymized'
    )
  ),
  resource_type TEXT NOT NULL CHECK (resource_type = 'schedule_entry'),
  resource_id TEXT NOT NULL,
  resource_version INTEGER NOT NULL CHECK (resource_version >= 1),
  occurred_at_utc TEXT NOT NULL
);

INSERT INTO audit_events SELECT * FROM audit_events_v2;
DROP TABLE audit_events_v2;

CREATE TABLE customer_data_verifications (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) >= 16),
  booking_entry_id TEXT NOT NULL REFERENCES schedule_entries(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose = 'anonymize_booking'),
  issued_by_staff_id TEXT NOT NULL REFERENCES staff_members(id) ON DELETE RESTRICT,
  issued_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  consumed_at_utc TEXT,
  consumed_by_staff_id TEXT REFERENCES staff_members(id) ON DELETE RESTRICT
);

CREATE INDEX customer_data_verifications_booking_idx
ON customer_data_verifications (booking_entry_id, expires_at_utc);
`,
  },
];

const SCHEMA_MIGRATIONS_BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL CHECK (version > 0),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  checksum TEXT NOT NULL CHECK (length(checksum) = 64),
  applied_at_utc TEXT NOT NULL
);
`;

export function scheduleMigrationChecksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

export function applyScheduleMigrations(
  database: ControlledSqliteConnection,
  now = new Date(),
  targetVersion = MIGRATIONS.length,
): void {
  try {
    if (!Number.isInteger(targetVersion) || targetVersion < 1 || targetVersion > MIGRATIONS.length) {
      throw new ScheduleMigrationIntegrityError("migration_order_invalid");
    }
    const migrationNames = new Set<string>();
    for (const [index, migration] of MIGRATIONS.entries()) {
      if (
        migration.version !== index + 1
        || migrationNames.has(migration.name)
      ) {
        throw new ScheduleMigrationIntegrityError("migration_order_invalid");
      }
      migrationNames.add(migration.name);
    }

    database.exec(SCHEMA_MIGRATIONS_BOOTSTRAP_SQL);
    const applied = database.prepare(`
      SELECT version, name, checksum
      FROM schema_migrations
      ORDER BY version ASC
    `).all() as AppliedMigrationRow[];

    for (const [index, row] of applied.entries()) {
      const migration = MIGRATIONS[index];
      if (!migration) {
        throw new ScheduleMigrationIntegrityError("unknown_migration");
      }
      if (migration.version !== row.version) {
        throw new ScheduleMigrationIntegrityError("unknown_migration");
      }
      if (migration.name !== row.name) {
        throw new ScheduleMigrationIntegrityError("migration_name_mismatch");
      }
      if (scheduleMigrationChecksum(migration.sql) !== row.checksum) {
        throw new ScheduleMigrationIntegrityError(
          "migration_checksum_mismatch",
        );
      }
    }

    const applyOne = database.transaction((migration: ScheduleMigration) => {
      database.exec(migration.sql);
      database.prepare(`
        INSERT INTO schema_migrations (
          version, name, checksum, applied_at_utc
        ) VALUES (?, ?, ?, ?)
      `).run(
        migration.version,
        migration.name,
        scheduleMigrationChecksum(migration.sql),
        now.toISOString(),
      );
    });

    for (const migration of MIGRATIONS.slice(0, targetVersion)) {
      if (!applied.some((row) => row.version === migration.version)) {
        applyOne.immediate(migration);
      }
    }
  } catch (error) {
    if (error instanceof ScheduleMigrationIntegrityError) throw error;
    throw new ScheduleMigrationIntegrityError("migration_apply_failed");
  }
}
