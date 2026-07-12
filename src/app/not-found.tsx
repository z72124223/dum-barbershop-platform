import { PublicPage } from "@/components/public/public-page";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <PublicPage eyebrow="404 / NOT FOUND" title="THIS CHAIR IS EMPTY." intro="找不到你要的頁面，請回到公開網站入口。"><ButtonLink href="/">返回首頁</ButtonLink></PublicPage>;
}
