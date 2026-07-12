# DUM BARBERSHOP Platform — Execution Mode

版本：2.0.0  
狀態：Accepted

## 1. 兩個工作角色

本專案只維持：

- **GPT 工作**：Issue #13，負責規格、內容、Git 任務、QA 與 PR Review。
- **Codex 工作**：Issue #14，負責全部本機程式碼、引擎、測試、Build 與整合。

詳細責任以 `docs/TWO-ROLE-WORK-MODEL.md` 為準。

## 2. Work / Codex 不會建立新工作者

Work 與 Codex 是同一個 Task 內可選的工作模式。切換模式：

- 不會建立新 Task
- 不會建立新視窗
- 不會建立第二個 Agent
- 不會自動交接 Git 工作

Owner 若需要 GPT 與 Codex 各自工作，應建立兩個獨立 Task，或至少以 Issue #13 與 #14 明確分離工作紀錄。

## 3. GPT 執行方式

GPT 開始工作時必須：

1. 讀 `AGENTS.md` 與必讀文件。
2. 讀 Issue #13。
3. 讀 `docs/workstreams/GPT.md`。
4. 維護規格、內容、Issues、QA 與 Review。
5. 不直接修改正式應用程式碼。
6. 在中斷前更新日誌與 Issue checkpoint。

GPT 可持續從 Git 追蹤 Codex 的 Commit、PR、checks 與未解決問題。

## 4. Codex 執行方式

從 M1 起，所有程式實作由 Codex 完成。Codex 必須：

1. 開啟或 Clone `z72124223/dum-barbershop-platform`。
2. 使用本機環境；可用 Local checkout 或 Worktree，但不得直接在 `main` 開發。
3. 讀 `AGENTS.md` 與必讀文件。
4. 認領 Issue #14。
5. 使用 `codex/14-m1-platform` 或 Issue 核准的 feature branch。
6. 實作網站、Domain、Mock engine、Staff UI、測試與整合。
7. 執行 Typecheck、Lint、Tests 與 Production Build。
8. 定期 Commit、Push 並更新 `docs/workstreams/CODEX.md`。
9. 建立 Draft PR。
10. 回應 GPT Review，直到驗收完成。

## 5. Codex 不需回規劃聊天取得下一步

Codex 的下一步來源依序為：

1. Project Constitution
2. Decisions
3. Blueprint / Architecture / Roadmap
4. Issue #14
5. GPT 在 PR 的 Review comments 或新建缺陷 Issue
6. `docs/workstreams/CODEX.md` 的 Exact next action

沒有 Issue 或 Review 依據的功能不得自行增加。

## 6. Git 是唯一交接面

GPT 與 Codex 不依賴跨 Task 的隱性記憶。所有交接必須透過：

- Repository 文件
- GitHub Issues
- Branch / Commit
- Pull Requests
- Review comments
- Durable work logs

新的 GPT 或 Codex Task 應能只讀 Git 還原完整上下文。

## 7. 本機程式與正式資料限制

- 程式、依賴、測試、Build 與除錯由 Codex 本機環境執行。
- 真實 API Key、Token、付款資料與客戶個資不得提交。
- M1 只使用 fictional Mock Data。
- 正式預約、付款、Calendar、通知與會員供應商未核准前不得啟用。