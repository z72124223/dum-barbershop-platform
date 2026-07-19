import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffWorkspace } from "@/features/staff/staff-workspace";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";

export const metadata = { title: "員工工作台示範" };

export default function StaffPage() {
  return (
    <main>
      <PageHero eyebrow="員工工作台 · Mock 登入" title="掌握今天的現場。" intro="多人工作室的手機優先操作原型。登入身份會限制畫面權限；所有客人、行程、備註與狀態仍是虛構資料。" />
      <section className="content-band"><Container><StaffSectionNav /><StaffWorkspace /></Container></section>
    </main>
  );
}
