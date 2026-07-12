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

---

## Reserved

### R-001 — 第三方預約 App / 平台

候選可包含專用預約平台或自建核心，但尚未正式選定。正式選擇前需比較：

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

PostgreSQL 類型資料庫為優先候選，實際託管方案待評估。

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

- 正式服務名稱、價格與服務時間
- 設計師名單、介紹、照片與服務能力
- 營業時間、休假與排班規則
- 訂金金額、適用服務與退款規則
- 取消期限、遲到、爽約與插單政策
- 已確認免訂金預約是否可能被調整
- 會員制度、儲值、次數、點數與到期規則
- 客戶資料保存期限與員工權限
- LINE 登入與官方 LINE 預約整合
- 網域、正式字體、正式色碼與品牌文案
- 正式部署與營運監控方案

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