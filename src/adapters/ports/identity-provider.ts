import type {
  IsoInstant,
  StaffDemoAccount,
  StaffIdentitySession,
  StaffSignInInput,
  StaffSignInResult,
} from "../../domain";

export interface IdentityProvider {
  listDemoAccounts(): Promise<Omit<StaffDemoAccount, "accessCode">[]>;
  signIn(input: StaffSignInInput, now?: IsoInstant): Promise<StaffSignInResult>;
  restoreSession(session: StaffIdentitySession, now?: IsoInstant): Promise<StaffIdentitySession | null>;
  signOut(sessionId: string): Promise<void>;
}

export interface StaffSessionStore {
  load(): StaffIdentitySession | null;
  save(session: StaffIdentitySession): boolean;
  clear(): void;
}
