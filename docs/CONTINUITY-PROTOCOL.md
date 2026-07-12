# 工作中斷與額度恢復續接規則

版本：1.0  
狀態：Required

本文件確保任何 Codex / Work 視窗在使用量不足、視窗關閉、模型切換、電腦重啟或換另一個窗口後，都能只依 Git 順利接續。

---

## 1. 核心原則

1. 不得把未完成狀態只留在聊天或模型記憶。
2. 不得把重要進度只留在未提交的本機檔案。
3. 每個工作軌必須有自己的 branch、Issue 與 `docs/workstreams/*.md` 日誌。
4. 每次可靠 Checkpoint 都必須包含 Commit、Push、日誌與 Issue comment。
5. 接手者不需要知道前一個聊天視窗說過什麼。

---

## 2. 狀態代碼

工作日誌的 `Status` 只使用下列值：

- `READY`：尚未認領
- `IN_PROGRESS`：進行中
- `BLOCKED_DEPENDENCY`：等待另一工作軌的明確 Gate
- `BLOCKED_OWNER`：需要 Owner 決策
- `PAUSED_QUOTA`：因使用量或視窗限制暫停
- `PAUSED_LOCAL`：因本機環境或硬體問題暫停
- `PR_OPEN`：Draft PR 已開，等待整合或審核
- `DONE`：已合併並通過該工作軌驗收

不得使用模糊文字如「差不多完成」取代狀態。

---

## 3. 正常 Checkpoint 頻率

至少在以下情況建立 Checkpoint：

- 完成一個可描述的小階段
- 開始重大重構前
- 修改共用 contract 前
- 跑完一輪測試或 Build 後
- 準備離開視窗前
- 估計剩餘使用量不足以安全完成下一個階段時

建議每 30–60 分鐘或每個明確交付點至少一次。

---

## 4. 額度將盡時的強制流程

發現使用量即將不足時，停止新增大範圍工作，依序完成：

1. 執行 `git status --short`。
2. 移除不應提交的暫存、秘密與真實資料。
3. 儘可能執行與目前範圍相關的最小驗證。
4. 將可恢復的工作 Commit。
5. Commit 格式：

```text
checkpoint(#<issue>): <目前完成到的明確狀態>
```

6. Push 到自己的遠端 branch。
7. 更新自己的 `docs/workstreams/M1-*.md`。
8. 在自己的 Issue 留下 `CHECKPOINT` comment。
9. 確認本機沒有只存在但未記錄的重要資訊。
10. 將日誌狀態改為 `PAUSED_QUOTA`。

若程式尚未通過 Build，也可以提交 checkpoint，但必須清楚列出失敗原因與下一步，不能假裝通過。

---

## 5. 工作日誌必填欄位

每次暫停或交接時，工作日誌至少必須包含：

```text
Status:
Issue:
Branch:
Base / Last synced main SHA:
Last good commit SHA:
Last checkpoint time (Asia/Taipei):
Completed:
In progress:
Exact next action:
Exact resume commands:
Files currently owned / touched:
Checks passed:
Checks failing or not run:
Known blockers:
Owner decision needed:
Uncommitted changes:
PR:
```

`Exact next action` 必須是可直接執行的單一步驟，不得只寫「繼續做」。

正確示例：

> 在 `src/domain/booking/availability.ts` 補上跨日封鎖判斷，然後執行 `npm test -- availability`。

錯誤示例：

> 繼續完成預約系統。

---

## 6. Issue CHECKPOINT comment 模板

```markdown
## CHECKPOINT

- Status: PAUSED_QUOTA
- Branch: `work/5-domain-engine`
- Last good commit: `<sha>`
- Completed: ...
- In progress: ...
- Exact next action: ...
- Resume commands:
  ```bash
  git fetch origin
  git checkout work/5-domain-engine
  git pull --ff-only
  <install command>
  <validation command>
  ```
- Checks passed: ...
- Checks failing / not run: ...
- Blockers: ...
- Uncommitted changes: none
```

如果存在未提交改動，必須說明原因、檔案與是否可安全刪除。原則上中斷前應做到 `Uncommitted changes: none`。

---

## 7. 額度恢復或新窗口接手流程

接手者必須：

1. 讀 `AGENTS.md`。
2. 讀必讀文件。
3. 讀 `docs/M1-THREE-WINDOW-PLAN.md`。
4. 讀自己的 Issue。
5. 讀自己的工作日誌最後一個 Checkpoint。
6. 讀 Issue 最新 comments。
7. 執行：

```bash
git fetch --all --prune
git checkout <workstream-branch>
git pull --ff-only
```

8. 核對 HEAD 是否等於日誌記錄的 `Last good commit SHA`。
9. 使用 Repository 指定的 package manager 安裝依賴。
10. 重跑日誌列出的最後驗證或最小 smoke check。
11. 將狀態由 `PAUSED_QUOTA` 改回 `IN_PROGRESS`。
12. 從 `Exact next action` 開始，不重新設計整個範圍。

若 branch 與日誌不一致，停止寫程式，先在 Issue 記錄差異。

---

## 8. 換另一個窗口接手

新窗口必須沿用原工作軌：

- 同一個 Issue
- 同一個 branch
- 同一份工作日誌
- 同一份 acceptance criteria

不得因為換窗口就另開一套平行實作，除非原 branch 已確認不可恢復，並在 Issue 中留下原因與新的 migration plan。

---

## 9. 阻塞處理

### 等待其他工作軌

狀態改成 `BLOCKED_DEPENDENCY`，並記錄：

- 等待哪個 Gate
- 等待哪個 Issue / PR
- 自己已完成到哪裡
- Gate 完成後第一個動作

可以繼續做不依賴該 Gate 的範圍，不需要整個窗口停止。

### 需要 Owner 決策

只停止受影響部分：

- 在 Issue 標記 `OWNER DECISION REQUIRED`
- 更新 `docs/DECISIONS.md` 或提出待決策項目
- 使用最保守、可逆、Mock 或 disabled 狀態保留介面
- 不得自行選擇會影響顧客權益或店家責任的規則

---

## 10. PR 前的最終 Checkpoint

建立 Draft PR 前：

- 工作日誌狀態改為 `PR_OPEN`
- 記錄 PR URL
- 列出完整 Checks
- 列出未完成內容
- 列出跨工作軌依賴
- Push 所有 Commit
- 確認工作目錄沒有未記錄的重要修改

PR 合併後才將狀態改為 `DONE`。