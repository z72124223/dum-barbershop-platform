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
  { title: "TEXTURE", body: "作品分類版面佔位，正式素材需另行核准。", meta: "NO REAL PHOTO" },
  { title: "CLASSIC", body: "作品分類版面佔位，不包含真實客戶資料。", meta: "NO REAL PHOTO" }
];
