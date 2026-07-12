# DUM BARBERSHOP Platform — Two-Role Work Model

版本：1.0  
狀態：Accepted  
適用：M1 起的所有工作

## 1. 核心結論

本專案只維持兩個正式工作角色：

1. **GPT 工作**：規格、內容、Git 任務、驗收與 Review。
2. **Codex 工作**：全部本機程式碼、引擎、測試、Build 與整合。

`Work` 與 `Codex` 在同一個 Task 中切換，不會自動變成兩個工作者。Owner 應建立兩個獨立 Task，或以兩個明確工作流程分別執行 Issue #13 與 Issue #14。

GitHub Repository 是兩者唯一交接面。

---

## 2. GPT 工作 — Issue #13

### 主要責任

- 維護 Blueprint、Decisions、Roadmap、Architecture 與工作規格。
- 將 Owner 的想法寫成 Git 文件、Issue、驗收條件與優先順序。
- 整理品牌內容、頁面文案、服務與設計師資料需求。
- 檢查 Reserved / Needs Owner Decision，不擅自替 Owner 定案。
- 審查 Codex PR 是否符合藍圖、Issue 與 Frozen Core。
- 建立 QA checklist、缺陷 Issue、驗收紀錄與下一階段任務。
- 維護 `docs/workstreams/GPT.md` 與 `docs/TASK-LOG.md`。

### 不負責

- 不在 `src/**` 寫正式應用程式碼。
- 不安裝本機依賴。
- 不自行修改 package manager、lockfile、Build 或測試設定。
- 不取代 Codex 的本機程式驗證。

### 允許的 Git 修改

- `docs/**`
- `AGENTS.md`
- GitHub Issues、PR Review、comments
- README 的產品、流程與驗收說明

若需要變更程式行為，GPT 應更新 Issue 或新增缺陷 Issue，再交由 Codex 實作。

---

## 3. Codex 工作 — Issue #14

### 主要責任

- 建立並維護完整 Next.js / TypeScript / Tailwind 本機專案。
- 實作公開網站、Mock 預約流程、Staff Prototype。
- 實作多設計師 Domain、可預約時段、狀態轉換、Mock repositories 與 Adapter ports。
- 建立測試、執行 Typecheck、Lint、Test、Production Build。
- 處理整合、除錯、效能、可存取性與響應式問題。
- 維護 `.env.example`、本機啟動方式及程式相關 README。
- 維護 `docs/workstreams/CODEX.md`。
- 建立 Draft PR 並回應 GPT Review。

### 不負責

- 不自行決定服務價格、會員、訂金、退款、取消、個資或正式供應商。
- 不新增藍圖以外的商業功能。
- 不將真實客戶資料、Token 或秘密提交 Git。

### 工作範圍

Codex 負責所有程式範圍，包括原三工作軌 A、B、C 的完整內容。從此不再將 M1 程式拆成三個平行 Codex Tasks。

---

## 4. 工作順序

### GPT

1. 讀 `AGENTS.md` 與必讀文件。
2. 執行 Issue #13。
3. 確認 Issue #14 的規格、驗收與待決策項目完整。
4. 持續檢查 Codex checkpoint / Draft PR。
5. 建立 Review findings 或後續 Issues。
6. 驗收完成後更新 Roadmap 與 Task Log。

### Codex

1. 讀 `AGENTS.md` 與必讀文件。
2. 認領 Issue #14。
3. 使用 branch `codex/14-m1-platform` 或該 Issue 核准的新分支。
4. 在本機依照 Issue 順序完成 scaffold、Domain、UI、Staff 與驗證。
5. 定期 Commit、Push、更新 Codex 日誌與 Issue checkpoint。
6. 建立 Draft PR。
7. 根據 GPT Review 修正，直到通過驗收。

---

## 5. 衝突與責任邊界

- GPT 不直接修 Codex 程式；以 Review comment 或 Issue 交辦。
- Codex 不重寫 Frozen Core 或 Owner 決策；有疑問時留言並繼續不受影響部分。
- README 若同時涉及產品規格與本機指令：GPT 負責產品段落，Codex 負責安裝、執行、測試與 Build 段落。
- `docs/TASK-LOG.md` 由 GPT 維護里程碑狀態；Codex 必須提供可核對的 Commit、PR 與 checks。

---

## 6. 使用量不足與換 Task

兩個角色都必須遵守 `docs/CONTINUITY-PROTOCOL.md`：

- Commit / Push 可提交的進度。
- 更新自己的 durable log。
- 在 Issue 留下 `CHECKPOINT`。
- 記錄 Last good commit、Exact next action、恢復步驟與驗證狀態。

新 Task 只需讀 Git，即可沿用同一個 Issue、branch、PR 與工作日誌繼續。

---

## 7. M1 完成條件

M1 完成必須同時符合：

- Issue #14 的完整程式驗收通過。
- Codex Draft PR 經 GPT 對照 Blueprint 與 Issues 完成 Review。
- Typecheck、Lint、Tests、Production Build 通過。
- 公開網站、Mock 預約與 Staff Prototype 可用。
- 多設計師 Domain 規則有測試。
- 無秘密、真實客戶資料或未核准正式整合。
- GPT 更新 Task Log、Roadmap 與驗收紀錄。
- 核准 PR 合併到 `main`。