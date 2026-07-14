import Link from "next/link";

const links = [
  ["今日工作台", "/staff"],
  ["營運模擬", "/staff/operations"],
  ["整合狀態", "/staff/integrations"],
  ["行動捷徑", "/staff/quick-actions"],
];

export function StaffSectionNav() {
  return (
    <nav className="staff-section-nav" aria-label="Staff 模擬功能">
      {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
  );
}
