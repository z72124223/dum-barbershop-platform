import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";

export const metadata = { title: "政策" };

const items = [
  { title: "DEPOSIT", body: "訂金金額、適用服務、退款與逾時規則待 Owner 決策。", meta: "OWNER DECISION" },
  { title: "CANCELLATION", body: "取消期限、遲到、爽約、改期與插單政策待 Owner 決策。", meta: "OWNER DECISION" },
  { title: "PRIVACY", body: "資料保存期限、員工可見範圍與行銷同意待 Owner 決策。", meta: "OWNER DECISION" }
];

export default function PoliciesPage() {
  return <PublicPage eyebrow="POLICIES / RESERVED" title="HONEST WHERE NOT DECIDED." intro="未核准政策不會被包裝成正式規則，也不會影響任何客人權益。"><PlaceholderGrid items={items} label="政策保留項目" /></PublicPage>;
}
