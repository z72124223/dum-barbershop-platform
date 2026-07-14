import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockServices, mockStaff } from "@/data/mock";

export const metadata = { title: "服務" };

export default function ServicesPage() {
  return <PublicPage eyebrow="SERVICES / FICTIONAL" title="SERVICES BUILT AROUND CRAFT." intro="下列內容只用來驗證選服務與預約入口。正式名稱、價格與服務時間仍待 Owner 決策。"><div className="grid grid-3">{mockServices.map((service, index) => <Card key={service.id} className="bookable-card"><span className="card-number">{String(index + 1).padStart(2, "0")}</span><h3>{service.name}</h3><p>{service.description}</p><dl className="card-facts"><div><dt>示範時間</dt><dd>{service.durationMinutes} 分鐘</dd></div><div><dt>價格</dt><dd>待 Owner 決策</dd></div><div><dt>可選設計師</dt><dd>{mockStaff.filter((staff) => staff.serviceIds.includes(service.id)).length} 位虛構人員</dd></div></dl><ButtonLink href={`/booking?service=${service.id}`} compact>預約此服務</ButtonLink></Card>)}</div></PublicPage>;
}
