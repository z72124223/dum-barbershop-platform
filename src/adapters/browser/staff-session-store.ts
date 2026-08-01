import {
  STAFF_SESSION_COOKIE_NAME,
  STAFF_SESSION_TTL_MS,
  parseStaffIdentitySession,
  type StaffIdentitySession,
} from "../../domain";
import type { StaffSessionStore } from "../ports";

export const STAFF_SESSION_STORAGE_KEY = "dum.staff.mock-session.v2";

export class BrowserStaffSessionStore implements StaffSessionStore {
  load(): StaffIdentitySession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STAFF_SESSION_STORAGE_KEY);
      if (!raw) return null;
      return parseStaffIdentitySession(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  save(session: StaffIdentitySession): boolean {
    if (typeof window === "undefined") return false;
    try {
      const serialized = JSON.stringify(session);
      window.localStorage.setItem(STAFF_SESSION_STORAGE_KEY, serialized);
      document.cookie = `${STAFF_SESSION_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/staff; Max-Age=${STAFF_SESSION_TTL_MS / 1000}; SameSite=Lax`;
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STAFF_SESSION_STORAGE_KEY);
    } catch {}
    try {
      document.cookie = `${STAFF_SESSION_COOKIE_NAME}=; Path=/staff; Max-Age=0; SameSite=Lax`;
    } catch {}
  }
}
