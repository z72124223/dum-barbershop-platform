# M1-B 工作日誌 — Domain & Mock Engine

Status: PAUSED_LOCAL
Issue: #5  
Expected branch: `work/5-domain-engine`  
Owner window: Window B  
Primary gate: `DOMAIN_CONTRACT_READY`

---

## 1. 任務目標

建立多人工作室的核心資料模型、Mock 預約引擎、可預約時段計算、預約狀態轉換、Mock repositories 與外部服務 Adapter ports。

本工作軌負責「引擎與 contract」，不負責公開網站視覺、不負責 Booking / Staff 頁面。

---

## 2. 必做清單

### B1 — Domain models

建立並 export 明確型別：

- [ ] Branch
- [ ] Staff / Barber
- [ ] Service
- [ ] StaffService capability
- [ ] StaffSchedule
- [ ] TimeBlock / CalendarBlock
- [ ] Customer
- [ ] Booking
- [ ] BookingStatus
- [ ] DepositStatus
- [ ] Membership placeholder
- [ ] AuditEvent
- [ ] TimeSlot / Availability result

模型必須從第一天支援多位設計師，不得把單一設計師寫死。

### B2 — Booking engine

- [ ] 驗證服務與設計師關聯
- [ ] 計算服務開始與結束時間
- [ ] 套用服務前後緩衝欄位
- [ ] 套用設計師排班
- [ ] 排除休假與封鎖時段
- [ ] 排除既有預約
- [ ] 防止同一設計師時間重疊
- [ ] 產生指定日期的可預約時段
- [ ] 使用 `Asia/Taipei` 顯示假資料，同時維持標準時間表示
- [ ] 對非法輸入回傳明確錯誤，不靜默失敗

### B3 — Booking status machine

允許的狀態至少包含：

- `pending`
- `confirmed`
- `checked_in`
- `in_service`
- `completed`
- `cancelled_by_customer`
- `cancelled_by_shop`
- `no_show`
- `rescheduled`
- `waitlisted`

- [ ] 集中定義合法狀態轉換
- [ ] 拒絕非法跳轉
- [ ] 狀態轉換可產生 AuditEvent
- [ ] UI 不需要自己判斷字串規則

### B4 — Adapter ports

建立供未來替換的介面：

- [ ] BookingProvider / BookingRepository port
- [ ] CalendarProvider port
- [ ] NotificationProvider port
- [ ] Payment / DepositProvider port placeholder
- [ ] MembershipProvider port placeholder
- [ ] CustomerRepository port
- [ ] AuditRepository port

不得接真實第三方 SDK。

### B5 — Mock implementations and data

- [ ] 一間假分店
- [ ] 至少三位假設計師
- [ ] 4–6 個假服務
- [ ] 假排班與封鎖時段
- [ ] 假客戶與歷史
- [ ] 假預約
- [ ] In-memory mock repositories / adapters
- [ ] 所有姓名、電話、內容均為明顯虛構資料

### B6 — Tests and documentation

- [ ] 可預約時段正常案例
- [ ] 已有預約衝突
- [ ] 封鎖時段
- [ ] 非工作時間
- [ ] 服務時長跨越空檔
- [ ] 多設計師彼此不互相封鎖
- [ ] 合法與非法狀態轉換
- [ ] 訂金狀態與預約狀態保持分離
- [ ] 建立 Draft PR 並連結 Issue #5

---

## 3. 固定輸出路徑

本工作軌擁有：

- `src/domain/**`
- `src/adapters/ports/**`
- `src/adapters/mock/**`
- `src/data/mock/**`
- Domain / engine tests
- 本檔案

主要 barrel export 應由：

- `src/domain/index.ts`

提供 Window C 使用。

不得修改：

- 根設定與 lockfile
- 公開網站頁面
- `src/app/booking/**`
- `src/app/staff/**`
- `src/components/booking/**`
- `src/components/staff/**`
- `src/features/booking/**`
- `src/features/staff/**`

