import { PublicPage } from "@/components/public/public-page";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "會員預留" };

export default function MembershipPage() {
  return <PublicPage eyebrow="會員專區 · 尚未啟用" title="會員制度仍在規劃中。" intro="第一階段只保留入口；不建立登入、儲值、點數、次數或正式權益。"><EmptyState title="等待店主核准會員制度">會員制度、供應商、權益、資料綁定與到期規則都尚未定案，此介面保持停用狀態。</EmptyState></PublicPage>;
}
