import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { ControlledSqliteConnection } from "../../adapters/sqlite/connection";
import {
  STAFF_LOGIN_BLOCK_MS,
  STAFF_LOGIN_MAX_FAILURES,
  STAFF_LOGIN_WINDOW_MS,
  STAFF_RATE_LIMIT_RETENTION_MS,
} from "./constants";

interface RateLimitRow {
  failure_count: number;
  window_started_at_utc: string;
  blocked_until_utc: string | null;
  updated_at_utc: string;
}

export interface LoginRateLimitState {
  blocked: boolean;
  retryAfterSeconds: number;
}

export class StaffLoginRateLimiter {
  constructor(
    private readonly database: ControlledSqliteConnection,
    private readonly secret: string,
  ) {}

  normalizeUsername(username: string): string {
    return username.trim().toLocaleLowerCase("en-US");
  }

  normalizeClientIp(value: string): string | null {
    const candidate = value.trim();
    const version = isIP(candidate);
    if (!version || candidate.includes(",")) return null;
    if (version === 4) return candidate;
    try {
      return new URL(`http://[${candidate}]/`).hostname.slice(1, -1).toLowerCase();
    } catch {
      return null;
    }
  }

  inspect(username: string, clientIp: string, now: Date): LoginRateLimitState {
    const keyHash = this.keyHash(username, clientIp);
    const row = this.read(keyHash);
    if (!row) return { blocked: false, retryAfterSeconds: 0 };

    const blockedUntil = row.blocked_until_utc
      ? new Date(row.blocked_until_utc).getTime()
      : Number.NaN;
    if (Number.isFinite(blockedUntil) && blockedUntil > now.getTime()) {
      return {
        blocked: true,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((blockedUntil - now.getTime()) / 1_000),
        ),
      };
    }
    return { blocked: false, retryAfterSeconds: 0 };
  }

  recordFailure(username: string, clientIp: string, now: Date): LoginRateLimitState {
    const keyHash = this.keyHash(username, clientIp);
    const update = this.database.transaction(() => {
      const existing = this.read(keyHash);
      const timestamp = now.toISOString();
      const existingWindow = existing
        ? new Date(existing.window_started_at_utc).getTime()
        : Number.NaN;
      const windowExpired = !Number.isFinite(existingWindow)
        || now.getTime() - existingWindow >= STAFF_LOGIN_WINDOW_MS;
      const failureCount = windowExpired
        ? 1
        : Math.min(STAFF_LOGIN_MAX_FAILURES, existing!.failure_count + 1);
      const windowStartedAt = windowExpired
        ? timestamp
        : existing!.window_started_at_utc;
      const blockedUntil = failureCount >= STAFF_LOGIN_MAX_FAILURES
        ? new Date(now.getTime() + STAFF_LOGIN_BLOCK_MS).toISOString()
        : null;

      this.database.prepare(`
        INSERT INTO auth_rate_limits (
          key_hash,
          failure_count,
          window_started_at_utc,
          blocked_until_utc,
          updated_at_utc
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (key_hash) DO UPDATE SET
          failure_count = excluded.failure_count,
          window_started_at_utc = excluded.window_started_at_utc,
          blocked_until_utc = excluded.blocked_until_utc,
          updated_at_utc = excluded.updated_at_utc
      `).run(
        keyHash,
        failureCount,
        windowStartedAt,
        blockedUntil,
        timestamp,
      );
      return failureCount;
    });

    const count = update.immediate();
    return {
      blocked: count >= STAFF_LOGIN_MAX_FAILURES,
      retryAfterSeconds: count >= STAFF_LOGIN_MAX_FAILURES
        ? STAFF_LOGIN_BLOCK_MS / 1_000
        : 0,
    };
  }

  clear(username: string, clientIp: string): void {
    this.database.prepare(`
      DELETE FROM auth_rate_limits WHERE key_hash = ?
    `).run(this.keyHash(username, clientIp));
  }

  purge(now: Date): number {
    const cutoff = new Date(
      now.getTime() - STAFF_RATE_LIMIT_RETENTION_MS,
    ).toISOString();
    return this.database.prepare(`
      DELETE FROM auth_rate_limits WHERE updated_at_utc <= ?
    `).run(cutoff).changes;
  }

  private keyHash(username: string, clientIp: string): string {
    return createHmac("sha256", this.secret)
      .update(this.normalizeUsername(username), "utf8")
      .update("\0", "utf8")
      .update(clientIp, "utf8")
      .digest("hex");
  }

  private read(keyHash: string): RateLimitRow | undefined {
    return this.database.prepare(`
      SELECT
        failure_count,
        window_started_at_utc,
        blocked_until_utc,
        updated_at_utc
      FROM auth_rate_limits
      WHERE key_hash = ?
    `).get(keyHash) as RateLimitRow | undefined;
  }
}
