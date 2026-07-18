import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <PublicPage eyebrow="404 · 找不到頁面" title="這張座位目前是空的。" intro="找不到你要的頁面，請回到公開網站入口。"><ButtonLink href="/">返回首頁</ButtonLink></PublicPage>;
}
