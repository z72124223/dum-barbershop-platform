"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { StaffRole } from "../../domain";
import { useStaffAuth } from "./staff-auth";

const roleLabels: Record<StaffRole, string> = {
  owner: "店主",
  manager: "管理者",
  barber: "設計師",
  reception: "櫃台",
  read_only: "唯讀",
};

const errorMessages = {
  invalid_credentials: "帳號或示範通行碼不正確，請使用頁面提供的假資料。",
  account_disabled: "這個示範帳號目前停用。",
  storage_unavailable: "瀏覽器無法保存本機 Session，請允許網站儲存空間後再試一次。",
} as const;

export function StaffLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { accounts, session, signIn, signOut, status } = useStaffAuth();
  const [accountId, setAccountId] = useState("");
  const [accessCode, setAccessCode] = useState("DUM-DEMO");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedAccountId = accountId || accounts[0]?.accountId || "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await signIn(selectedAccountId, accessCode);
    setBusy(false);
    if (result === "success") {
      router.replace(nextPath);
      return;
    }
    setError(errorMessages[result]);
  }

  async function switchAccount() {
    await signOut();
    setError("");
  }

  return (
    <section className="staff-login-shell">
      <div className="staff-login-copy">
        <span className="auth-stamp">MEMBERS ONLY · MOCK</span>
        <p className="eyebrow">員工後台 · 本機示範</p>
        <h1>先報上名號，<br />再進工作台。</h1>
        <p>這道門只保護員工示範後台。客人看網站、選服務與預約，完全不需要登入。</p>
        <div className="staff-login-warning" role="note">
          <strong>不是正式資安系統</strong>
          <span>帳號與通行碼都是公開假資料，只用來測試登入、Session 與角色權限。請勿輸入真實密碼。</span>
        </div>
      </div>

      <div className="staff-login-card">
        {status === "checking" ? (
          <div className="staff-login-loading" role="status" aria-live="polite">
            <p className="eyebrow">DEMO SIGN IN</p>
            <h2>正在準備員工入口</h2>
            <p>正在讀取本機示範身份與 Session。</p>
          </div>
        ) : status === "authenticated" && session ? (
          <div className="staff-current-session">
            <p className="eyebrow">這台裝置已登入</p>
            <h2>{session.identity.displayName}</h2>
            <p>{roleLabels[session.identity.role]}角色 · 本機 Session 有效中</p>
            <div className="staff-login-actions">
              <button className="button" type="button" onClick={() => router.replace(nextPath)}>繼續進入後台</button>
              <button className="button button-secondary" type="button" onClick={switchAccount}>改用其他身份</button>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="staff-login-loading" role="alert">
            <p className="eyebrow">LOCAL DATA ERROR</p>
            <h2>示範身份無法載入</h2>
            <p>請重新整理頁面；客人的公開網站與預約功能不受影響。</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="staff-login-heading">
              <p className="eyebrow">DEMO SIGN IN</p>
              <h2>員工登入</h2>
              <span>選一個虛構身份測試不同權限。</span>
            </div>
            <fieldset className="demo-account-list" disabled={busy || accounts.length === 0}>
              <legend>示範身份</legend>
              {accounts.map((account) => (
                <label key={account.id} className={selectedAccountId === account.accountId ? "selected" : ""}>
                  <input
                    type="radio"
                    name="demo-account"
                    value={account.accountId}
                    checked={selectedAccountId === account.accountId}
                    onChange={() => setAccountId(account.accountId)}
                  />
                  <span><strong>{account.displayName}</strong><small>{roleLabels[account.role]} · {account.accountId}</small></span>
                </label>
              ))}
            </fieldset>
            <label className="staff-code-field">
              <span>示範通行碼</span>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "demo-code-hint staff-login-error" : "demo-code-hint"}
              />
              <small id="demo-code-hint">公開假通行碼：<strong>DUM-DEMO</strong></small>
            </label>
            {error ? <p id="staff-login-error" className="form-error" role="alert">{error}</p> : null}
            <button className="button staff-login-submit" type="submit" disabled={busy || !selectedAccountId}>
              {busy ? "正在核對…" : "登入員工後台"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
