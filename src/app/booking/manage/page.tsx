import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/public/page-hero";
import { BookingManagement } from "@/features/booking/booking-management";

export const metadata = { title: "Mock 預約查詢與管理" };

export default function BookingManagePage() {
  return (
    <main>
      <PageHero eyebrow="MANAGE BOOKING / LOCAL MOCK" title="KEEP IT CLEAR." intro="以示範編號查看預約、提出取消或建立改期紀錄。所有動作只保存在瀏覽器記憶體，不代表店家已接受請求。" />
      <section className="content-band"><Container><BookingManagement /></Container></section>
    </main>
  );
}
