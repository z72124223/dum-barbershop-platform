import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";

export const metadata = { title: "關於" };

const items = [
  { title: "BRAND", body: "深色、硬派、成熟與乾淨俐落的公開體驗方向。", meta: "APPROVED DIRECTION" },
  { title: "BOOKING", body: "免登入、指定設計師並保持供應商可替換的架構方向。", meta: "PLATFORM GOAL" },
  { title: "OPERATIONS", body: "手機優先，支援多人工作室日常節奏的未來介面。", meta: "M1 FOUNDATION" }
];

export default function AboutPage() {
  return <PublicPage eyebrow="ABOUT / PLATFORM" title="BUILT FOR THE SHOP FLOOR." intro="DUM 的數位平台同時服務品牌入口、客人預約與多人工作室營運基礎。"><PlaceholderGrid items={items} label="平台方向" /></PublicPage>;
}
