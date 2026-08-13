import { Container } from "@/components/ui/container";
import { BookingFlow } from "@/features/booking/booking-flow";
import { readCollectionNoticeConfiguration } from "@/server/schedule";

export const metadata = { title: "客戶預約" };
export const dynamic = "force-dynamic";

export default function BookingPage() {
  let notice;
  try {
    notice = readCollectionNoticeConfiguration();
  } catch {
    notice = null;
  }
  return (
    <main className="page-shell">
      <Container>
        <header className="page-intro">
          <p className="eyebrow">CUSTOMER BOOKING</p>
          <h1>快速完成預約。</h1>
          <p>選擇日期、時間與職員，再留下聯絡資料。免登入，三個步驟完成。</p>
        </header>
        {notice ? (
          <BookingFlow contact={{ href: notice.contactHref, label: notice.contactLabel }} />
        ) : (
          <section className="empty-state" role="status">
            <strong>預約蒐集尚未啟用</strong>
            <span>Owner 管理的權利請求聯絡管道尚未完成部署核驗；目前不會顯示或送出個人資料表單。</span>
          </section>
        )}
      </Container>
    </main>
  );
}
