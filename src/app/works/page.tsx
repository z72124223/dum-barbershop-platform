import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";
import { workPlaceholders } from "@/components/public/content";

export const metadata = { title: "作品" };

export default function WorksPage() {
  return <PublicPage eyebrow="WORKS / PLACEHOLDERS" title="FORM. TEXTURE. DISCIPLINE." intro="作品頁目前只有分類與版面佔位，未使用真實顧客照片或技術備註。"><PlaceholderGrid items={workPlaceholders} label="作品佔位" /></PublicPage>;
}
