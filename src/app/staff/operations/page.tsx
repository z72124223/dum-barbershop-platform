import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { OperationsWorkspace } from "@/features/staff/operations-workspace";

export const metadata = { title: "Staff 營運模擬" };

export default function StaffOperationsPage() {
  return (
    <main>
      <PageHero eyebrow="OPERATIONS / LOCAL MOCK" title="SEE THE WHOLE FLOOR." intro="用日、週、待處理與客戶視角模擬多人營運。權限、資料與操作全是本機假資料，沒有正式員工登入。" />
      <section className="content-band"><Container><StaffSectionNav /><OperationsWorkspace /></Container></section>
    </main>
  );
}
