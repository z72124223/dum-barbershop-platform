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
6. `docs/EXECUTION-MODE.md`
7. `docs/WORK-PROTOCOL.md`
8. `docs/M1-THREE-WINDOW-PLAN.md`（M1 期間必讀）
9. `docs/CONTINUITY-PROTOCOL.md`
10. `docs/TASK-LOG.md`
11. 與任務相關的 GitHub Issue
12. 該工作軌的 `docs/workstreams/*.md`

聊天、口頭描述、暫存筆記或本機未提交檔案，若未寫入 Git，不構成正式規格。

## 2. 主要實作模式

- 本專案從 M1 起的主要程式實作者是 **Codex**。
- 程式開發優先使用 **Codex 本機環境**。
- Work 與 Codex 不會被假設為自動切換；需要寫程式、執行終端、測試或 Build 時，必須直接使用 Codex。
- ChatGPT Work 只作為選用的文件、研究與非程式交付工具，不得取代本機 Codex 程式流程。
- 詳細規則以 `docs/EXECUTION-MODE.md` 為準。

## 3. M1 三工作窗口

M1 固定拆為三個工作軌：

- Window A / Issue #4：Platform & Public Experience
- Window B / Issue #5：Domain & Mock Engine
- Window C / Issue #6：Booking, Staff & Integration

每個窗口必須：

- 使用自己的 Issue、branch / worktree 與工作日誌
- 只修改 `docs/M1-THREE-WINDOW-PLAN.md` 分配給自己的檔案
- 在開始時於 Issue 留下 `CLAIMED`
- 在 Gate 時留下 Commit SHA
- 在中斷前依 `docs/CONTINUITY-PROTOCOL.md` 建立 Durable Checkpoint

禁止三個窗口共用分支、重複建立 scaffold、重複建立 domain types 或建立第二個 lockfile。

## 4. 不得擅自越權

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

不確定時，保留 `TODO(owner-decision)`，並建立或更新 GitHub Issue。只停止受影響部分，不得因此停止所有無關工作。

## 5. 工作方式

- 每個開發任務必須有 GitHub Issue。
- 每個 Agent 使用獨立分支；禁止多人同時在同一分支工作。
- 分支格式：`agent/<issue-number>-<slug>` 或 `work/<issue-number>-<slug>`。
- 實作前在 Issue 留下認領訊息，避免重複工作。
- 原則上不得直接推送 `main`。
- 變更透過 Draft Pull Request 合併；PR 必須說明變更、影響、驗證、限制與未解決事項。
- 若程式行為與文件衝突，先停止擴大實作，以 `PROJECT-CONSTITUTION.md` 與 `DECISIONS.md` 為準。
- 完成目前 Issue 後，可依 Repository 中下一個明確且未阻擋的 Issue 繼續；不得自行發明沒有 Issue 的功能。
- 需要跨工作軌修改時，先在 Issue 留下 `CROSS-STREAM REQUEST`。

## 6. 中斷與使用量不足

- 不得只留下聊天記憶或未 Push 的本機進度。
- 使用量將盡、視窗結束或換窗口前，必須 Commit、Push、更新自己的工作日誌並在 Issue 留下 `CHECKPOINT`。
- 日誌必須記錄 `Last good commit SHA`、`Exact next action`、恢復指令、已通過與未通過的檢查。
- 新窗口接手時沿用同一個 Issue、branch 與工作日誌，不得另建平行實作。
- 完整規則以 `docs/CONTINUITY-PROTOCOL.md` 為準。

## 7. 本機引擎原則

實際網站、預約核心、整合與測試皆從本機工作環境實作。Git 負責版本、規格、協作與審核。

- 不允許只有雲端聊天紀錄而沒有可重現程式碼。
- 不允許把 API Key、密碼、Token 或真實客戶資料提交到 Git。
- 所有必要環境變數必須記錄在 `.env.example`，但不得含真實值。
- 專案必須能依 README 在乾淨本機環境啟動。

## 8. 架構邊界

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

## 9. 完成定義

任務只有在以下條件成立時才算完成：

- 符合 Issue 驗收條件
- 不違反專案憲法與已確認決策
- 通過相關型別、Lint、測試與 Build
- 文件與工作日誌同步更新
- 無真實秘密或客戶個資進入 Git
- 所有工作已 Commit 並 Push
- PR 清楚揭露限制與後續工作
- 可由另一個全新窗口只讀 Git 後接手

## 10. Agent 回報格式

完成或暫停工作時至少回報：

1. Issue 與工作軌
2. 分支名稱
3. Last good commit SHA
4. 修改檔案
5. 完成功能
6. 執行的驗證
7. 尚未完成、阻塞或需要 Owner 決策的項目
8. Exact next action
9. PR 連結或 Commit SHA
10. Uncommitted changes 是否為 none