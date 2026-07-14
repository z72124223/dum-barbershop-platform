import type { PlaceholderItem } from "./placeholder-grid";

export const servicePlaceholders: PlaceholderItem[] = [
  { title: "CUT / 01", body: "虛構剪髮服務佔位。正式名稱、價格與時間仍待 Owner 決策。", meta: "PLACEHOLDER" },
  { title: "SHAVE / 02", body: "虛構修面服務佔位，不代表目前門市正式服務。", meta: "PLACEHOLDER" },
  { title: "TEXTURE / 03", body: "虛構紋理造型服務佔位，沒有預先決定任何營運內容。", meta: "PLACEHOLDER" }
];

export const barberPlaceholders: PlaceholderItem[] = [
  { title: "BARBER A", body: "虛構設計師輪廓。正式名單、介紹、照片與服務能力待 Owner 決策。", meta: "FICTIONAL" },
  { title: "BARBER B", body: "多人工作室版面佔位，用來驗證響應式卡片與導覽。", meta: "FICTIONAL" },
  { title: "BARBER C", body: "此人物不存在，不應被視為正式員工資訊。", meta: "FICTIONAL" }
];

export const workPlaceholders: PlaceholderItem[] = [
  { title: "SKIN FADE", body: "作品分類版面佔位，尚未使用任何真實顧客照片。", meta: "NO REAL PHOTO" },
  { title: "短板前刺", body: "短髮輪廓作品版位，正式素材與說明仍待核准。", meta: "NO REAL PHOTO" },
  { title: "凱撒頭", body: "分類與響應式構圖示範，不代表店內正式作品。", meta: "NO REAL PHOTO" },
  { title: "飛機頭", body: "造型分類版位，沒有使用任何真實顧客資料。", meta: "NO REAL PHOTO" },
  { title: "油頭", body: "經典造型分類版位，照片與技術內容待 Owner 提供。", meta: "NO REAL PHOTO" },
  { title: "寸頭", body: "短髮分類版位，只呈現網站資訊架構。", meta: "NO REAL PHOTO" },
  { title: "黑人燙", body: "紋理分類版位，正式服務與作品尚未發布。", meta: "NO REAL PHOTO" },
  { title: "雷鬼頭", body: "造型分類版位，不預設服務能力與價格。", meta: "NO REAL PHOTO" },
  { title: "染髮", body: "色彩作品分類版位，正式照片與說明待授權。", meta: "NO REAL PHOTO" },
  { title: "素人改造", body: "改造前後版位預留，不使用或生成真實客戶影像。", meta: "NO REAL PHOTO" }
];

export const shopFeaturePlaceholders: PlaceholderItem[] = [
  { title: "MULTI-BARBER", body: "從選服務到現場管理都支援多位設計師，各自保有排班與能力。", meta: "PLATFORM READY" },
  { title: "MOBILE FIRST", body: "公開預約與員工操作都優先照顧手機單手使用。", meta: "RESPONSIVE" },
  { title: "HONEST DATA", body: "未知價格、政策與店家資訊不會被包裝成已確定內容。", meta: "NO INVENTED FACTS" }
];

export const reviewPlaceholders: PlaceholderItem[] = [
  { title: "REVIEW SLOT / 01", body: "等待店家提供可公開、可驗證且已獲授權的顧客評價。", meta: "FICTIONAL LAYOUT" },
  { title: "REVIEW SLOT / 02", body: "目前只驗證評價卡片的排版，不引用或捏造任何真實評論。", meta: "FICTIONAL LAYOUT" },
  { title: "REVIEW SLOT / 03", body: "正式上線前需確認評價來源、姓名顯示與個資使用方式。", meta: "OWNER DECISION" }
];
