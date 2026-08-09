import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import {
  applyScheduleMigrations,
  openControlledSqliteConnection,
  provisionApprovedScheduleConfig,
} from "../../adapters/sqlite";
import {
  authorizeStaffCapability,
  resolveStaffActor,
} from "./authorization";
import {
  deactivateStaffAccount,
  provisionStaffAccount,
  rotateStaffPassword,
} from "./account-admin";
import { handleStaffAuthRequest } from "./handler";
import { createFormalAuthRuntime, type FormalAuthRuntime } from "./runtime";
import type { StaffAuthEnvironment } from "./environment";

const tempDirectories: string[] = [];
const ORIGIN = "https://staff-auth.example";
const SECRET = "formal-auth-test-secret-formal-auth-test-secret";
const OWNER_PASSWORD = "Owner-test-password-34!";
const STAFF_PASSWORD = "Staff-test-password-34!";

after(() => {
  for (const directory of tempDirectories) fs.rmSync(directory, { recursive: true, force: true });
});

function createHarness(deployment: "production" | "staging" = "production") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dum-auth-"));
  tempDirectories.push(directory);
  const databasePath = path.join(directory, "auth.sqlite");
  const database = openControlledSqliteConnection(databasePath);
  applyScheduleMigrations(database, new Date("2026-08-09T00:00:00.000Z"));
  provisionApprovedScheduleConfig(database, new Date("2026-08-09T00:00:00.000Z"));
  const environment: StaffAuthEnvironment = {
    deployment,
    baseURL: ORIGIN,
    origin: ORIGIN,
    expectedHost: "staff-auth.example",
    cookieName: deployment === "production"
      ? "__Host-dum-staff-session"
      : "__Host-dum-staging-staff-session",
    databasePath,
    secret: SECRET,
  };
  return { database, runtime: createFormalAuthRuntime(database, environment) };
}

function request(
  route: string,
  options: { method?: string; body?: unknown; cookie?: string; ip?: string; headers?: Record<string, string> } = {},
): Request {
  const method = options.method ?? "GET";
  const headers = new Headers({
    host: "staff-auth.example",
    "x-forwarded-proto": "https",
    "cf-connecting-ip": options.ip ?? "203.0.113.34",
  });
  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set("content-type", "application/json");
  }
  if (method === "POST") {
    headers.set("origin", ORIGIN);
    headers.set("sec-fetch-site", "same-origin");
  }
  for (const [name, value] of Object.entries(options.headers ?? {})) headers.set(name, value);
  if (options.cookie) headers.set("cookie", options.cookie);
  return new Request(`${ORIGIN}${route}`, { method, headers, body });
}

async function signIn(runtime: FormalAuthRuntime, username: string, password: string, ip?: string) {
  return handleStaffAuthRequest(request("/api/auth/sign-in/username", {
    method: "POST",
    body: { username, password },
    ip,
  }), runtime);
}

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  assert.ok(value);
  return value.split(";", 1)[0];
}

