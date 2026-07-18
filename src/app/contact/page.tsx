import { PublicPage } from "@/components/public/public-page";

export const metadata = { title: "聯絡" };

export default function ContactPage() {
  return <PublicPage eyebrow="聯絡方式 · 資料待提供" title="找到 DUM。" intro="地址、電話、LINE、Instagram、營業時間、地圖、停車與交通尚未核准；入口已完成，但不會連到錯誤的真實對象。"><div className="contact-layout"><div className="info-list">{[["01","門市地址","等待店主決定"],["02","聯絡電話","等待店主決定"],["03","官方 LINE","等待店主決定"],["04","Instagram","等待店主決定"],["05","營業時間","等待店主決定"],["06","停車與交通","等待店主決定"]].map(([index,title,body]) => <div className="info-row" key={index}><span>{index}</span><h3>{title}</h3><p>{body}</p></div>)}</div><aside className="contact-map-placeholder"><span>Google 地圖 · 尚未啟用</span><strong>等待正式位置</strong><p>收到核准門牌與地圖連結前，導航按鈕保持停用。</p><button type="button" disabled>開啟導航（停用）</button></aside></div></PublicPage>;
}
