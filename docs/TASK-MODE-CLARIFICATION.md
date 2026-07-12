# Task 與模式的正確關係

本文件釐清 ChatGPT 桌面版中 Project、Task、Work、Codex 與 Worktree 的關係。

## 核心結論

- `Work` 與 `Codex` 是同一個 Task 內可選的工作模式；切換模式不會建立新的 Task、視窗或 Agent。
- 本專案所稱 Window A、Window B、Window C，正式含義是三個獨立的 **Codex Tasks**，不是同一個對話中切換三次模式。
- 三個 Task 必須建立在同一個 local project / Repository 下，並各自使用 Codex Worktree，才能平行工作且避免修改互相干擾。

## 正確啟動方式

在 `dum-barbershop-platform` local project 中建立三個獨立 Task：

1. Task A：Codex + Worktree，認領 Issue #4。
2. Task B：Codex + Worktree，認領 Issue #5。
3. Task C：Codex + Worktree，認領 Issue #6。

每個 Task 都必須：

- 從最新 `main` 開始。
- 讀取 `AGENTS.md` 與指定文件。
- 使用自己的 Issue、工作日誌與 Git branch。
- Commit、Push、建立 Draft PR。
- 在額度中斷前依 `docs/CONTINUITY-PROTOCOL.md` 留下 Durable Checkpoint。

## 禁止的操作

- 不得在同一個 Task 內用 Work / Codex 切換，當成三個獨立工作者。
- 不得讓三個 Task 共用同一個 Local checkout 直接同時修改。
- 不得建立第四個重複實作 Task；三個工作軌都已認領時，只能進行 Issue #8 的整合或 Review。

## 名詞對照

| 名詞 | 本專案定義 |
|---|---|
| Project | 包含同一 Repository 的工作空間 |
| Task | 一個獨立對話、執行紀錄與工作結果 |
| Work / Codex | Task 的工作模式，不是不同 Task |
| Worktree | Codex Task 的隔離 Git 工作副本 |
| Window A/B/C | 三個獨立 Codex Tasks 的代號 |
