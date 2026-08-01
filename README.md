# DUM BARBERSHOP Platform

DUM BARBERSHOP 客戶預約與員工工作台 MVP2。

## 目前範圍

本版只有四個頁面：

- `/`：客戶首頁
- `/booking`：免登入的三步驟客戶預約
- `/staff/login`：老闆／職員本機 Mock 登入
- `/staff`：整合目前時段、註記編輯、手動文字註記與歷史查詢的員工工作台

客戶預約與員工新增的資料使用同一份瀏覽器本機儲存，因此在同一瀏覽器內可以互相看到。資料不會傳送到其他裝置，也沒有正式後端、API 或資料庫。

## MVP2：歷史與台北時間

- 員工可依日期區間、職員及預約／註記類型查詢過往紀錄。
- 歷史清單保留每筆預約備註與獨立文字註記，兩者不會被錯誤合併。
- 員工可在「時段與註記」清單編輯預約備註或獨立文字註記內容，並選擇儲存或取消。
- 「歷史查詢」保持唯讀，儲存後會顯示目前最新的註記內容。
- 今天、日期位移、顯示格式及時段是否已開始，都統一使用 `Asia/Taipei`。
- 客戶預約頁會自動停用依台北目前時間已經開始的時段。
- 頁面保持開啟時，每分鐘及重新回到頁面時會重新對齊目前時間。

## 員工示範登入

兩個虛構帳號共用公開示範通行碼 `DUM-DEMO`：

- 老闆：`owner.demo`
- 職員：`staff.demo`

Session 最長保留 8 小時，並由本機 Mock Cookie 保護 `/staff` 路由。這只是第一版驗收行為，不是正式營運用的登入系統。

## 明確不包含

- 照片與作品
- LINE
- 金流、訂金、儲值或會員
- AI 與 AI API
- 正式 API、資料庫或第三方整合
- 真實員工、客戶或營運資料

## 正式上線工作

MVP1 PR #28 與 MVP2 PR #30 已於 2026-08-01 合併至 `main`。正式上線依 Epic #31 拆成 #32–#37；目前只進行 Issue #32 的文件與決策基線，網站仍是本機 Mock，未公開也不可輸入真實資料。

Owner 已核准八項最小架構、時段、登入、個資保存與備份提案；正式網域仍待提供，因此決策尚未啟用。完整紀錄位於 [`docs/PRODUCTION-BASELINE.md`](docs/PRODUCTION-BASELINE.md)。

## 本機執行

需要 Node.js `>=20.9.0` 與 pnpm `11.7.0`。

這是本機開發最低需求；D-017 提案的 Windows Production runtime 目標為固定的 Node.js 24 LTS，待 Issue #32 核准。

```bash
corepack enable
pnpm install
pnpm dev
```

開啟 `http://localhost:3000`。

## 驗證

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## 專案規則

GitHub Repository 是本專案的正式規格與交接來源。開始工作前請先讀 [`AGENTS.md`](AGENTS.md)，再依其中順序讀取治理文件。

MVP2 實作依據為 Issue #29；PR #28 與 PR #30 均已合併。所有資料皆為虛構或遮罩內容；目前執行中的 MVP3-0 只有文件變更，本網站仍不是 production-ready。
