import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockServices, mockStaff } from "@/data/mock";

export const metadata = { title: "服務" };

export default function ServicesPage() {
  const categoryLabels = { cut: "剪髮", shave: "修面", perm: "燙髮", color: "染髮", care: "護理", combo: "組合" } as const;
  return <PublicPage eyebrow="服務項目 · 虛構預覽" title="手藝，從每個細節開始。" intro="下列內容只用來驗證分類、時間、注意事項、可服務人員與預約入口。正式名稱、價格與服務時間仍待店主決策。"><div className="service-category-strip">{["剪髮", "修面", "燙髮", "染髮", "頭皮護理", "組合服務", "活動方案"].map((category) => <span key={category}>{category}</span>)}</div><div className="grid grid-3">{mockServices.map((service, index) => <Card key={service.id} className="bookable-card"><span className="card-number">{String(index + 1).padStart(2, "0")} · {categoryLabels[service.category]}</span><h3>{service.name}</h3><p>{service.description}</p><dl className="card-facts"><div><dt>示範時間</dt><dd>{service.durationMinutes} 分鐘</dd></div><div><dt>價格</dt><dd>待店主決策</dd></div><div><dt>可選設計師</dt><dd>{mockStaff.filter((staff) => staff.serviceIds.includes(service.id)).length} 位虛構人員</dd></div><div><dt>注意事項</dt><dd>正式內容待確認</dd></div></dl><ButtonLink href={`/booking?service=${service.id}`} compact>預約此服務</ButtonLink></Card>)}</div><div className="empty-state service-reserved"><h3>尚未建立正式價目表</h3><p>染髮、組合服務與活動方案等分類已預留；收到核准的名稱、價格、時長、適用設計師與注意事項後再正式發布。</p></div></PublicPage>;
}
