"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface StaffSectionNavProps {
  session: {
    role: "owner" | "staff";
    label: string;
    expiresAt: string;
  };
}

const links = [
  ["工作台", "/staff"],
];

export function StaffSectionNav({ session }: StaffSectionNavProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    router.replace("/staff/login");
    router.refresh();
  }

  return (
    <div className="staff-navigation-shell">
      <div className="staff-session-bar">
        <div>
          <span>角色</span>
          <strong>{session.label}</strong>
        </div>
        <button type="button" onClick={handleSignOut}>登出</button>
      </div>
      <nav className="staff-section-nav" aria-label="員工作業區">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
    </div>
  );
}
