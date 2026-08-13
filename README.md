# DUM BARBERSHOP Platform

## MVP3-3 cross-device schedule

Issue #35 connects the existing customer booking and authenticated Staff UI to
one same-site HTTP boundary backed by the controlled SQLite database. Public
availability contains only opaque staff IDs, public labels and slot state;
customer booking success never echoes submitted name, phone or note. Every
Staff data route resolves a current Better Auth session and active Staff
binding again on the server.

The booking form is fail-closed until `DUM_CUSTOMER_DATA_CONTACT` contains a
strict actionable contact URI. Production accepts only a non-fictional
`https:`, `mailto:` or E.164 `tel:` URI; staging accepts only an explicit
`.invalid` fixture. The real Owner-managed contact value must be supplied out
of band during Issues #36/#37 and must never be committed. Missing or invalid
configuration renders no customer-data form and rejects POST before opening
the schedule runtime.

Browser `localStorage` remains a demo/test adapter only. Formal routes do not
import it and do not automatically migrate its records.

## MVP3-2 formal staff authentication

Issue #34 adds a server-only Better Auth 1.6.26 boundary backed by the controlled
SQLite database. Username login, eight-hour non-refreshing sessions, owner/staff
authorization, revocation and the failed-login limiter all run on the server.
The `/staff` page uses this formal session boundary for every shared schedule
read and write.

Formal auth requires exactly one HTTPS origin plus a local absolute database
path and a secret of at least 32 characters. Production and staging use distinct
host-only `__Host-` cookies. Migrations and application startup never create
users, credentials or sessions. To provision one already-approved staff row,
provide the variables listed in `.env.example`, then run the explicit command:

```bash
pnpm staff:provision -- owner
pnpm staff:provision -- staff
```

Credentials must be supplied out of band and must never be committed or echoed.
Public ingress, real customer data, deployment/backup and production activation
remain blocked until Issues #36 and #37. Browser localStorage remains demo/test
only and is not accepted by the formal server boundary.

DUM BARBERSHOP 客戶預約與員工工作台 MVP2。

## 目前範圍

本版只有四個頁面：

- `/`：客戶首頁
- `/booking`：免登入的三步驟客戶預約
- `/staff/login`：正式 server-side 員工登入
- `/staff`：整合目前時段、註記編輯、手動文字註記與歷史查詢的員工工作台

客戶預約與員工新增資料會寫入同站 server-side SQLite，兩個獨立瀏覽器／裝置重新讀取後能看到同一份已提交資料。歷史保持唯讀，舊日期不能新增預約。

## MVP2：歷史與台北時間

- 員工可依日期區間、職員及預約／註記類型查詢過往紀錄。
- 歷史清單保留每筆預約備註與獨立文字註記，兩者不會被錯誤合併。
- 員工可在「時段與註記」清單編輯預約備註或獨立文字註記內容，並選擇儲存或取消。
- 「歷史查詢」保持唯讀，儲存後會顯示目前最新的註記內容。
- 今天、日期位移、顯示格式及時段是否已開始，都統一使用 `Asia/Taipei`。
- 客戶預約頁會自動停用依台北目前時間已經開始的時段。
- 頁面保持開啟時，每分鐘及重新回到頁面時會重新對齊目前時間。

## MVP2 demo/test 登入（不屬於正式 routes）

兩個虛構帳號共用公開示範通行碼 `DUM-DEMO`：

- 老闆：`owner.demo`
- 職員：`staff.demo`

這些值只供隔離的 Mock adapter／舊版測試；正式 `/staff/login` 不接受它們，也不會把 Mock Session 或 localStorage 資料匯入伺服器。

## 明確不包含

- 照片與作品
- LINE
- 金流、訂金、儲值或會員
- AI 與 AI API
- 第三方產品 API 或外部整合
- 真實員工、客戶或營運資料

## 正式上線工作

MVP1 PR #28、MVP2 PR #30、決策基線 PR #38、SQLite PR #40 與正式認證 PR #41 已合併至 `main`。正式上線依 Epic #31 拆成 #32–#37；目前 Issue #35 的跨裝置 schedule slice 位於 Draft PR #42，網站未公開且不可輸入真實資料。

Owner 已核准八項最小架構、時段、登入、個資保存與備份提案，並已註冊正式網域 `dumbarbershop.com`；決策基線可供後續 MVP3 切片實作，但網站仍須等待 #37 GO 才能公開。完整紀錄位於 [`docs/PRODUCTION-BASELINE.md`](docs/PRODUCTION-BASELINE.md)。

## 本機執行

需要 Node.js 24 LTS（`>=24.0.0 <25`）與 pnpm `11.7.0`。

這是本機開發最低需求；D-017 已接受的 Windows Production runtime 目標為固定的 Node.js 24 LTS。

```bash
corepack enable
pnpm install
pnpm dev
```

Issue #33 在 Windows／Node.js 24 使用 `better-sqlite3@13.0.2` 隨套件提供的 `win32-x64` 原生 prebuild；pnpm 明確停用其舊式隱含 `node-gyp` 安裝 hook。此工作站已通過原生模組載入、檔案型 SQLite 寫入與 WAL 驗證，但未安裝 MSVC／Windows SDK，因此 source-build fallback 尚不可用，留待 Issue #36 的正式主機佈署決定與驗證。

開啟 `http://localhost:3000`。

共用 SQLite 核心位於 server-only 的 `src/adapters/sqlite` 邊界；正式 React UI 僅透過 `src/server/schedule` 的 same-site HTTP DTO 使用它。既有瀏覽器 `localStorage` 仍只供 demo／test，不會自動匯入 SQLite；在 #36/#37 完成正式聯絡管道、Cloudflare、retention／backup 與 GO 以前仍不可輸入真實資料。

## 驗證

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## 專案規則

GitHub Repository 是本專案的正式規格與交接來源。開始工作前請先讀 [`AGENTS.md`](AGENTS.md)，再依其中順序讀取治理文件。

MVP2 實作依據為 Issue #29；MVP3-3 依據 Issue #35 與 D-017。所有測試與 smoke 資料皆為虛構或遮罩內容；本網站仍不是 production-ready。
