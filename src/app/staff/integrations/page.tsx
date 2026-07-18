import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";
import { IntegrationConsole } from "@/features/integrations/integration-console";

export const metadata = { title: "整合狀態模擬" };

export default function StaffIntegrationsPage() {
  return (
    <main>
      <PageHero eyebrow="外部整合 · 本機模擬器" title="就算失敗，也不能遺失資料。" intro="查看每一種外部服務的啟用狀態、工作佇列、衝突與有限重試。所有結果均為本機模擬，不會接觸外部帳號。" />
      <section className="content-band"><Container><StaffSectionNav /><IntegrationConsole /></Container></section>
    </main>
  );
}
