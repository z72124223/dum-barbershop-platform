import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { OperationsWorkspace } from "@/features/staff/operations-workspace";

export const metadata = { title: "Staff 營運模擬" };

export default function StaffOperationsPage() {
  return (
    <main>
      <PageHero eyebrow="營運管理 · 本機示範" title="全店動態，一眼看清。" intro="用日、週、待處理與客戶視角模擬多人營運。權限依 Mock 登入角色套用；資料與操作仍全是本機假資料。" />
      <section className="content-band"><Container><StaffSectionNav /><OperationsWorkspace /></Container></section>
    </main>
  );
}
