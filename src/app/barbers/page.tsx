import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";
import { barberPlaceholders } from "@/components/public/content";

export const metadata = { title: "設計師" };

export default function BarbersPage() {
  return <PublicPage eyebrow="THE CREW / FICTIONAL" title="ONE STUDIO. DISTINCT HANDS." intro="多人設計師是平台核心；本頁不使用任何真實員工姓名、照片或服務能力。"><PlaceholderGrid items={barberPlaceholders} label="設計師佔位" /></PublicPage>;
}
