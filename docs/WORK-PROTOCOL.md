# DUM BARBERSHOP Platform — Multi-Worker Protocol

版本：1.0  
狀態：Required

本文件規範 Owner、規劃視窗、GPT Work、Codex、人類開發者與其他 Agent 如何共同工作。

---

## 1. 角色

### Owner

- 最終商業與責任決策者
- 核准 Frozen Core、營運政策、會員、訂金、個資與正式上線
- 對 `Needs Owner Decision` 項目做最終決定

### Planner / Architect

- 將 Owner 想法整理成 Git 文件、Issue 與驗收條件
- 維護 Blueprint、Decisions、Roadmap、Architecture 與工作分配
- 不直接替 Owner 決定保留事項
- 不以聊天內容取代 Git 紀錄

### Implementer / Codex

- 從本機環境實作程式
- 依 Issue 與 Repository 文件工作
- 使用自己的 branch / worktree
- 執行安裝、測試、Lint、Build 與本機驗證
- 將程式、設定、文件與 Checkpoint 推回 Git

### Work / Research Window

- 可協助研究、比較、文件、表格或非程式成果
- 不假設會自動轉為 Codex
- 不得取代需要本機程式碼、終端機、測試與 Build 的流程

### Integrator

- 依已核准的合併順序整合多工作軌
- 解決衝突時保留 Frozen Core 與已確認 contract
- 執行完整驗證
- 更新 Task Log、README 與整合 Issue

---

## 2. 工作來源優先順序

任何人或 Agent 執行前都必須依 `PROJECT-CONSTITUTION.md` 的優先順序判斷規格。

實作任務必須同時具備：

1. Repository 文件依據
2. GitHub Issue
3. 明確驗收條件
4. 明確工作範圍與檔案所有權
5. 可識別的 branch / worktree

沒有 Issue 的想法不能直接變成功能。

---

## 3. Issue 規則

每個 Issue 至少包含：

- Objective
- Required reading
- Scope
- Out of scope
- File / directory ownership
- Dependencies and Gates
- Acceptance criteria
- Validation requirements
- Owner decisions that must remain reserved

執行者開始前必須在 Issue 留下：

```text
CLAIMED
Window / Agent:
Branch:
Base commit:
Planned first checkpoint:
```

如果已有其他窗口認領同一工作，不得另開平行實作。

---

## 4. Branch 與 Worktree

- 每個 Issue 使用獨立 branch。
- 建議格式：`work/<issue-number>-<slug>` 或 `agent/<issue-number>-<slug>`。
- 三個窗口不得使用同一 branch。
- 原則上不得直接推送 `main`。
- 可以使用 Git worktree 讓不同窗口同時在同一 Repository 的不同資料夾工作。
- branch 必須定期同步 `main`，但不得以 force push 覆蓋其他人的已知工作。

---

## 5. 檔案所有權

平行工作必須先定義檔案所有權。

- 執行者只修改自己擁有的檔案。
- 需要跨工作軌修改時，在 Issue 留下 `CROSS-STREAM REQUEST`。
- 共用根設定、lockfile、Design Tokens、Domain Contracts 等只能有一個明確 owner。
- 不得為避開協調而複製第二套型別、第二套 UI 元件、第二套設定或第二個 lockfile。

M1 的具體所有權以 `docs/M1-THREE-WINDOW-PLAN.md` 為準。

---

## 6. Gate 與依賴

跨工作軌依賴使用具名 Gate，不靠聊天通知。

Gate comment 必須包含：

- Gate 名稱
- Commit SHA
- 可使用的輸出或 contract
- 已執行的 checks
- 已知限制

等待 Gate 的窗口將狀態設為 `BLOCKED_DEPENDENCY`，但仍可繼續不依賴該 Gate 的範圍。

M1 Gate：

- `BOOTSTRAP_READY`
- `DOMAIN_CONTRACT_READY`
- `UI_INTEGRATION_READY`
- `FINAL_VALIDATION`

---

## 7. Checkpoint 與進度日誌

每個工作軌必須有自己的 Durable Log。

Checkpoint 至少記錄：

- Status
- Branch
- Base / Last synced main SHA
- Last good commit SHA
- Completed
- In progress
- Exact next action
- Resume commands
- Checks passed / failing / not run
- Blockers
- Uncommitted changes
- PR

使用量將盡、視窗中斷或換人接手時，必須依 `docs/CONTINUITY-PROTOCOL.md` Commit、Push、更新日誌與 Issue。

---

## 8. Pull Request 規則

預設建立 Draft PR。

PR 至少包含：

- 關聯 Issue
- What changed
- Why
- User / developer impact
- Files or modules owned
- Validation commands and results
- Screenshots or equivalent UI evidence（有 UI 時）
- Known limitations
- Cross-stream dependencies
- Owner decisions not implemented
- Resume or follow-up information

PR 未通過驗收條件前不得宣稱 Issue 完成。

---

## 9. Merge 與整合

- 優先使用小而明確的 PR。
- 依工作計畫的 merge order 整合。
- Integrator 解決衝突時不得擅自改變已核准 Domain Contract 或 Frozen Core。
- 若 contract 必須變更，先建立 Issue / ADR，通知受影響工作軌，再修改。
- 合併後更新 Task Log 與相關工作日誌。

---

## 10. Owner Decision

遇到以下情況需 Owner 決策：

- 影響顧客權益
- 影響店家責任
- 付款、訂金、退款
- 會員、儲值、點數
- 正式服務與價格
- 個資保存與員工權限
- 正式供應商選擇
- Frozen Core 變更

處理方式：

1. 在 Issue 留下 `OWNER DECISION REQUIRED`
2. 說明選項、影響與最保守預設
3. 將受影響部分 disabled / Mock / TODO
4. 繼續其他不受影響的工作
5. Owner 決策後寫入 `docs/DECISIONS.md`

---

## 11. 安全與資料

- 不提交 API Key、Token、密碼、憑證與真實客戶資料。
- `.env.example` 只能包含變數名稱與假值說明。
- 測試與截圖使用明顯虛構資料。
- 發現秘密或真實資料時立即停止 Push，先清理與記錄。
- 外部整合失敗不得造成預約無聲遺失。

---

## 12. 完成與交接

單一工作軌完成條件：

- 驗收條件完成
- Checks 通過或限制已明確揭露
- 工作已 Commit / Push
- 日誌更新
- Draft PR 已建立
- 可由全新窗口只依 Git 重現與接手

整個里程碑只有在 Integration Gate 通過後才完成。