如果測試工具或 script 尚未由 Window A 建立，先完成純 TypeScript contract 與測試檔，並在 Issue #5 留下 `CROSS-STREAM REQUEST`，不要建立第二套 package manager 或根設定。

---

## 4. DOMAIN_CONTRACT_READY Gate

當 models、exports、availability API、status transition API 與 adapter ports 穩定後，建立 checkpoint 並在 Issue #5 留言：

```text
DOMAIN_CONTRACT_READY: <commit SHA>
Exports: <entry points>
Availability API: <signature summary>
Status API: <signature summary>
Mock adapter entry: <path>
Checks: <results>
```

Gate 後若要做破壞性 contract 變更，必須先在 Issue #5 說明，並通知 Window C。

---

## 5. 驗收條件

- 模型支援一店多設計師
- Availability 不是 UI 內的硬編碼假時段
- 同一設計師不可重疊預約
- 不同設計師同時段可以各自有預約
- Booking 與 Deposit status 分離
- 狀態機拒絕非法轉換
- Adapter ports 不綁正式供應商
- Mock engine 可被 UI 呼叫
- 測試覆蓋核心衝突與狀態案例
- 無秘密與真實個資
- Draft PR 列出 contract 與限制

---

## 6. Durable Checkpoint

Base / Last synced main SHA: `8408ec2a68d7e5de9b9e6f60167dd76e0fd7387e`
Last good commit SHA: `8408ec2a68d7e5de9b9e6f60167dd76e0fd7387e` (validated code baseline; the following checkpoint commit contains log metadata only)
Last checkpoint time (Asia/Taipei): `2026-07-12 22:20 +08:00`
Completed: Required reading; Issue #7 auto-claim; Issue #5 CLAIMED comment; dedicated branch/worktree creation; remote `main` base verification.
In progress: None; the Owner requested this window stop before Domain implementation began.
Exact next action: Implement the shared domain model exports under `src/domain/models/` without changing root scaffold files.
Exact resume commands: `git fetch --all --prune`; `git -C .worktrees/work-5-domain-engine switch work/5-domain-engine`; `git -C .worktrees/work-5-domain-engine pull --ff-only`; verify `git -C .worktrees/work-5-domain-engine status --short --branch`.
Files currently touched: `docs/workstreams/M1-B.md` only (checkpoint metadata)
Checks passed: Required reading, Issue #5 claim verification, branch/base verification.
Checks failing or not run: Typecheck, tests, lint, and build not run; Window A has not published `BOOTSTRAP_READY`.
Known blockers: Full project checks depend on Window A `BOOTSTRAP_READY`; pure TypeScript implementation can continue.
Owner decision needed: None  
Uncommitted changes: none after this checkpoint commit
PR:  

---

## 7. 進度紀錄

### Checkpoint 0 — READY

- 尚未認領
- 第一個動作：讀 Issue #5、建立 `work/5-domain-engine` branch / worktree，更新本檔為 `IN_PROGRESS`。
- 可先依固定路徑建立純 TypeScript domain；看到 Window A 的 `BOOTSTRAP_READY` 後同步根架構並跑完整 checks。

### Checkpoint 1 — CLAIMED / IN_PROGRESS

- Auto-claim selected Issue #5 after confirming Issue #4 was claimed and M1-B remained `READY`.
- Branch: `work/5-domain-engine`
- Base: `8408ec2a68d7e5de9b9e6f60167dd76e0fd7387e`
- Next: implement the provider-neutral domain contracts and booking engine inside Window B-owned paths.

### Checkpoint 2 — PAUSED_LOCAL

- Owner requested the Codex window stop before implementation began.
- No application or Domain source files were created or modified.
- Resume the same Issue, branch, worktree, and journal; do not create a parallel implementation.
- Exact next action: create the shared model exports under `src/domain/models/`.
