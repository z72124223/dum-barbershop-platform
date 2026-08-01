"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BrowserStaffSessionStore,
  MockIdentityProvider,
} from "../../adapters";
import type {
  StaffDemoAccount,
  StaffIdentitySession,
} from "../../domain";

type StaffAuthStatus = "checking" | "authenticated" | "unauthenticated";
type PublicDemoAccount = Omit<StaffDemoAccount, "accessCode">;

interface StaffAuthContextValue {
  status: StaffAuthStatus;
  session: StaffIdentitySession | null;
  accounts: PublicDemoAccount[];
  signIn(accountId: string, accessCode: string): Promise<"success" | "invalid_credentials" | "account_disabled" | "storage_unavailable">;
  signOut(): Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextValue | null>(null);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const identity = useMemo(() => new MockIdentityProvider(), []);
  const store = useMemo(() => new BrowserStaffSessionStore(), []);
  const [status, setStatus] = useState<StaffAuthStatus>("checking");
  const [session, setSession] = useState<StaffIdentitySession | null>(null);
  const [accounts, setAccounts] = useState<PublicDemoAccount[]>([]);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const availableAccounts = await identity.listDemoAccounts();
        const storedSession = store.load();
        const restored = storedSession ? await identity.restoreSession(storedSession) : null;
        if (!active) return;
        setAccounts(availableAccounts);
        if (restored) {
          setSession(restored);
          setStatus("authenticated");
          return;
        }
      } catch {
        if (!active) return;
      }
      if (active) {
        store.clear();
        setSession(null);
        setStatus("unauthenticated");
      }
    }
    void restore();
    return () => { active = false; };
  }, [identity, store]);

  useEffect(() => {
    if (!session) return;
    const currentSession: StaffIdentitySession = session;
    let active = true;
    async function revalidate() {
      const restored = await identity.restoreSession(currentSession);
      if (!active || restored) return;
      store.clear();
      setSession(null);
      setStatus("unauthenticated");
    }
    const remaining = Math.max(0, new Date(currentSession.expiresAt).getTime() - Date.now());
    const timeout = window.setTimeout(() => void revalidate(), remaining + 25);
    const onVisibility = () => { if (document.visibilityState === "visible") void revalidate(); };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [identity, session, store]);

  async function signIn(accountId: string, accessCode: string) {
    const result = await identity.signIn({ accountId, accessCode });
    if (!result.ok) return result.reason;
    if (!store.save(result.session)) return "storage_unavailable" as const;
    setSession(result.session);
    setStatus("authenticated");
    return "success" as const;
  }

  async function signOut() {
    if (session) await identity.signOut(session.sessionId);
    store.clear();
    setSession(null);
    setStatus("unauthenticated");
  }

  return (
    <StaffAuthContext.Provider value={{ status, session, accounts, signIn, signOut }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth(): StaffAuthContextValue {
  const value = useContext(StaffAuthContext);
  if (!value) throw new Error("useStaffAuth must be used inside StaffAuthProvider.");
  return value;
}

function AuthLoading({ message }: { message: string }) {
  return (
    <main className="staff-auth-state" aria-live="polite">
      <div className="staff-auth-state-card">
        <span className="auth-stamp">LOCAL MOCK</span>
        <p className="eyebrow">員工入口</p>
        <h1>正在核對通行資格</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}

function StaffRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, session } = useStaffAuth();
  const isLoginPage = pathname === "/staff/login";

  useEffect(() => {
    if (!isLoginPage && status === "unauthenticated") {
      router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, pathname, router, status]);

  if (isLoginPage) return children;
  if (status === "checking") return <AuthLoading message="正在讀取這台裝置上的本機示範 Session。" />;
  if (status === "unauthenticated" || !session) return <AuthLoading message="尚未登入，正在帶你前往員工登入頁。" />;

  return children;
}

export function StaffAuthBoundary({ children }: { children: ReactNode }) {
  return <StaffAuthProvider><StaffRouteGuard>{children}</StaffRouteGuard></StaffAuthProvider>;
}
