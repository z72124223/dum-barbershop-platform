import { PublicPage } from "@/components/public/public-page";
import { PlaceholderGrid } from "@/components/public/placeholder-grid";

export const metadata = { title: "政策" };

const items = [
  { title: "訂金規則", body: "訂金金額、適用服務、退款與逾時規則待店主決策。", meta: "等待店主決定" },
  { title: "取消與改期", body: "取消期限、遲到、爽約、改期與插單政策待店主決策。", meta: "等待店主決定" },
  { title: "遲到與未到店", body: "遲到、爽約、插單與候補轉正規則待店主決策。", meta: "等待店主決定" },
  { title: "隱私規則", body: "資料保存期限、員工可見範圍與行銷同意待店主決策。", meta: "等待店主決定" },
  { title: "個人資料告知", body: "蒐集目的、第三方提供、刪除與查詢方式待正式個資告知確認。", meta: "等待店主決定" }
];

export default function PoliciesPage() {
  return <PublicPage eyebrow="門市政策 · 尚未核准" title="還沒決定的事，就不假裝確定。" intro="未核准政策不會被包裝成正式規則，也不會影響任何客人權益。"><div className="policy-warning"><strong>目前不能作為正式門市政策</strong><span>以下全部是待決策項目；示範預約、取消與改期不會自動套用費用或權益判斷。</span></div><PlaceholderGrid items={items} label="政策保留項目" /></PublicPage>;
}
