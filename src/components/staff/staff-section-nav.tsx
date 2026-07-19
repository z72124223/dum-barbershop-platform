"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StaffRole } from "../../domain";
import { useStaffAuth } from "../../features/staff/staff-auth";

const links = [
  ["今日工作台", "/staff"],
  ["營運模擬", "/staff/operations"],
  ["整合狀態", "/staff/integrations"],
  ["行動捷徑", "/staff/quick-actions"],
];

const roleLabels: Record<StaffRole, string> = {
  owner: "店主",
  manager: "管理者",
  barber: "設計師",
  reception: "櫃台",
  read_only: "唯讀",
};

export function StaffSectionNav() {
  const router = useRouter();
  const { session, signOut } = useStaffAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/staff/login");
  }

  return (
    <div className="staff-navigation-shell">
      <div className="staff-session-bar">
        <div>
          <span>目前身份</span>
          <strong>{session?.identity.displayName ?? "正在讀取"}</strong>
          {session ? <small>{roleLabels[session.identity.role]}角色 · 本機 Mock Session</small> : null}
        </div>
        <button type="button" onClick={handleSignOut}>登出</button>
      </div>
      <nav className="staff-section-nav" aria-label="Staff 模擬功能">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
    </div>
  );
}
