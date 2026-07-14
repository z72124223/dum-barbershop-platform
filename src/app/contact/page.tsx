import { PublicPage } from "@/components/public/public-page";

export const metadata = { title: "聯絡" };

export default function ContactPage() {
  return <PublicPage eyebrow="CONTACT / PLACEHOLDER" title="FIND THE STUDIO." intro="地址、電話、LINE、Instagram、營業時間、地圖、停車與交通尚未核准；入口已完成，但不會連到錯誤的真實對象。"><div className="contact-layout"><div className="info-list">{[["01","ADDRESS","TODO(owner-decision)"],["02","PHONE","TODO(owner-decision)"],["03","LINE","TODO(owner-decision)"],["04","INSTAGRAM","TODO(owner-decision)"],["05","OPENING HOURS","TODO(owner-decision)"],["06","PARKING / TRANSIT","TODO(owner-decision)"]].map(([index,title,body]) => <div className="info-row" key={index}><span>{index}</span><h3>{title}</h3><p>{body}</p></div>)}</div><aside className="contact-map-placeholder"><span>GOOGLE MAP / DISABLED</span><strong>等待正式位置</strong><p>收到核准門牌與地圖連結前，導航按鈕保持停用。</p><button type="button" disabled>開啟導航（停用）</button></aside></div></PublicPage>;
}
