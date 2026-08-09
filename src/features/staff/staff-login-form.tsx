"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

interface PublicSession {
  authenticated: true;
  staff: {
    id: string;
    role: "owner" | "staff";
    label: string;
  };
  expiresAt: string;
}

export function StaffLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<PublicSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/get-session", {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => response.ok
        ? await response.json() as PublicSession
        : null)
      .then((current) => {
        if (active) setSession(current);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/sign-in/username", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setError(response.status === 429
          ? "登入嘗試過多，請稍後再試。"
          : "帳號或密碼不正確。");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("目前無法完成登入，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      setSession(null);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-login-shell">
      <div className="staff-login-copy">
        <span className="auth-stamp">STAFF · SECURE</span>
        <p className="eyebrow">員工後台</p>
        <h1>員工登入</h1>
        <p>老闆與職員使用由伺服器管理的帳號及八小時 Session。</p>
        <div className="staff-login-warning" role="note">
          <strong>受保護登入</strong>
          <span>請勿在共用裝置保存密碼；完成工作後請登出。</span>
        </div>
      </div>

      <div className="staff-login-card">
        {checking ? (
          <div className="staff-login-loading" role="status" aria-live="polite">
            <p className="eyebrow">SESSION CHECK</p>
            <h2>正在確認 Session</h2>
          </div>
        ) : session ? (
          <div className="staff-current-session">
            <p className="eyebrow">目前已登入</p>
            <h2>{session.staff.label}</h2>
            <p>Session 將於 {new Date(session.expiresAt).toLocaleString("zh-TW")} 到期。</p>
            <div className="staff-login-actions">
              <button className="button" type="button" onClick={() => router.replace(nextPath)}>
                繼續進入後台
              </button>
              <button className="button button-secondary" type="button" onClick={signOut} disabled={busy}>
                登出
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="staff-login-heading">
              <p className="eyebrow">SECURE SIGN IN</p>
              <h2>員工登入</h2>
              <span>登入失敗時不會揭露帳號是否存在。</span>
            </div>
            <label className="staff-code-field">
              <span>帳號</span>
              <input
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                maxLength={30}
                required
                aria-invalid={Boolean(error)}
              />
            </label>
            <label className="staff-code-field">
              <span>密碼</span>
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength={12}
                maxLength={128}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "staff-login-error" : undefined}
              />
            </label>
            {error ? <p id="staff-login-error" className="form-error" role="alert">{error}</p> : null}
            <button className="button staff-login-submit" type="submit" disabled={busy}>
              {busy ? "正在核對…" : "登入員工後台"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
