import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockStaff } from "@/data/mock";

export const metadata = { title: "設計師" };

export default function BarbersPage() {
  return <PublicPage eyebrow="設計師陣容 · 虛構預覽" title="同一間店，各有一套手法。" intro="多人設計師是平台核心；以下人物、照片位置與擅長項目完全虛構，只用來驗證指定設計師的完整體驗。"><div className="grid grid-3">{mockStaff.map((staff, index) => <Card key={staff.id} className="bookable-card barber-profile-card"><div className="portrait-placeholder" aria-label="設計師正式照片佔位"><span>{String(index + 1).padStart(2, "0")}</span><small>正式肖像待提供</small></div><span className="card-number">虛構人物資料</span><h3>{staff.displayName}</h3><p>{staff.title}。正式簡介與人物身分待店主核准。</p><dl className="card-facts"><div><dt>擅長示範</dt><dd>{staff.specialties.join("、")}</dd></div><div><dt>可選服務</dt><dd>{staff.serviceIds.length} 項示範服務</dd></div><div><dt>作品</dt><dd>等待授權素材</dd></div></dl><ButtonLink href={`/booking?staff=${staff.id}`} compact>指定這位設計師</ButtonLink></Card>)}</div></PublicPage>;
}
