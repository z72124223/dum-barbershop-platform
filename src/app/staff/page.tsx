import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffWorkspace } from "@/features/staff/staff-workspace";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";

export const metadata = { title: "員工工作台示範" };

export default function StaffPage() {
  return (
    <main>
      <PageHero eyebrow="員工工作台 · 本機原型" title="掌握今天的現場。" intro="多人工作室的手機優先操作原型。所有客人、行程、備註與狀態均為虛構，本頁沒有登入或正式資料來源。" />
      <section className="content-band"><Container><StaffSectionNav /><StaffWorkspace /></Container></section>
    </main>
  );
}
