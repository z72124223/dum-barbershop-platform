# DUM BARBERSHOP Platform — Decisions Register

本檔案記錄正式決策。所有新增或修改都必須透過 Git Commit / Pull Request。

---

## Confirmed

### D-001 — Repository 是唯一最高標準

- 狀態：Accepted
- 決策：`z72124223/dum-barbershop-platform` 是本專案唯一正式來源。
- 影響：聊天內容若未寫入 Git，不視為正式規格。

### D-002 — 單店、多人工作室

- 狀態：Accepted
- 決策：目前只有一間店，但核心模型必須從第一天支援多位設計師。
- 影響：不得採單人預約資料模型。

### D-003 — 客人可指定設計師

- 狀態：Accepted
- 決策：預約流程必須允許指定設計師。
- 延伸：可預留「不指定」選項，但是否啟用待 Owner 決定。

### D-004 — 一般客人不需登入

- 狀態：Accepted
- 決策：未登入客人也可完成預約。
- 影響：會員登入不能成為預約阻礙。

### D-005 — 未來會員可綁定本店會員

- 狀態：Accepted
- 決策：保留會員登入與既有會員資料綁定能力。
- 限制：目前會員制度與系統尚未定案，不可先做正式權益或金流。

### D-006 — 保存客戶與服務歷史

- 狀態：Accepted
- 決策：系統需保留客戶基本資料、預約歷史、服務內容與技術備註。
- 限制：欄位可見性、保存期限與行銷同意需後續確認。

### D-007 — Google Calendar 保留並整合

- 狀態：Accepted
- 決策：Google Calendar 現在是手動預約工具，未來繼續作為行程顯示、提醒與封鎖時段的重要整合。
- 限制：正式預約狀態、客戶、會員與訂金資料不應只存在 Google Calendar。

### D-008 — 手機與 Apple Watch 是核心使用情境

- 狀態：Accepted
- 目標功能：整日行程、預約時間、封鎖時段、客戶查詢、下一位客人、標記完成。
- 分級：先 Calendar / PWA，再 Shortcuts + API，最後才評估原生 watchOS App。

### D-009 — 訂金非全面強制

- 狀態：Accepted
- 決策：一般預約可不付訂金；系統預留可選訂金。

### D-010 — 訂金客可有較高優先權

- 狀態：Accepted with Guardrail
- 決策：訂金客可在等候名單、新釋出空檔與未確認請求中優先。
- 保護規則：在 Owner 尚未核准明確政策前，不得自動擠掉已確認的免訂金預約。

### D-011 — Git 管協作，本機實作引擎

- 狀態：Accepted
- 決策：網站、預約核心、整合與測試從本機環境實作；GitHub 管理版本、規格、任務與審核。

### D-012 — 深色混合品牌方向

- 狀態：Accepted
- 決策：以 DUM 現有審美為核心，混合黑灰工業、美式幫派、硬派成熟與深色精品感。

### D-013 — 外部供應商必須經 Adapter

- 狀態：Accepted
- 決策：預約、日曆、通知、付款、登入與會員服務不得直接綁死在 UI 或 Domain 內。

### D-014 — Codex 本機環境是主要程式實作模式

- 狀態：Accepted
- 決策：從 M1 起，網站、預約引擎、測試、Build、除錯與整合由 Codex 在本機 Repository / Worktree 中實作。
- Work 定位：ChatGPT Work 只作為選用的文件、研究與非程式交付工具，不是主要程式實作者。
- 操作方式：Work 與 Codex 不假設自動切換；需要程式開發時由 Owner 直接選擇 Codex。
- 交接方式：Codex 只依 Git 文件、Issue、Branch、Commit、PR 與 Review 工作，不依賴規劃聊天視窗。

### D-015 — 專案只保留 GPT 與 Codex 兩個工作角色

- 狀態：Accepted
- 決策：取消 M1 的 Window A / B / C 三個平行 Codex 工作軌，改為兩個正式工作角色。
- GPT：Issue #13，負責規格、內容、Git 任務、QA、驗收與 PR Review。
- Codex：Issue #14，負責原 A / B / C 的全部程式範圍、引擎、UI、測試、Build 與整合。
- 歷史處理：Issues #4–#8 與 `docs/M1-THREE-WINDOW-PLAN.md` 標記為 Superseded，不得再用於新實作。
- 交接：兩個角色只透過 Git 文件、Issues、Commit、PR、Review 與 durable logs 協作。

### D-016 — 持續施工至 Blueprint Build-Complete

- 狀態：Accepted
- Git 紀錄：Issue #18
- Owner 決策：Codex 必須持續實作已接受 Blueprint 中所有技術上可完成的非 Production 範圍，不再把 Owner 人工審核當成繼續施工、建立 PR 或合併前置條件。
- 執行方式：每個工作仍需有 Issue、feature branch、checks、Commit、Push 與 PR；完成後接續下一個有 Git 依據的藍圖工作。
- Review：GPT / 產品 Review 可非同步進行；已存在的 Required fix 必須處理，但 Review 尚未開始本身不得阻止其他安全施工。
- 阻塞範圍：帳號註冊、憑證、第三方服務或 Owner 決策只阻塞直接受影響部分。其餘範圍使用 Mock、disabled adapter 或 `TODO(owner-decision)` 繼續。
- 安全界線：不得因此自行決定價格、政策、會員權益、個資規則、付款行為、真實身分或正式供應商，也不得把 build-complete 說成 production-ready。

