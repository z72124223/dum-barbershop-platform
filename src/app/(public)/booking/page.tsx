import { Container } from "@/components/ui/container";
import { BookingFlow } from "@/features/booking/booking-flow";

export const metadata = { title: "客戶預約" };

export default function BookingPage() {
  return (
    <main className="page-shell">
      <Container>
        <header className="page-intro">
          <p className="eyebrow">CUSTOMER BOOKING</p>
          <h1>快速完成預約。</h1>
          <p>選擇日期、時間與職員，再留下聯絡資料。免登入，三個步驟完成。</p>
        </header>
        <BookingFlow />
      </Container>
    </main>
  );
}
