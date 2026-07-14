import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { QuickActionPreview } from "@/features/quick-actions/quick-action-preview";

export const metadata = { title: "Apple 行動捷徑預覽" };

export default function StaffQuickActionsPage() {
  return (
    <main>
      <PageHero eyebrow="QUICK ACTIONS / WEB PREVIEW" title="THE FLOOR, AT A GLANCE." intro="用 Today、Next、Blocks、Checked In 與 Completed 快速查看現場。本頁是網頁模擬，不是正式 Apple Watch 應用程式。" />
      <section className="content-band"><Container><StaffSectionNav /><QuickActionPreview /></Container></section>
    </main>
  );
}
