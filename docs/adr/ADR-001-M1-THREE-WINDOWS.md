# ADR-001 — M1 使用三個獨立工作窗口

- 狀態：Accepted
- 日期：2026-07-12
- Owner：`z72124223`
- 適用：M1 Local Framework

## Context

Owner 希望把專案拆成三等份，交給三個獨立工作窗口。每個窗口只透過 Git 讀取藍圖、任務與進度，並且在使用量不足或視窗中斷後能無縫恢復。

若三個窗口共享 branch、修改相同檔案或依賴聊天記憶，將造成重複實作、衝突與無法續接。

## Decision

M1 固定拆為：

1. Window A / Issue #4 — Platform & Public Experience
2. Window B / Issue #5 — Domain & Mock Engine
3. Window C / Issue #6 — Booking, Staff & Integration

採用以下治理：

- 每個窗口獨立 Issue、branch / worktree 與工作日誌
- 以目錄所有權避免衝突
- 以 `BOOTSTRAP_READY`、`DOMAIN_CONTRACT_READY`、`UI_INTEGRATION_READY` 與 `FINAL_VALIDATION` Gate 協作
- 所有 Checkpoint 必須 Commit、Push、更新日誌與 Issue
- 使用量不足時依 `docs/CONTINUITY-PROTOCOL.md` 暫停
- 新窗口接手沿用原 Issue、branch 與日誌
- Issue #8 負責最終整合 Gate

## Consequences

正面：

- 三個窗口可以清楚知道自己的範圍
- 降低根設定、UI 與 Domain contract 衝突
- 不依賴任何單一聊天視窗
- 額度恢復後可從遠端 Commit 精確接續
- 可由另一個 Agent 接手同一工作軌

限制：

- Window C 完整整合需等待 A、B 的 Gate
- 根設定、lockfile 與共用 contract 必須有單一 owner
- 每個窗口需要維護 Durable Log
- M1 不在三個工作軌 PR 都存在前宣稱完成

## References

- `docs/M1-THREE-WINDOW-PLAN.md`
- `docs/CONTINUITY-PROTOCOL.md`
- `docs/TASK-LOG.md`
- `docs/workstreams/M1-A.md`
- `docs/workstreams/M1-B.md`
- `docs/workstreams/M1-C.md`
- Issues #2, #4, #5, #6, #7, #8