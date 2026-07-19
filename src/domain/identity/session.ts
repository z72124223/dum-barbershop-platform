import type {
  StaffIdentitySession,
  StaffPermission,
  StaffRole,
} from "../models";

export const STAFF_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const STAFF_SESSION_COOKIE_NAME = "dum_staff_mock_session_v1";

const STAFF_ROLES: StaffRole[] = ["owner", "manager", "barber", "reception", "read_only"];
const STAFF_PERMISSIONS: StaffPermission[] = [
  "schedule:read",
  "booking:write",
  "customer:read",
  "customer:read_assigned",
  "settings:preview",
  "integration:read",
];

const ROLE_PERMISSIONS: Record<StaffRole, readonly StaffPermission[]> = {
  owner: ["schedule:read", "booking:write", "customer:read", "settings:preview", "integration:read"],
  manager: ["schedule:read", "booking:write", "customer:read", "settings:preview", "integration:read"],
  barber: ["schedule:read", "booking:write", "customer:read_assigned"],
  reception: ["schedule:read", "booking:write", "customer:read"],
  read_only: ["schedule:read"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && STAFF_ROLES.includes(value as StaffRole);
}

function isStaffPermission(value: unknown): value is StaffPermission {
  return typeof value === "string" && STAFF_PERMISSIONS.includes(value as StaffPermission);
}

export function permissionsForStaffRole(role: StaffRole): StaffPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function canStaffRole(role: StaffRole, permission: StaffPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function parseStaffIdentitySession(value: unknown): StaffIdentitySession | null {
  if (!isRecord(value) || value.version !== 1 || value.mode !== "mock" || value.authenticated !== true) {
    return null;
  }
  if (
    typeof value.sessionId !== "string" ||
    typeof value.issuedAt !== "string" ||
    typeof value.expiresAt !== "string" ||
    !Array.isArray(value.permissions) ||
    !value.permissions.every(isStaffPermission) ||
    !isRecord(value.identity) ||
    typeof value.identity.id !== "string" ||
    typeof value.identity.accountId !== "string" ||
    typeof value.identity.displayName !== "string" ||
    (value.identity.staffId !== undefined && typeof value.identity.staffId !== "string") ||
    !isStaffRole(value.identity.role)
  ) {
    return null;
  }

  return {
    version: 1,
    mode: "mock",
    authenticated: true,
    sessionId: value.sessionId,
    identity: {
      id: value.identity.id,
      accountId: value.identity.accountId,
      displayName: value.identity.displayName,
      role: value.identity.role,
      ...(typeof value.identity.staffId === "string" ? { staffId: value.identity.staffId } : {}),
    },
    permissions: [...value.permissions],
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
  };
}

export function isStaffSessionActive(session: StaffIdentitySession, now: string): boolean {
  const issuedAt = new Date(session.issuedAt).getTime();
  const expiresAt = new Date(session.expiresAt).getTime();
  const current = new Date(now).getTime();
  return Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && Number.isFinite(current)
    && issuedAt <= current
    && current < expiresAt
    && expiresAt - issuedAt === STAFF_SESSION_TTL_MS;
}

export function normalizeStaffNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\/staff(?:\/|\?|$)/.test(value) ||
    value.startsWith("/staff/login") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  ) {
    return "/staff";
  }
  return value;
}
