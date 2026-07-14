import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { BookingFlow } from "@/features/booking/booking-flow";

export const metadata = { title: "Mock 線上預約" };

export default function BookingPage() {
  return (
    <main>
      <PageHero eyebrow="BOOKING / LOCAL MOCK" title="BOOK YOUR CHAIR." intro="免登入的多人預約流程示範。所有服務、人員、日期與客戶資料均為虛構；完成流程不代表已向店家預約。" />
      <section className="content-band">
        <Container>
          <Suspense fallback={<div className="inline-state" aria-busy="true">正在準備 Mock 預約流程…</div>}>
            <BookingFlow />
          </Suspense>
        </Container>
      </section>
    </main>
  );
}
