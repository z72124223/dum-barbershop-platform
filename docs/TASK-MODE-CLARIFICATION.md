# Task 與模式的正確關係

本文件釐清 ChatGPT Project、Task、Work、Codex 與本專案兩個工作角色的關係。

## 核心結論

- `Work` 與 `Codex` 是同一個 Task 內可選的工作模式。
- 切換 Work / Codex 不會建立新的 Task、視窗或 Agent。
- 本專案不再使用 Window A / B / C 三工作軌。
- 現在只保留兩份工作：**GPT 工作**與**Codex 工作**。

## 正確使用方式

### GPT 工作

- 執行 Issue #13。
- 負責 Git 文件、規格、內容、QA、Issue 與 PR Review。
- 工作日誌：`docs/workstreams/GPT.md`。

### Codex 工作

- 執行 Issue #14。
- 負責完整本機程式碼、預約引擎、UI、測試、Build 與整合。
- 工作日誌：`docs/workstreams/CODEX.md`。
- 預設 branch：`codex/14-m1-platform`。

Owner 可以建立兩個獨立 Task，也可以先使用 GPT 工作完成規格，再建立 Codex Task 實作。無論介面如何安排，兩份工作的正式狀態都只能寫在 Git。

## 禁止的誤解

- 不得把同一 Task 中切換 Work / Codex，視為兩個獨立工作者。
- 不得再啟動 Issues #4、#5、#6 的三個平行 Codex 實作。
- 不得建立與 Issue #14 重複的第二套程式實作。
- 不得依靠前一個聊天 Task 的記憶交接。

## 名詞對照

| 名詞 | 本專案定義 |
|---|---|
| Project | 包含本 Repository 的工作空間 |
| Task | 一個獨立對話、執行紀錄與成果 |
| Work / Codex | Task 的工作模式，不是不同工作者 |
| GPT 工作 | Issue #13：規格、內容、QA、Git 協調 |
| Codex 工作 | Issue #14：完整程式實作與驗證 |
| Worktree | Codex 可選用的隔離 Git 工作副本；單一 Codex 實作者並非強制 |

詳細規則以 `docs/TWO-ROLE-WORK-MODEL.md` 為準。