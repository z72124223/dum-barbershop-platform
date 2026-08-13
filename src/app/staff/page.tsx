import { Container } from "@/components/ui/container";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { StaffWorkspace } from "@/features/staff/staff-workspace";
import { getFormalAuthRuntime, resolveStaffActor } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = { title: "員工工作台" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  let actor;
  try {
    actor = await resolveStaffActor(
      getFormalAuthRuntime(),
      new Headers(await headers()),
    );
  } catch {
    redirect("/staff/login?next=%2Fstaff");
  }

  return (
    <main className="staff-page">
      <Container>
        <StaffSectionNav session={{
          role: actor.role,
          label: actor.label,
          expiresAt: actor.expiresAt,
        }} />
        <header className="page-intro staff-intro">
          <p className="eyebrow">STAFF WORKSPACE</p>
          <h1>共用時段與註記。</h1>
          <p>今日、歷史、新增與註記編輯都由伺服器端正式授權及共用資料庫保護。</p>
        </header>
        <StaffWorkspace />
      </Container>
    </main>
  );
}
