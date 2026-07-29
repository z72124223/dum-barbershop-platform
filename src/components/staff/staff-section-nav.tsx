"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStaffAuth } from "../../features/staff/staff-auth";

const links = [
  ["工作台", "/staff"],
];

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
          <span>角色</span>
          <strong>{session ? (session.identity.role === "owner" ? "老闆" : "職員") : "讀取中"}</strong>
        </div>
        <button type="button" onClick={handleSignOut}>登出</button>
      </div>
      <nav className="staff-section-nav" aria-label="Staff 模擬功能">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
    </div>
  );
}