describe("formal staff authentication", () => {
  it("upgrades an existing #33 database without changing persisted schedule rows", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dum-auth-upgrade-"));
    tempDirectories.push(directory);
    const databasePath = path.join(directory, "legacy.sqlite");
    const legacy = openControlledSqliteConnection(databasePath);
    const noteId = "00000000-0000-4000-8000-000000000034";
    try {
      applyScheduleMigrations(legacy, new Date("2026-08-09T00:00:00.000Z"), 1);
      provisionApprovedScheduleConfig(legacy, new Date("2026-08-09T00:00:00.000Z"));
      const staff = legacy.prepare(`SELECT id FROM staff_members WHERE role = 'owner'`).get() as { id: string };
      legacy.prepare(`
        INSERT INTO schedule_entries (
          id, kind, staff_member_id, service_definition_id, slot_date,
          slot_time_minutes, slot_starts_at_utc, duration_minutes, status,
          customer_name, customer_phone, note_text, source, version,
          created_at_utc, updated_at_utc
        ) VALUES (?, 'note', ?, NULL, '2026-08-10', 600,
          '2026-08-10T02:00:00.000Z', NULL, NULL, NULL, NULL, 'legacy note',
          'staff', 1, '2026-08-09T00:00:00.000Z', '2026-08-09T00:00:00.000Z')
      `).run(noteId, staff.id);
    } finally { legacy.close(); }

    const upgraded = openControlledSqliteConnection(databasePath);
    try {
      applyScheduleMigrations(upgraded, new Date("2026-08-09T01:00:00.000Z"));
      const row = upgraded.prepare(`SELECT id, note_text, version FROM schedule_entries WHERE id = ?`).get(noteId);
      assert.deepEqual(row, { id: noteId, note_text: "legacy note", version: 1 });
      assert.equal((upgraded.prepare(`SELECT count(*) AS count FROM schema_migrations`).get() as { count: number }).count, 2);
      assert.equal((upgraded.prepare(`SELECT count(*) AS count FROM user`).get() as { count: number }).count, 0);
    } finally { upgraded.close(); }
  });

  it("migrates without auto-seeding auth records and enforces auth bindings", async () => {
    const { database, runtime } = createHarness();
    try {
      for (const table of ["user", "account", "session", "auth_rate_limits"]) {
        const row = database.prepare(`SELECT count(*) AS count FROM ${table}`).get() as { count: number };
        assert.equal(row.count, 0);
      }
      const owner = await provisionStaffAccount(database, {
        role: "owner", username: "owner.formal", password: OWNER_PASSWORD,
      });
      const account = database.prepare(`SELECT providerId, password FROM account WHERE userId = ?`).get(owner.authUserId) as { providerId: string; password: string };
      assert.equal(account.providerId, "credential");
      assert.notEqual(account.password, OWNER_PASSWORD);
      assert.equal((database.prepare(`SELECT count(*) AS count FROM session`).get() as { count: number }).count, 0);
      assert.throws(() => database.prepare(`UPDATE staff_members SET auth_user_id = ? WHERE role = 'staff'`).run(owner.authUserId));
    } finally { runtime.close(); database.close(); }
  });

  it("supports owner and staff login with minimal DTOs and exact secure cookies", async () => {
    const { database, runtime } = createHarness();
    try {
      await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      await provisionStaffAccount(database, { role: "staff", username: "staff.formal", password: STAFF_PASSWORD });
      for (const [username, password, role] of [
        ["owner.formal", OWNER_PASSWORD, "owner"],
        ["staff.formal", STAFF_PASSWORD, "staff"],
      ] as const) {
        const login = await signIn(runtime, username, password);
        assert.equal(login.status, 200);
        const text = await login.text();
        const dto = JSON.parse(text) as { staff: { role: string }; expiresAt: string };
        assert.equal(dto.staff.role, role);
        assert.doesNotMatch(text, /username|email|token|password|authUserId|ipAddress|userAgent/i);
        const setCookie = login.headers.get("set-cookie") ?? "";
        assert.match(setCookie, /^__Host-dum-staff-session=/);
        assert.match(setCookie, /HttpOnly/i);
        assert.match(setCookie, /Secure/i);
        assert.match(setCookie, /SameSite=Strict/i);
        assert.match(setCookie, /Path=\//i);
        assert.match(setCookie, /Max-Age=28800/i);
        assert.doesNotMatch(setCookie, /Domain=/i);

        const cookie = setCookie.split(";", 1)[0];
        const session = await handleStaffAuthRequest(request("/api/auth/get-session", { cookie }), runtime);
        assert.equal(session.status, 200);
        assert.equal(session.headers.has("set-cookie"), false);
        const actor = await resolveStaffActor(runtime, new Headers({ cookie }));
        assert.equal(authorizeStaffCapability(actor, "schedule:read").role, role);
        assert.equal(authorizeStaffCapability(actor, "booking:write").role, role);
      }
    } finally { runtime.close(); database.close(); }
  });

  it("returns indistinguishable failures for wrong, unknown, inactive, and unbound accounts", async () => {
    const { database, runtime } = createHarness();
    try {
      const owner = await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      const wrong = await signIn(runtime, "owner.formal", "Wrong-password-34!");
      const unknown = await signIn(runtime, "missing.formal", "Wrong-password-34!", "203.0.113.35");
      assert.equal(wrong.status, 401);
      assert.equal(unknown.status, 401);
      assert.equal(await wrong.text(), await unknown.text());
      assert.equal(wrong.headers.has("set-cookie"), false);

      database.prepare(`UPDATE staff_members SET auth_user_id = NULL WHERE id = ?`).run(owner.staffId);
      const unbound = await signIn(runtime, "owner.formal", OWNER_PASSWORD, "203.0.113.36");
      assert.equal(unbound.status, 401);
      assert.equal((database.prepare(`SELECT count(*) AS count FROM session WHERE userId = ?`).get(owner.authUserId) as { count: number }).count, 0);
      database.prepare(`UPDATE staff_members SET auth_user_id = ?, is_active = 0 WHERE id = ?`).run(owner.authUserId, owner.staffId);
      const inactive = await signIn(runtime, "owner.formal", OWNER_PASSWORD, "203.0.113.37");
      assert.equal(inactive.status, 401);
    } finally { runtime.close(); database.close(); }
  });

  it("expires, revokes, signs out, deactivates, and rotates sessions immediately", async () => {
    const { database, runtime } = createHarness();
    try {
      const owner = await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      let login = await signIn(runtime, "owner.formal", OWNER_PASSWORD);
      let cookie = cookieFrom(login);
      database.prepare(`UPDATE session SET expiresAt = ? WHERE userId = ?`).run("2020-01-01T00:00:00.000Z", owner.authUserId);
      assert.equal((await handleStaffAuthRequest(request("/api/auth/get-session", { cookie }), runtime)).status, 401);

      login = await signIn(runtime, "owner.formal", OWNER_PASSWORD, "203.0.113.40");
      cookie = cookieFrom(login);
      await rotateStaffPassword(database, owner.staffId, "New-owner-password-34!");
      assert.equal((await handleStaffAuthRequest(request("/api/auth/get-session", { cookie }), runtime)).status, 401);
      login = await signIn(runtime, "owner.formal", "New-owner-password-34!", "203.0.113.41");
      cookie = cookieFrom(login);
      const logout = await handleStaffAuthRequest(request("/api/auth/sign-out", { method: "POST", body: {}, cookie }), runtime);
      assert.equal(logout.status, 200);
      assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);

      login = await signIn(runtime, "owner.formal", "New-owner-password-34!", "203.0.113.42");
      cookie = cookieFrom(login);
      deactivateStaffAccount(database, owner.staffId);
      assert.equal((await handleStaffAuthRequest(request("/api/auth/get-session", { cookie }), runtime)).status, 401);
    } finally { runtime.close(); database.close(); }
  });

  it("rate-limits normalized username and trusted IP pairs atomically", async () => {
    const { database, runtime } = createHarness();
    try {
      await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      for (let index = 0; index < 5; index += 1) {
        assert.equal((await signIn(runtime, "OWNER.FORMAL", "Wrong-password-34!")).status, 401);
      }
      const blocked = await signIn(runtime, "owner.formal", "Wrong-password-34!");
      assert.equal(blocked.status, 429);
      assert.match(blocked.headers.get("retry-after") ?? "", /^\d+$/);
      assert.equal((await signIn(runtime, "owner.formal", OWNER_PASSWORD, "203.0.113.99")).status, 200);
      const stored = database.prepare(`SELECT key_hash FROM auth_rate_limits`).all() as Array<{ key_hash: string }>;
      assert.ok(stored.length >= 1);
      assert.ok(stored.every(({ key_hash }) => /^[a-f0-9]{64}$/.test(key_hash)));
      assert.doesNotMatch(JSON.stringify(stored), /owner|203\.0\.113/);
    } finally { runtime.close(); database.close(); }
  });

  it("fails closed on origin, host, proxy, IP, body, route, and redirect-shaped input", async () => {
    const { database, runtime } = createHarness();
    try {
      await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      const body = { username: "owner.formal", password: OWNER_PASSWORD };
      const rejectedHeaders: Array<Record<string, string>> = [
        { origin: "https://evil.example" },
        { "sec-fetch-site": "cross-site" },
        { host: "evil.example" },
        { "x-forwarded-proto": "http" },
        { "cf-connecting-ip": "203.0.113.1, 203.0.113.2" },
      ];
      for (const headers of rejectedHeaders) {
        const response = await handleStaffAuthRequest(request("/api/auth/sign-in/username", { method: "POST", body, headers }), runtime);
        assert.ok([400, 403].includes(response.status));
        assert.equal(response.headers.has("set-cookie"), false);
      }
      const extra = await handleStaffAuthRequest(request("/api/auth/sign-in/username", { method: "POST", body: { ...body, callbackURL: "https://evil.example" } }), runtime);
      assert.equal(extra.status, 400);
      const signup = await handleStaffAuthRequest(request("/api/auth/sign-up/email", { method: "POST", body }), runtime);
      assert.equal(signup.status, 404);
      const oversized = await handleStaffAuthRequest(request("/api/auth/sign-in/username", {
        method: "POST", body, headers: { "content-length": "9000" },
      }), runtime);
      assert.equal(oversized.status, 413);
    } finally { runtime.close(); database.close(); }
  });

  it("uses an isolated staging cookie name", async () => {
    const { database, runtime } = createHarness("staging");
    try {
      await provisionStaffAccount(database, { role: "owner", username: "owner.formal", password: OWNER_PASSWORD });
      const response = await signIn(runtime, "owner.formal", OWNER_PASSWORD);
      assert.match(response.headers.get("set-cookie") ?? "", /^__Host-dum-staging-staff-session=/);
      assert.doesNotMatch(response.headers.get("set-cookie") ?? "", /__Secure-__Host/);
    } finally { runtime.close(); database.close(); }
  });
});
