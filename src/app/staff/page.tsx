import { Container } from "@/components/ui/container";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
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
          <h1>員工作業區已受正式 Session 保護。</h1>
          <p>目前只啟用登入與伺服器端授權邊界；正式預約資料介面尚未接入此頁。</p>
        </header>
        <section className="staff-auth-state-card" role="status">
          <p className="eyebrow">AUTHORIZATION READY</p>
          <h2>{actor.label}已安全登入</h2>
          <p>所有後續員工資料操作都必須再次通過相同的伺服器端角色政策。</p>
        </section>
      </Container>
    </main>
  );
}
