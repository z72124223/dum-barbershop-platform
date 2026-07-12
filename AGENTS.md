# AGENTS.md — DUM BARBERSHOP Platform

本檔案適用於所有人類開發者、GPT Work、Codex、其他 AI Agent 與自動化工具。

## 1. 唯一最高標準

GitHub Repository `z72124223/dum-barbershop-platform` 是本專案的 **Single Source of Truth**。

開始任何工作前，必須依序讀取：

1. `docs/PROJECT-CONSTITUTION.md`
2. `docs/DECISIONS.md`
3. `docs/BLUEPRINT.md`
4. `docs/ARCHITECTURE.md`
5. `docs/ROADMAP.md`
6. `docs/WORK-PROTOCOL.md`
7. 與任務相關的 GitHub Issue

聊天、口頭描述、暫存筆記或本機未提交檔案，若未寫入 Git，不構成正式規格。

## 2. 不得擅自越權

下列事項沒有 Owner 明確決策與 Git 紀錄時，不得自行定案：

- 訂金金額與退款規則
- 取消、遲到、爽約與插單政策
- 會員、儲值、點數及優惠權益
- 正式付款供應商
- 正式預約供應商
- 個資保存期限與員工可見範圍
- 正式服務價格、服務時間與設計師名單
- 分店與權限政策
- 任何會影響客人權益或店家責任的自動決策

不確定時，保留 `TODO(owner-decision)`，並建立或更新 GitHub Issue。

## 3. 工作方式

- 每個開發任務應有 GitHub Issue。
- 每個 Agent 使用獨立分支；禁止多人同時在同一分支工作。
- 建議分支格式：`agent/<issue-number>-<slug>`、`work/<issue-number>-<slug>`。
- 實作前在 Issue 留下認領訊息，避免重複工作。
- 原則上不得直接推送 `main`。
- 變更透過 Pull Request 合併；PR 必須說明變更、影響、驗證與未解決事項。
- 若程式行為與文件衝突，先停止擴大實作，以 `PROJECT-CONSTITUTION.md` 與 `DECISIONS.md` 為準。

## 4. 本機引擎原則

實際網站、預約核心、整合與測試皆從本機工作環境實作。Git 負責版本、規格、協作與審核。

- 不允許只有雲端聊天紀錄而沒有可重現程式碼。
- 不允許把 API Key、密碼、Token 或真實客戶資料提交到 Git。
- 所有必要環境變數必須記錄在 `.env.example`，但不得含真實值。
- 專案必須能依 README 在乾淨本機環境啟動。

## 5. 架構邊界

第一階段採模組化架構，預約核心不得直接綁死單一第三方供應商。

至少維持以下邊界：

- Website / Customer UI
- Staff App / Staff UI
- Booking Domain
- Customer & Membership Domain
- Calendar Integration
- Notification Integration
- Payment / Deposit Integration

第三方服務必須經 Adapter 介面接入，方便替換。

## 6. 完成定義

任務只有在以下條件成立時才算完成：

- 符合 Issue 驗收條件
- 不違反專案憲法與已確認決策
- 通過相關型別、Lint、測試與 Build
- 文件同步更新
- 無真實秘密或客戶個資進入 Git
- PR 清楚揭露限制與後續工作

## 7. Agent 回報格式

完成工作時至少回報：

1. 分支名稱
2. 修改檔案
3. 完成功能
4. 執行的驗證
5. 尚未完成或需要 Owner 決策的項目
6. PR 連結或 Commit SHA
