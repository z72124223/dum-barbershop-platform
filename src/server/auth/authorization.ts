import type { FormalAuthRuntime } from "./runtime";

export type FormalStaffRole = "owner" | "staff";
export type StaffCapability =
  | "schedule:read"
  | "booking:write"
  | "note:write"
  | "customer-data:verify"
  | "customer-data:anonymize";

export interface AuthenticatedStaffActor {
  authUserId: string;
  staffId: string;
  role: FormalStaffRole;
  label: string;
  expiresAt: string;
}

export interface PublicStaffSession {
  authenticated: true;
  staff: {
    id: string;
    role: FormalStaffRole;
    label: string;
  };
  expiresAt: string;
}

export class StaffAuthorizationError extends Error {
  readonly name = "StaffAuthorizationError";

  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Authentication required." : "Access denied.");
  }
}

const ROLE_CAPABILITIES: Record<
  FormalStaffRole,
  ReadonlySet<StaffCapability>
> = {
  owner: new Set([
    "schedule:read",
    "booking:write",
    "note:write",
    "customer-data:verify",
    "customer-data:anonymize",
  ]),
  staff: new Set([
    "schedule:read",
    "booking:write",
    "note:write",
    "customer-data:anonymize",
  ]),
};

export interface BetterAuthSessionData {
  user: { id: string };
  session: { expiresAt: Date | string };
}

interface StaffBindingRow {
  id: string;
  role: FormalStaffRole;
  public_label: string;
  is_active: number;
  credential_count: number;
}

export async function resolveStaffActor(
  runtime: FormalAuthRuntime,
  headers: Headers,
): Promise<AuthenticatedStaffActor> {
  const session = await readBetterAuthSession(runtime, headers);
  if (!session?.user?.id || !session.session) {
    throw new StaffAuthorizationError(401);
  }

  const binding = runtime.database.prepare(`
    SELECT
      staff_members.id,
      staff_members.role,
      staff_members.public_label,
      staff_members.is_active,
      (
        SELECT count(*)
        FROM account
        WHERE account.userId = staff_members.auth_user_id
          AND account.providerId = 'credential'
          AND account.password IS NOT NULL
      ) AS credential_count
    FROM staff_members
    WHERE staff_members.auth_user_id = ?
  `).get(session.user.id) as StaffBindingRow | undefined;

  if (!binding) throw new StaffAuthorizationError(403);
  if (binding.is_active !== 1 || binding.credential_count !== 1) {
    throw new StaffAuthorizationError(401);
  }

  const expiresAt = session.session.expiresAt instanceof Date
    ? session.session.expiresAt.toISOString()
    : new Date(session.session.expiresAt).toISOString();

  return {
    authUserId: session.user.id,
    staffId: binding.id,
    role: binding.role,
    label: binding.public_label,
    expiresAt,
  };
}

export async function readBetterAuthSession(
  runtime: FormalAuthRuntime,
  headers: Headers,
): Promise<BetterAuthSessionData | null> {
  return await runtime.auth.api.getSession({ headers }) as
    | BetterAuthSessionData
    | null;
}

export function authorizeStaffCapability(
  actor: AuthenticatedStaffActor,
  capability: StaffCapability,
): AuthenticatedStaffActor {
  if (!ROLE_CAPABILITIES[actor.role].has(capability)) {
    throw new StaffAuthorizationError(403);
  }
  return actor;
}

export function toPublicStaffSession(
  actor: AuthenticatedStaffActor,
): PublicStaffSession {
  return {
    authenticated: true,
    staff: {
      id: actor.staffId,
      role: actor.role,
      label: actor.label,
    },
    expiresAt: actor.expiresAt,
  };
}
