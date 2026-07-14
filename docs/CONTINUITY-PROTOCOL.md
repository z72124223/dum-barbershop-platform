# 工作中斷與額度恢復續接規則

版本：2.1
狀態：Required

本文件確保 GPT 或 Codex 在使用量不足、Task 關閉、模式切換、電腦重啟或換新 Task 後，都能只依 Git 順利接續。

## 1. 核心原則

1. 不得把未完成狀態只留在聊天或模型記憶。
2. 不得把重要程式進度只留在未提交的本機檔案。
3. GPT 與 Codex 各自使用固定 Issue 與 durable log：
   - GPT：Issue #13、`docs/workstreams/GPT.md`
   - Codex：Issue #14、`docs/workstreams/CODEX.md`
4. Codex 的可靠 checkpoint 必須包含 Commit、Push、日誌與 Issue comment。
5. GPT 的可靠 checkpoint 必須包含已提交文件或可核對的 Issue / Review 更新、日誌與 Issue comment。
6. 接手者不需要知道前一個聊天 Task 說過什麼。
7. Checkpoint、換 Task、Review 等待或額度恢復都只是續接機制，不代表整體 Blueprint 施工可以永久停止。

## 2. 狀態代碼

角色日誌的 `Status` 只使用：

- `READY`
- `IN_PROGRESS`
- `BLOCKED_DEPENDENCY`
- `BLOCKED_OWNER`
- `PAUSED_QUOTA`
- `PAUSED_LOCAL`
- `PR_OPEN`
- `REVIEWING`
- `DONE`

不得使用「差不多完成」等模糊狀態。

## 3. Checkpoint 時機

至少在以下情況建立 checkpoint：

- 完成一個可描述階段
- 開始重大重構前
- 修改共用 contract 前
- 跑完測試或 Build 後
- 完成一輪 PR Review 後
- 準備離開 Task 前
- 估計使用量不足以完成下一階段時

## 4. Codex 額度將盡時

停止新增大範圍工作，依序：

1. 執行 `git status --short`。
2. 移除不應提交的秘密、真實資料與暫存。
3. 執行目前範圍的最小驗證。
4. Commit 可恢復工作，建議格式：

```text
checkpoint(#14): <明確完成狀態>
```

5. Push 到 `codex/14-m1-platform` 或 Issue #14 核准 branch。
6. 更新 `docs/workstreams/CODEX.md`。
7. 在 Issue #14 留下 `CHECKPOINT`。
8. 將狀態改為 `PAUSED_QUOTA`。
9. 原則上做到 `Uncommitted changes: none`。

Build 未通過仍可 checkpoint，但必須清楚列出失敗與下一步。

## 5. GPT 額度將盡時

GPT 必須：

1. 將規格或文件更新提交到 Git，或確認 Issue / Review comments 已正式留下。
2. 更新 `docs/workstreams/GPT.md`。
3. 在 Issue #13 留下 `CHECKPOINT`。
4. 記錄正在審查的 PR / Commit、尚未完成的檢查及 Exact next action。
5. 將狀態改為 `PAUSED_QUOTA`。

GPT 不得只在聊天中留下「Codex 下一步應該做什麼」。正式要求必須進入 Issue 或 PR Review。

## 6. 日誌必填欄位

```text
Status:
Role / Issue:
Branch or reviewed PR:
Base / Last synced main SHA:
Last good commit SHA:
Last checkpoint time (Asia/Taipei):
Completed:
In progress:
Exact next action:
Exact resume steps:
Files / scope currently owned or reviewed:
Checks passed:
Checks failing or not run:
Known blockers:
Owner decision needed:
Uncommitted changes:
PR:
```

`Exact next action` 必須是一個可直接執行的步驟，不得只寫「繼續做」。

## 7. CHECKPOINT 模板

```markdown
## CHECKPOINT

- Role: GPT / Codex
- Status: PAUSED_QUOTA
- Issue: #13 / #14
- Branch or PR: `<reference>`
- Last good commit: `<sha>`
- Completed: ...
- In progress: ...
- Exact next action: ...
- Resume steps: ...
- Checks passed: ...
- Checks failing / not run: ...
- Blockers: ...
- Uncommitted changes: none
```

## 8. Codex 恢復流程

1. 讀 `AGENTS.md` 與必讀文件。
2. 讀 Issue #14 最新內容與 comments。
3. 讀 `docs/workstreams/CODEX.md`。
4. 執行：

```bash
git fetch --all --prune
git checkout codex/14-m1-platform
git pull --ff-only
```

5. 核對 HEAD 與 `Last good commit SHA`。
6. 使用日誌記錄的 package manager 安裝依賴。
7. 重跑最後一個最小驗證。
8. 狀態改回 `IN_PROGRESS`。
9. 從 `Exact next action` 開始，不重做整體規劃。

若 branch、日誌與 Issue 不一致，先留言記錄差異，暫停寫程式。

## 9. GPT 恢復流程

1. 讀 `AGENTS.md` 與必讀文件。
2. 讀 Issue #13 最新內容與 comments。
3. 讀 `docs/workstreams/GPT.md`。
4. 查看 Issue #14、Codex 最新 checkpoint 與 Draft PR。
5. 核對最後審查的 Commit / PR revision。
6. 狀態改回 `IN_PROGRESS` 或 `REVIEWING`。
7. 從 `Exact next action` 開始。

## 10. 換新 Task 接手

新 Task 必須沿用原角色：

- 同一個 Issue
- 同一個 Codex branch 或同一個被審查 PR
- 同一份角色日誌
- 同一份驗收條件

不得因為換 Task 就建立平行程式實作或重新發明規格。

## 11. 阻塞處理

### 需要 Owner 決策

- 在相關 Issue 標記 `OWNER DECISION REQUIRED`。
- 更新 `docs/DECISIONS.md`。
- 使用最保守、可逆、Mock 或 disabled 狀態。
- 只停止受影響部分。
- 不等待 Owner 人工審核其餘非 Production 工作；繼續下一個有 Git 依據的安全範圍。

### Codex 需要規格澄清

- 在 Issue #14 留下具體問題與目前最保守處理方式。
- GPT 在 GitHub 回答並更新規格或 Issue。
- Codex 繼續不受該問題影響的工作。

### GPT 發現程式缺陷

- 在 Draft PR 留下具體 Review comment，或建立缺陷 Issue。
- 說明預期行為、實際行為、重現方式與驗收條件。
- 不直接建立第二套程式碼。

## 12. PR 前與合併後

Codex 建立 Draft PR 前：

- `docs/workstreams/CODEX.md` 狀態改為 `PR_OPEN`
- 記錄 PR URL、完整 checks、限制與未完成內容
- Push 所有 Commit
- 確認無未記錄的重要修改

GPT 開始審查時：

- `docs/workstreams/GPT.md` 狀態改為 `REVIEWING`
- 記錄 PR 與審查 Commit
- 將所有要求正式放入 Review / Issues

PR 合併且對應 Issue 驗收與 checks 完成後，Codex 日誌可改為 `DONE`；GPT 日誌依其非同步 Review 進度獨立更新。

非 Production 實作不需要 Owner 人工審核才可合併。必要 checks 通過、沒有未解決 Required fix、資料與秘密檢查通過後，Codex 可合併並繼續下一個 Blueprint Issue；GPT Review 與里程碑文件可非同步補充。

`DONE` 只代表該 Issue 或里程碑完成。Codex 必須繼續到 Blueprint build-complete；Production 專屬的決策、帳號、憑證與不可逆操作需明確列為尚未啟用，不得拿來阻止其餘施工或誤報為已完成。
