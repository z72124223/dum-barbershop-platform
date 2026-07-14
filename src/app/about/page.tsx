import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";

export const metadata = { title: "關於" };

const items = [
  { title: "品牌氣質", body: "深色、硬派、成熟與乾淨俐落的公開體驗方向。", meta: "方向已確認" },
  { title: "線上預約", body: "免登入、指定設計師並保持供應商可替換的架構方向。", meta: "平台目標" },
  { title: "現場營運", body: "手機優先，支援多人工作室日常節奏的營運介面。", meta: "本機預覽" },
  { title: "內容誠實", body: "沒有核准的品牌故事、店內照片與營運事實會保持明確佔位。", meta: "不捏造事實" }
];

export default function AboutPage() {
  return <PublicPage eyebrow="關於 DUM · 平台預覽" title="為理容現場而打造。" intro="DUM 的數位平台同時服務品牌入口、客人預約與多人工作室營運基礎；正式品牌故事與店內資訊仍等待核准。"><div className="about-statement"><p className="eyebrow">品牌故事 · 等待正式內容</p><h2>版面已經就位，<br />真實故事不靠杜撰。</h2><p>這個版本完成品牌故事、理念、專業特色、環境與店家資訊的閱讀層級，但不代替店家撰寫不存在的歷史。</p></div><PlaceholderGrid items={items} label="平台方向" /><div className="about-facts"><article><span>店內環境</span><strong>正式照片待提供</strong><p>已預留大圖與說明版位，不使用生成的顧客或店景冒充真實素材。</p></article><article><span>地址與營業資訊</span><strong>等待店主決定</strong><p>不從示範排班推測正式營業時間。</p></article></div></PublicPage>;
}
