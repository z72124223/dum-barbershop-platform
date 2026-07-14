# DUM BARBERSHOP Platform — GPT / Codex Work Protocol

版本：2.1
狀態：Required

本文件規範 Owner、GPT 與 Codex 如何透過 Git 共同完成專案。

## 1. 角色

### Owner

- 最終商業與責任決策者。
- 核准 Frozen Core、營運政策、會員、訂金、個資、正式供應商與上線。
- 對 `Needs Owner Decision` 項目做最終決定。

### GPT — Issue #13

- 維護 Blueprint、Decisions、Roadmap、Architecture、Issues 與驗收條件。
- 整理品牌內容、資料需求與 QA checklist。
- 審查 Codex PR 是否符合 Git 規格。
- 將程式修改要求寫成 Review comments 或缺陷 Issues。
- 維護 GPT durable log 與里程碑 Task Log。
- 不直接建立平行程式版本。
- Review 可非同步進行，不作為 Owner 人工核准或 Codex 持續施工的阻塞關卡。

### Codex — Issue #14

- 在本機環境實作所有程式碼、預約引擎、UI、測試與整合。
- 維護 feature branch、Commit、Push、checks 與 Draft PR。
- 維護 Codex durable log。
- 回應 GPT Review。
- 不自行決定 Reserved 商業規則。

## 2. 規格優先順序

任何工作都必須依 `docs/PROJECT-CONSTITUTION.md` 的優先順序判斷。

正式程式工作必須同時具備：

1. Repository 文件依據
2. GitHub Issue
3. 明確 Scope / Out of scope
4. Acceptance criteria
5. Validation requirements
6. Reserved / Owner decision guardrails

沒有 Issue 的想法不得直接變成功能。

## 3. GPT 工作流程

1. 讀 `AGENTS.md` 與必讀文件。
2. 讀 Issue #13 與 `docs/workstreams/GPT.md`。
3. 更新規格、Issues、內容或 QA。
4. 查看 Codex Issue #14、checkpoints 與 Draft PR。
5. Review 時引用具體檔案、行為、規格與驗收條件。
6. 將所有要求正式留在 GitHub，不只留在聊天。
7. 更新 GPT 日誌與 Task Log。

## 4. Codex 工作流程

1. 讀 `AGENTS.md` 與必讀文件。
2. 認領 Issue #14。
3. 使用 `codex/14-m1-platform` 或 Issue 核准 branch。
4. 從最新 `main` 開始，不直接修改 `main`。
5. 依 checkpoint 順序完成 Scaffold、Domain、Public Site、Booking / Staff、Validation。
6. 定期 Commit、Push、更新 Codex 日誌與 Issue comment。
7. 建立 Draft PR，列出 checks、限制與待決策項目。
8. 回應已存在的 GPT Required fixes 並重新驗證。
9. 必要 checks 通過且沒有未解決 Required fix 時，可合併非 Production PR，不等待 Owner 人工審核。
10. 從 Blueprint / Roadmap 建立或接續下一個 Issue 與 feature branch，繼續施工。

## 5. Branch 與 Worktree

- M1 Codex 預設 branch：`codex/14-m1-platform`。
- 只有一個 Codex 程式實作工作，不再使用三個平行 branches。
- Codex 可使用 Local checkout 或 Worktree；不得直接在 `main` 開發。
- 不得為同一 Issue 建立第二套程式實作、第二個 lockfile 或重複 Domain。
- GPT 文件修改可使用獨立 documentation branch / PR，或透過受控文件更新；不得覆蓋 Codex 未合併程式。

## 6. 責任邊界

### GPT 主要擁有

- `docs/**` 的產品規格、決策、Roadmap、QA 與工作流程
- GitHub Issues、PR Review 與驗收紀錄
- README 的產品與流程說明

### Codex 主要擁有

- `src/**`
- package manager / lockfile
- Build、Lint、Test、TypeScript 與框架設定
- `.env.example`
- README 的安裝、啟動、測試與 Build 指令
- `docs/workstreams/CODEX.md`

需要跨責任範圍時，先在 Issue 或 PR 留下說明，避免靜默覆蓋。

## 7. Checkpoints

Codex checkpoint 至少記錄：

- Gate 名稱
- Branch 與 Commit SHA
- 完成輸出
- checks
- 已知限制
- Exact next action

GPT checkpoint 至少記錄：

- 已完成規格 / QA / Review
- 正在審查的 PR 與 Commit
- 尚待 Codex 修正項目
- Owner decision / blocker
- Exact next action

完整續接規則以 `docs/CONTINUITY-PROTOCOL.md` 為準。

## 8. Review 規則

GPT Review 必須具體：

- 說明違反哪個文件、Issue 或驗收條件。
- 說明預期與實際行為。
- 提供重現步驟或可驗證標準。
- 區分 Required fix、Suggestion 與 Owner decision。

Codex 必須：

- 回覆每個 Required fix。
- 修改後重跑相關 checks。
- 不得用刪除有效功能或繞過測試來消除錯誤。
- Review 尚未開始或尚未回覆時，Codex 可繼續其他不相依的安全工作；後續 Required fix 仍必須追蹤處理。

## 9. 阻塞與決策

- 需要 Owner 決策時，GPT 更新 `docs/DECISIONS.md` 與 Issue。
- Codex 使用 Mock、disabled 或 `TODO(owner-decision)`，繼續其他工作。
- 帳號註冊、憑證或外部服務不可用時，也只停止該 Adapter 的正式啟用，不停止其餘藍圖施工。
- 技術阻塞由 Codex 記錄重現方式、錯誤、已嘗試方法與 Exact next action。
- GPT 不以聊天中的模糊建議取代正式 Issue / Review。

## 10. 完成、合併與持續施工

非 Production PR 合併前：

- 對應 Issue 驗收與 checks 完整。
- Codex 已自我核對 Constitution、Decisions、Blueprint、Architecture 與 Issue。
- 已存在的 Required fixes 已解決，或已明確轉成只阻塞受影響部分的 Issue。
- 無秘密、真實客戶資料或未核准正式整合。
- README 與 durable logs 更新。
- 不需要 Owner 人工核准；GPT 可在合併前後非同步留下 Review、缺陷與文件更新。

PR 合併後，Codex 依 Blueprint / Roadmap 建立或接續下一個範圍受限的 Issue 與 branch。GPT 可非同步更新 Roadmap、Task Log 與品質紀錄。

Codex 只有在 Blueprint 中所有技術上可實作的介面、Domain、流程、Adapter、狀態、測試與文件均達 build-complete 時，才可停止整體施工。尚未決定或需外部帳號的 Production 項目必須清楚列為 disabled / Mock / `TODO(owner-decision)`，不得被誤報為正式啟用。
