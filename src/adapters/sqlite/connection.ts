import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export const SQLITE_BUSY_TIMEOUT_MS = 5_000;

export class ScheduleDatabaseInitializationError extends Error {
  readonly name = "ScheduleDatabaseInitializationError";

  constructor(
    readonly code:
      | "invalid_database_path"
      | "database_open_failed"
      | "pragma_verification_failed",
  ) {
    super("The schedule database could not be initialized safely.");
  }
}

export type ControlledSqliteConnection = Database.Database;

function assertLocalDatabasePath(filename: string): void {
  const normalized = filename.trim();
  const looksRemote = normalized.startsWith("\\\\")
    || normalized.startsWith("//")
    || /^file:/i.test(normalized)
    || /(?:^|[\\/])OneDrive(?:[\\/]|$)/i.test(normalized);

  if (!normalized || !path.isAbsolute(normalized) || looksRemote) {
    throw new ScheduleDatabaseInitializationError("invalid_database_path");
  }
}

function verifyPragmas(database: ControlledSqliteConnection): void {
  const foreignKeys = database.pragma("foreign_keys", { simple: true });
  const journalMode = database.pragma("journal_mode", { simple: true });
  const synchronous = database.pragma("synchronous", { simple: true });
  const secureDelete = database.pragma("secure_delete", { simple: true });
  const busyTimeout = database.pragma("busy_timeout", { simple: true });

  if (
    foreignKeys !== 1
    || String(journalMode).toLowerCase() !== "wal"
    || synchronous !== 2
    || secureDelete !== 1
    || busyTimeout !== SQLITE_BUSY_TIMEOUT_MS
  ) {
    throw new ScheduleDatabaseInitializationError(
      "pragma_verification_failed",
    );
  }
}

export function openControlledSqliteConnection(
  filename: string,
): ControlledSqliteConnection {
  assertLocalDatabasePath(filename);

  let database: ControlledSqliteConnection | null = null;
  try {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    database = new Database(filename);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = FULL");
    database.pragma("secure_delete = ON");
    database.pragma(`busy_timeout = ${SQLITE_BUSY_TIMEOUT_MS}`);
    verifyPragmas(database);
    return database;
  } catch (error) {
    database?.close();
    if (error instanceof ScheduleDatabaseInitializationError) throw error;
    throw new ScheduleDatabaseInitializationError("database_open_failed");
  }
}
