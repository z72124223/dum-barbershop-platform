import type { EntityId, IsoInstant } from "./common";
import type { StaffRole } from "./staff";

export type StaffPermission =
  | "schedule:read"
  | "booking:write"
  | "customer:read"
  | "customer:read_assigned"
  | "settings:preview"
  | "integration:read";

export interface StaffIdentity {
  id: EntityId;
  accountId: string;
  displayName: string;
  role: StaffRole;
  staffId?: EntityId;
}

export interface StaffIdentitySession {
  version: 1;
  mode: "mock";
  authenticated: true;
  sessionId: string;
  identity: StaffIdentity;
  permissions: StaffPermission[];
  issuedAt: IsoInstant;
  expiresAt: IsoInstant;
}

export interface StaffSignInInput {
  accountId: string;
  accessCode: string;
}

export type StaffSignInFailureReason = "invalid_credentials" | "account_disabled";

export type StaffSignInResult =
  | { ok: true; session: StaffIdentitySession }
  | { ok: false; reason: StaffSignInFailureReason };

export interface StaffDemoAccount {
  id: EntityId;
  accountId: string;
  displayName: string;
  role: StaffRole;
  staffId?: EntityId;
  accessCode: string;
  active: boolean;
}
