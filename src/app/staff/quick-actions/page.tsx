import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { QuickActionPreview } from "@/features/quick-actions/quick-action-preview";

export const metadata = { title: "Apple 行動捷徑預覽" };

export default function StaffQuickActionsPage() {
  return (
    <main>
      <PageHero eyebrow="行動捷徑 · 網頁預覽" title="抬手一看，現場就有答案。" intro="用今日、下一位、封鎖時間、已報到與已完成快速查看現場。本頁是網頁模擬，不是正式 Apple Watch 應用程式。" />
      <section className="content-band"><Container><StaffSectionNav /><QuickActionPreview /></Container></section>
    </main>
  );
}
