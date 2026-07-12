import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";
import { servicePlaceholders } from "@/components/public/content";

export const metadata = { title: "服務" };

export default function ServicesPage() {
  return <PublicPage eyebrow="SERVICES / PLACEHOLDERS" title="SERVICES BUILT AROUND CRAFT." intro="以下只用來驗證公開頁面結構。正式服務、價格與服務時間仍待 Owner 決策。"><PlaceholderGrid items={servicePlaceholders} label="服務佔位" /></PublicPage>;
}
