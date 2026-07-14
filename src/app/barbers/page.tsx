import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockStaff } from "@/data/mock";

export const metadata = { title: "設計師" };

export default function BarbersPage() {
  return <PublicPage eyebrow="THE CREW / FICTIONAL" title="ONE STUDIO. DISTINCT HANDS." intro="多人設計師是平台核心；以下人物與擅長項目完全虛構，只用來驗證指定設計師的流程。"><div className="grid grid-3">{mockStaff.map((staff, index) => <Card key={staff.id} className="bookable-card"><span className="card-number">{String(index + 1).padStart(2, "0")}</span><h3>{staff.displayName}</h3><p>{staff.title}</p><dl className="card-facts"><div><dt>擅長示範</dt><dd>{staff.specialties.join("、")}</dd></div><div><dt>可選服務</dt><dd>{staff.serviceIds.length} 項 Mock 服務</dd></div></dl><ButtonLink href={`/booking?staff=${staff.id}`} compact>指定這位設計師</ButtonLink></Card>)}</div></PublicPage>;
}