### D-017 — MVP3 最小正式上線基線

- 狀態：Proposed / Owner confirmation required / not activated
- Git 紀錄：Epic #31、Issue #32
- Owner 指令：2026-08-01 核准開始執行切片；這不是下列八項具體值的逐項核准。
- 主機：此 Windows 電腦作為第一版單機 origin；接受單機故障期間中斷，正式啟用仍需 #37 GO。
- 公開入口：Cloudflare Tunnel → loopback origin；不做 router port-forward，不直接公開 Next.js 或資料庫 port。
- 資料庫：MVP3 採本機 NTFS SQLite、WAL、`better-sqlite3` 與單一 App process；Repository port 保留 PostgreSQL 遷移能力。
- 營運：可預約標籤為老闆／職員；每日 10:00–18:00 開始時段、60 分鐘固定 slot、未來 7 個台北日；成功寫入即成立。
- 個資：只收姓名、電話、選定時段／職員與選填註記；兩個 Staff 角色在受保護工作台具有相同可見權；可識別資料保留 12 個月，之後匿名化，備份殘留上限 28 日。
- 登入：Better Auth SQLite + Username plugin，只有兩個預先建立帳號，關閉註冊與帳號管理 UI；Session 絕對期限 8 小時並支援立即撤銷。
- 營運控制：Staging／Production 完全分離；每日備份至當週連接的 Owner 加密卸除式磁碟、A／B 每週輪替且一份離機，所有物件硬上限 28 日；每月還原演練、RPO 24h／RTO 4h（只適用健康 origin 或已準備的替代主機）。
- 詳細合約：`docs/PRODUCTION-BASELINE.md`。
- 核准門檻：Owner 必須在 Issue #32 明確核准八項選擇，並記錄實際網域與負責維護／告警／回滾的非秘密責任人；核准前不得完成 #32 或開始 #33。
- 安全界線：密碼、Token、備份路徑中的秘密與帳號憑證不進 Git。

---

## Reserved

### R-001 — 第三方預約 App / 平台

MVP3 提案選擇自建 Next.js Modular Monolith 與站內資料邊界；Owner 接受 D-017 後，第三方預約平台只保留為未來替換候選，不阻塞 #33。未來重新評估時需比較：

- 多設計師排班
- Google Calendar 同步
- iPhone 管理體驗
- Apple Watch 可行性
- API 與 Webhook
- 台灣付款與通知支援
- 費用
- 資料匯出與供應商鎖定風險

### R-002 — 技術堆疊正式版本

建議方向為 TypeScript、Next.js、模組化 Monorepo / Modular Monolith，但實際版本與工具需由本機環境驗證後鎖定。

### R-003 — 正式資料庫與後端平台

D-017 提案選擇單機 SQLite，待 Owner 核准後才成為 MVP3 決策。PostgreSQL 保留為第二個 App node、持續 SQLite 寫入壅塞或高可用需求出現時的遷移目標，不再阻塞核准後的 #33。

### R-004 — 通知供應商

手機推播、Email、SMS、LINE 等通路與供應商尚未定案。

### R-005 — 付款供應商

訂金與付款供應商尚未定案。

### R-006 — 不指定設計師邏輯

是否啟用、如何分配、是否考慮最早時段、輪班、公平性或業績規則，尚未定案。

### R-007 — 原生 Apple Watch App

第一版不承諾；先驗證 Calendar、PWA 與 Shortcuts 是否足夠。

---

## Needs Owner Decision

下列項目只適用於 D-017 以外的未來功能或 D-017 尚待 Owner 明確核准／安全輸入的部分。

- 正式服務名稱、價格與服務時間
- 設計師名單、介紹、照片與服務能力
- MVP3 固定時段以外的營業、休假與排班規則
- 訂金金額、適用服務與退款規則
- 取消期限、遲到、爽約與插單政策
- 已確認免訂金預約是否可能被調整
- 會員制度、儲值、次數、點數與到期規則
- LINE 登入與官方 LINE 預約整合
- 實際網域字串、正式字體、正式色碼與品牌文案
- #36 的安全輸入值：實際 backup path、告警地址與部署帳號；備份媒體型態與輪替規則已在 D-017 提案選定

---

## Rejected / Not Now

### X-001 — 把 Google Calendar 當完整客戶與會員資料庫

原因：無法可靠承擔完整預約狀態、客戶歷史、會員、訂金與稽核需求。

### X-002 — 第一階段直接開發原生 iOS / watchOS App

原因：成本與複雜度過高；先用手機 PWA、Calendar 與 Shortcuts 驗證實際需求。

### X-003 — 第一階段啟用真實金流與會員

原因：營運政策與責任尚未確認。

### X-004 — 將第三方供應商 SDK 散落在整個程式

原因：會造成供應商鎖定並破壞可替換性。

### X-005 — M1 同時啟動三個 Codex 實作者

原因：Owner 決定簡化為單一 Codex 程式實作與單一 GPT 規格 / QA 工作，降低介面混淆、分支衝突與續接成本。
