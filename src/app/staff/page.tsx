import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffWorkspace } from "@/features/staff/staff-workspace";

export const metadata = { title: "Staff Mock 工作台" };

export default function StaffPage() {
  return (
    <main>
      <PageHero eyebrow="STAFF / LOCAL PROTOTYPE" title="RUN THE FLOOR." intro="多人工作室的手機優先操作原型。所有客人、行程、備註與狀態均為虛構，本頁沒有登入或正式資料來源。" />
      <section className="content-band"><Container><StaffWorkspace /></Container></section>
    </main>
  );
}
