import { PublicPage } from "@/components/public/public-page";
import { workPlaceholders } from "@/components/public/content";

export const metadata = { title: "作品" };

export default function WorksPage() {
  return <PublicPage eyebrow="WORKS / TEN BLUEPRINT CATEGORIES" title="FORM. TEXTURE. DISCIPLINE." intro="十種作品分類已按藍圖完成響應式版位；目前不使用真實或生成的顧客照片，也不放入未核准技術資訊。"><div className="works-gallery" aria-label="作品分類預覽">{workPlaceholders.map((item, index) => <article key={item.title}><div className="work-art-placeholder"><span>{String(index + 1).padStart(2, "0")}</span><small>AUTHORIZED PHOTO PENDING</small></div><p className="eyebrow">{item.meta}</p><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><div className="empty-state works-empty"><h3>正式作品素材尚未匯入</h3><p>這是刻意保留的 Empty State。收到已授權照片、分類與說明後，可直接替換每張版位，不需改寫頁面結構。</p></div></PublicPage>;
}
