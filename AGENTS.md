# AGENTS.md — DUM BARBERSHOP Platform

本檔案適用於 Owner、GPT、Codex、人類開發者與其他 Agent。

## 1. 唯一最高標準

GitHub Repository `z72124223/dum-barbershop-platform` 是本專案的 **Single Source of Truth**。

開始任何工作前，必須依序讀取：

1. `docs/PROJECT-CONSTITUTION.md`
2. `docs/DECISIONS.md`
3. `docs/BLUEPRINT.md`
4. `docs/ARCHITECTURE.md`
5. `docs/ROADMAP.md`
6. `docs/TWO-ROLE-WORK-MODEL.md`
7. `docs/EXECUTION-MODE.md`
8. `docs/WORK-PROTOCOL.md`
9. `docs/CONTINUITY-PROTOCOL.md`
10. `docs/TASK-LOG.md`
11. 與角色相關的 Issue
12. 角色工作日誌：`docs/workstreams/GPT.md` 或 `docs/workstreams/CODEX.md`

聊天、口頭描述、暫存筆記或未提交本機內容，若未寫入 Git，不構成正式規格。

## 2. 兩個正式工作角色

### GPT — Issue #13

GPT 負責：

- 規格、藍圖、決策、Roadmap 與 Architecture 維護
- 將 Owner 想法整理成 GitHub Issues 與驗收條件
- 品牌內容、頁面文案、資料需求與 QA checklist
- 檢查 Reserved / Needs Owner Decision
- 審查 Codex PR、建立缺陷與後續任務
- 維護 `docs/workstreams/GPT.md` 與里程碑級 `docs/TASK-LOG.md`

GPT 原則上不得直接修改 `src/**` 正式程式碼、lockfile、Build 或測試設定。需要改程式時，以 Issue 或 PR Review 交由 Codex。

### Codex — Issue #14

Codex 負責：

- 所有本機程式碼、網站、預約引擎與 Staff UI
- Domain、Mock Data、Adapter ports、測試與整合
- 安裝依賴、終端機、Typecheck、Lint、Tests、Build 與除錯
- `.env.example`、本機啟動方式與程式相關 README
- 維護 `docs/workstreams/CODEX.md`
- 建立 Draft PR 並處理 GPT Review

M1 不再拆成三個平行 Codex 工作軌。Codex 負責原 A、B、C 的完整程式範圍。

## 3. Task 與模式

- Work / Codex 是同一 Task 內的模式切換，不會自動建立第二個工作者。
- 專案邏輯上只需要兩份工作：GPT 工作與 Codex 工作。
- GPT 與 Codex 透過 Git 文件、Issues、Commit、PR 與 Review 交接，不依賴跨視窗記憶。
- GPT / 產品 Review 是非同步品質輸入，不是 Owner 人工核准關卡；不得只因 Review 尚未開始就停止其他安全施工。
- Codex 完成一個 Issue 並通過必要 checks 後，必須建立或更新 PR、處理已存在的 Required fixes，並繼續下一個已有 Git 依據的藍圖工作。

## 4. 不得擅自越權

下列事項沒有 Owner 明確決策與 Git 紀錄時，不得自行定案：

- 訂金金額與退款規則
- 取消、遲到、爽約與插單政策
- 會員、儲值、點數及優惠權益
- 正式付款與正式預約供應商
- 個資保存期限與員工可見範圍
- 正式服務價格、時間與設計師名單
- 分店、權限與任何影響顧客權益的自動決策

不確定時標記 `TODO(owner-decision)`，只停止受影響部分，繼續其他可執行工作。

## 5. Git 工作方式

- 每個工作必須有 GitHub Issue。
- 原則上不得直接推送 `main`。
- Codex 使用獨立 feature branch；M1 預設為 `codex/14-m1-platform`。
- 變更透過 Draft Pull Request 合併。
- PR 必須說明變更、影響、驗證、限制與未解決事項。
- GPT 以 Review comments 或缺陷 Issues 要求程式修改，不直接建立平行程式版本。
- 沒有 Issue 的功能不得自行實作。
- 若 Blueprint / Roadmap 已有明確依據但尚無下一個 Issue，Codex 可建立範圍受限的執行 Issue，再使用新的 feature branch 施工。
- 非正式上線、非真實資料、非外部不可逆操作的 PR，在必要 checks 通過且沒有未解決 Required fix 時，不需要 Owner 人工審核即可合併。

## 6. 使用量不足與續接

GPT 與 Codex 都必須遵守 `docs/CONTINUITY-PROTOCOL.md`：

- 將可提交進度 Commit 並 Push。
- 更新自己的 durable work log。
- 在自己的 Issue 留下 `CHECKPOINT`。
- 記錄 Last good commit SHA、Exact next action、恢復步驟與 checks。
- 新 Task 沿用同一個 Issue、branch、PR 與日誌，不另開平行實作。
- Checkpoint 是恢復機制，不是終止整體藍圖施工的理由；恢復後必須從 Exact next action 繼續。

## 7. 本機引擎與安全

- 實際網站、預約核心、整合與測試由 Codex 在本機環境實作。
- GitHub 管理規格、任務、版本、Review 與歷史。
- API Key、密碼、Token、付款金鑰與真實客戶資料不得進 Git。
- 必要環境變數只在 `.env.example` 記錄名稱與說明，不含真實值。
- 專案必須能依 README 在乾淨本機環境啟動。

## 8. 架構邊界

第一階段至少維持：

- Website / Customer UI
- Staff App / Staff UI
- Booking Domain
- Customer & Membership Domain
- Calendar Integration
- Notification Integration
- Payment / Deposit Integration

第三方服務一律透過 Adapter 介面接入，不得散落在 UI 或 Domain。

## 9. 完成定義

任務只有在以下條件成立時才算完成：

- 符合 Issue 驗收條件
- 不違反專案憲法與已確認決策
- 相關 Typecheck、Lint、Tests 與 Build 通過
- 文件與工作日誌同步更新
- 所有可恢復工作已 Commit 並 Push
- 無秘密或真實客戶資料進 Git
- PR 清楚揭露限制與後續工作
- 新 Task 能只讀 Git 後繼續

## 10. 暫停或完成回報

至少記錄：

1. 角色與 Issue
2. Branch
3. Last good commit SHA
4. 修改內容
5. 已完成項目
6. Checks
7. 阻塞或 Owner 決策
8. Exact next action
9. PR 或 Commit
10. Uncommitted changes 是否為 none

## 11. 持續施工至 Blueprint Build-Complete

- Codex 必須持續實作已接受 Blueprint 中所有技術上可完成的範圍，不得停在 Owner 人工審核等待點。
- 人工 Review、帳號註冊、憑證、第三方服務或 Owner 決策，只能阻塞直接受影響的整合或政策；其他工作繼續。
- 未決項目使用 Mock、disabled adapter 或 `TODO(owner-decision)` 建立可預覽結構，不得擅自填入正式商業規則。
- `Build-complete` 代表藍圖中的可實作介面、Domain、流程、Adapter、錯誤狀態、測試與文件完成；不代表正式供應商、真實資料或 Production 已啟用。
- Production 上線、真實付款、真實通知、真實客戶資料與不可逆外部操作仍必須具備對應決策、憑證與安全驗證。
