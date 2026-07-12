# M1-C 工作日誌 — Booking, Staff & Integration

Status: READY  
Issue: #6  
Expected branch: `work/6-booking-staff`  
Owner window: Window C  
Primary gate: `UI_INTEGRATION_READY`  
Final gate responsibility: Issue #8

---

## 1. 任務目標

建立客人可操作的多步驟 Mock 預約流程與手機優先 Staff Prototype，使用 Window B 提供的 Domain / Mock adapters，並在 A、B 完成後執行 M1 最終整合與驗證。

本工作軌不另建 Domain 型別、不另建公開網站設計系統、不接正式外部服務。

---

## 2. 必做清單

### C1 — Customer booking flow

建立完整多步驟流程：

- [ ] 選擇服務
- [ ] 選擇設計師
- [ ] 選擇日期
- [ ] 從 Booking Domain 取得可預約時段
- [ ] 選擇時段
- [ ] 填寫虛構客戶資料
- [ ] 填寫需求與備註
- [ ] 可選訂金 UI placeholder
- [ ] 確認摘要
- [ ] Mock 建立預約
- [ ] 成功頁明確顯示「未建立真實預約」

需要處理：

- [ ] Loading state
- [ ] Empty availability
- [ ] Validation error
- [ ] Adapter error
- [ ] 回上一步時保留合理狀態
- [ ] 手機單手操作

### C2 — Staff Prototype

- [ ] 今日行程
- [ ] 全日行程
- [ ] 下一位客人
- [ ] 設計師篩選
- [ ] 預約詳情
- [ ] 客戶搜尋
- [ ] 客戶基本歷史顯示
- [ ] 封鎖時段 Mock action
- [ ] 標記到店
- [ ] 標記進行中
- [ ] 標記完成
- [ ] 等候名單 / 未確認預約 placeholder

所有 action 只能更新 Mock / in-memory state，不得呼叫真實 API。

### C3 — Domain integration

- [ ] 從 `src/domain/index.ts` 引用正式 contract
- [ ] 使用 Window B 的 mock adapters / repositories
- [ ] 不在 UI 重新定義 BookingStatus 或 DepositStatus
- [ ] 不在頁面硬編可預約時段
- [ ] 使用 domain status transition function
- [ ] 將錯誤轉成清楚 UI 狀態

### C4 — Cross-page integration

- [ ] 公開網站可進入 Booking
- [ ] Booking 可返回服務 / 設計師頁
- [ ] Staff 入口不干擾公開導覽
- [ ] 共用 Window A 的 UI 元件與 tokens
- [ ] 不另建第二套 Header、Button、Card 或 Theme

### C5 — Final M1 validation

A、B PR 合併後：

- [ ] 同步最新 `main`
- [ ] 解決 C branch 的整合問題
- [ ] 執行完整 typecheck
- [ ] 執行 lint
- [ ] 執行 tests
- [ ] 執行 production build
- [ ] 執行手機尺寸 smoke test
- [ ] 確認沒有真實資料或秘密
- [ ] 更新 README 最終驗證指令 / 結果
- [ ] 更新 `docs/TASK-LOG.md`
- [ ] 執行 Issue #8 Integration Gate

---

## 3. 檔案所有權

本工作軌可直接修改：

- `src/app/booking/**`
- `src/app/staff/**`
- `src/components/booking/**`
- `src/components/staff/**`
- `src/features/booking/**`
- `src/features/staff/**`
- Booking / Staff UI tests
- 本檔案

整合 Gate 時可更新：

- README 的最終驗證段落
- `docs/TASK-LOG.md`
- 必要的 import / navigation wiring

不得自行修改：

- 根設定與 lockfile
- Design tokens / 共用 UI 的核心行為
- `src/domain/**`
- `src/adapters/**`
- `src/data/mock/**`

如需修改 contract，先在 Issue #6 留下 `CROSS-STREAM REQUEST`，並由 Window B 處理；不得在 C branch 複製一套型別繞過問題。

---

## 4. 依賴處理

### 尚未有 BOOTSTRAP_READY 時

可以：

- 規劃 feature component 邊界
- 撰寫純元件與 state model
- 建立自己的日誌與測試情境

不得：

- 建立第二套 Next.js scaffold
- 建立第二個 lockfile
- 自行改根設定

### 尚未有 DOMAIN_CONTRACT_READY 時

可以依 `docs/M1-THREE-WINDOW-PLAN.md` 的預定路徑建立 UI 結構，但 contract integration 必須等 Window B Gate。不得為了先編譯而永久建立重複 domain types。

---

## 5. UI_INTEGRATION_READY Gate

完成 Booking / Staff 與 Domain 整合後，在 Issue #6 留言：

```text
UI_INTEGRATION_READY: <commit SHA>
Booking flow: <status>
Staff prototype: <status>
Domain integration: <paths>
Checks: <results>
Known limitations: <list>
```

---

## 6. 驗收條件

- Mock 預約流程可從服務走到成功頁
- 可以指定設計師
- 可預約時段來自 Booking Domain
- Staff 可查看整日行程、下一位客人與預約詳情
- Staff Mock action 可更新狀態
- 手機版可操作
- Loading、Empty、Error 狀態存在
- 成功頁不誤導為真實預約
- 未接正式預約、Calendar、通知、付款或會員
- 完整 checks 在整合後通過
- Draft PR 連結 Issue #6，最終 Gate 連結 Issue #8

---

## 7. Durable Checkpoint

Base / Last synced main SHA:  
Last good commit SHA:  
Last checkpoint time (Asia/Taipei):  
Completed:  
In progress:  
Exact next action:  
Exact resume commands:  
Files currently touched:  
Checks passed:  
Checks failing or not run:  
Known blockers:  
Owner decision needed: None  
Uncommitted changes:  
PR:  

---

## 8. 進度紀錄

### Checkpoint 0 — READY

- 尚未認領
- 第一個動作：讀 Issue #6、建立 `work/6-booking-staff` branch / worktree，更新本檔為 `IN_PROGRESS`。
- 追蹤 Issue #4 的 `BOOTSTRAP_READY` 與 Issue #5 的 `DOMAIN_CONTRACT_READY`。