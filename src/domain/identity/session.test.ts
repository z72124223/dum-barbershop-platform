import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StaffIdentitySession } from "../models";
import {
  STAFF_SESSION_TTL_MS,
  canStaffRole,
  isStaffSessionActive,
  normalizeStaffNextPath,
  parseStaffIdentitySession,
  permissionsForStaffRole,
} from "./session";

const issuedAt = "2026-07-18T02:00:00.000Z";
const session: StaffIdentitySession = {
  version: 1,
  mode: "mock",
  authenticated: true,
  sessionId: "mock-session-owner",
  identity: { id: "staff-owner", accountId: "owner.demo", displayName: "店主示範帳號", role: "owner" },
  permissions: permissionsForStaffRole("owner"),
  issuedAt,
  expiresAt: new Date(new Date(issuedAt).getTime() + STAFF_SESSION_TTL_MS).toISOString(),
};

describe("Staff identity session", () => {
  it("parses valid mock sessions and rejects malformed values", () => {
    assert.deepEqual(parseStaffIdentitySession(session), session);
    assert.equal(parseStaffIdentitySession({ ...session, authenticated: false }), null);
    assert.equal(parseStaffIdentitySession({ ...session, permissions: ["root:all"] }), null);
  });

  it("accepts active sessions and rejects expired or future-issued sessions", () => {
    assert.equal(isStaffSessionActive(session, "2026-07-18T03:00:00.000Z"), true);
    assert.equal(isStaffSessionActive(session, session.expiresAt), false);
    assert.equal(isStaffSessionActive(session, "2026-07-18T01:59:59.000Z"), false);
  });

  it("keeps role permissions centralized", () => {
    assert.equal(canStaffRole("manager", "integration:read"), true);
    assert.equal(canStaffRole("barber", "customer:read_assigned"), true);
    assert.equal(canStaffRole("read_only", "booking:write"), false);
  });

  it("only allows safe Staff return paths", () => {
    assert.equal(normalizeStaffNextPath("/staff/operations?view=week"), "/staff/operations?view=week");
    assert.equal(normalizeStaffNextPath("/staff/login?next=/staff"), "/staff");
    assert.equal(normalizeStaffNextPath("//attacker.example"), "/staff");
    assert.equal(normalizeStaffNextPath("/booking"), "/staff");
    assert.equal(normalizeStaffNextPath(["/staff", "/staff/operations"]), "/staff");
    assert.equal(normalizeStaffNextPath("/staff-impersonation"), "/staff");
  });
});
