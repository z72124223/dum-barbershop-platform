# DUM BARBERSHOP Platform

DUM BARBERSHOP 客戶預約與員工工作台第一版 MVP。

## 目前範圍

本版只有四個頁面：

- `/`：客戶首頁
- `/booking`：免登入的三步驟客戶預約
- `/staff/login`：老闆／職員本機 Mock 登入
- `/staff`：整合預約時段與手動文字註記的員工工作台

客戶預約與員工新增的資料使用同一份瀏覽器本機儲存，因此在同一瀏覽器內可以互相看到。資料不會傳送到其他裝置，也沒有正式後端、API 或資料庫。

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

## 本機執行

需要 Node.js `>=20.9.0` 與 pnpm `11.7.0`。

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

本次實作依據為 Issue #27，分支為 `codex/27-first-mvp`。所有資料皆為虛構或遮罩內容；本版是本機靜態 MVP，不是 production-ready。
