import { Container } from "@/components/ui/container";
import { StaffWorkspace } from "@/features/staff/staff-workspace";
import { StaffSectionNav } from "@/components/staff/staff-section-nav";

export const metadata = { title: "員工工作台" };

export default function StaffPage() {
  return (
    <main className="staff-page">
      <Container>
        <StaffSectionNav />
        <header className="page-intro staff-intro">
          <p className="eyebrow">STAFF WORKSPACE</p>
          <h1>預約時段與註記。</h1>
          <p>一個工作台處理顧客預約、手動時段與文字提醒。</p>
        </header>
        <StaffWorkspace />
      </Container>
    </main>
  );
}
