# M1 三工作窗口執行計畫

版本：1.0  
狀態：Active  
父任務：Issue #2  
協調任務：Issue #7

本文件把 M1 拆成三個可由三個獨立 Codex / Work 窗口執行的工作軌。每個窗口只需要讀取 Git，不依賴任何聊天記憶。

---

## 1. 最高原則

1. GitHub Repository 是唯一最高標準。
2. 三個窗口必須先讀 `AGENTS.md` 指定的文件，再讀本文件與自己的 Issue。
3. 每個窗口使用獨立 branch / worktree，不得共用分支。
4. 每個窗口只修改自己擁有的目錄與檔案。
5. 所有進度、停點、阻塞與下一步都必須寫回 Git 或 Issue。
6. 使用量不足、視窗中斷或換人接手時，不得依靠聊天紀錄恢復。
7. 未經 Owner 決定，不得實作 `Reserved` 或 `Needs Owner Decision` 的營運規則。

---

## 2. 三等份工作分配

### Window A — Platform & Public Experience

- Issue：#4
- 建議 branch：`work/4-platform-public`
- 工作量：約 M1 的三分之一
- 核心責任：專案骨架、設計系統、共用 UI、公開網站頁面
- 自己的日誌：`docs/workstreams/M1-A.md`

### Window B — Domain & Mock Engine

- Issue：#5
- 建議 branch：`work/5-domain-engine`
- 工作量：約 M1 的三分之一
- 核心責任：多人工作室資料模型、Mock 預約引擎、狀態機、Adapter 介面、測試
- 自己的日誌：`docs/workstreams/M1-B.md`

### Window C — Booking, Staff & Integration

- Issue：#6
- 建議 branch：`work/6-booking-staff`
- 工作量：約 M1 的三分之一
- 核心責任：客人預約流程、Staff 工作介面、前端狀態、整合與最終驗證
- 自己的日誌：`docs/workstreams/M1-C.md`
- 最終整合 Gate：Issue #8

三個窗口的責任都屬必要交付，沒有主次之分。

---

## 3. 固定技術與目錄契約

M1 採單一 Next.js 應用程式與模組化單體架構。

### 固定方向

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- `src/` 目錄
- `@/*` 對應 `src/*`
- 手機優先
- 固定深色主題
- Mock Data，不接正式外部服務
- 時區顯示以 `Asia/Taipei` 為預設

實際穩定版本與單一 package manager 由 Window A 在本機驗證後寫入 lockfile。lockfile 一旦進入 `main`，其他窗口必須使用相同工具，不得再建立第二種 lockfile。

### 目錄契約

```text
src/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ globals.css
│  ├─ services/
│  ├─ barbers/
│  ├─ works/
│  ├─ booking/
│  ├─ staff/
│  ├─ membership/
│  ├─ about/
│  ├─ contact/
│  └─ policies/
├─ components/
│  ├─ ui/
│  ├─ layout/
│  ├─ public/
│  ├─ booking/
│  └─ staff/
├─ domain/
│  ├─ models/
│  ├─ booking/
│  └─ index.ts
├─ adapters/
│  ├─ ports/
│  └─ mock/
├─ data/
│  └─ mock/
├─ features/
│  ├─ booking/
│  └─ staff/
└─ lib/
   └─ shared/
```

不得在未協調的情況下更改上述頂層邊界。

---

## 4. 檔案所有權

### Window A 擁有

- `package.json`
- 唯一 lockfile
- TypeScript / Next / Tailwind / ESLint / PostCSS 根設定
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/services/**`
- `src/app/barbers/**`
- `src/app/works/**`
- `src/app/membership/**`
- `src/app/about/**`
- `src/app/contact/**`
- `src/app/policies/**`
- `src/components/ui/**`
- `src/components/layout/**`
- `src/components/public/**`
- `public/**`
- 本機啟動方式與基礎 README 指令
- `docs/workstreams/M1-A.md`

### Window B 擁有

- `src/domain/**`
- `src/adapters/ports/**`
- `src/adapters/mock/**`
- `src/data/mock/**`
- Booking Domain 單元測試
- Mock repository / provider 實作
- `docs/workstreams/M1-B.md`

### Window C 擁有

- `src/app/booking/**`
- `src/app/staff/**`
- `src/components/booking/**`
- `src/components/staff/**`
- `src/features/booking/**`
- `src/features/staff/**`
- Booking / Staff UI 測試或整合測試
- M1 最終整合與驗證文件
- `docs/workstreams/M1-C.md`

### 共同但受控的檔案

下列檔案不得三個窗口同時修改：

- `README.md`：Window A 先寫；最終整合時 Window C 補驗證結果
- `docs/TASK-LOG.md`：平時不頻繁修改；Window C / Integrator 在 Gate 更新
- `docs/DECISIONS.md`：只有新增正式技術決策時修改
- 根設定與 lockfile：只有 Window A 修改

需要修改別人的檔案時，先在自己 Issue 留下 `CROSS-STREAM REQUEST`，由檔案擁有者處理，或等整合階段統一修改。

---

## 5. 工作依賴與同步 Gate

### Gate A0 — BOOTSTRAP_READY

由 Window A 完成：

- 專案可安裝
- 開發伺服器可啟動
- TypeScript / Tailwind / alias 生效
- 根 layout 與基本頁面可顯示
- 單一 lockfile 已提交

Window A 在 Issue #4 留下：

`BOOTSTRAP_READY: <commit SHA>`

Window B 與 C 看到後，必須 rebase / merge 最新 `main` 或指定 commit，再執行完整 Build。

### Gate B0 — DOMAIN_CONTRACT_READY

由 Window B 完成：

- 核心 models 與 exports 已提交
- Availability function 介面已確定
- Booking status transition 介面已確定
- Mock data shape 已確定
- Adapter port 介面已確定

Window B 在 Issue #5 留下：

`DOMAIN_CONTRACT_READY: <commit SHA>`

Window C 以該 contract 完成 UI 整合，不得另建一套重複型別。

### Gate C0 — UI_INTEGRATION_READY

由 Window C 完成：

- 預約流程可走完
- Staff Prototype 可操作 Mock state
- 已使用 Window B 的 domain / mock adapters
- 公開頁面導覽可進入 booking / staff

Window C 在 Issue #6 留下：

`UI_INTEGRATION_READY: <commit SHA>`

### Gate M1 — FINAL_VALIDATION

由 Issue #8 執行：

1. 合併或 rebase 最新 A、B、C 成果
2. 解決整合衝突，不改變 Frozen Core
3. 執行安裝、typecheck、lint、tests、production build
4. 檢查手機版核心流程
5. 檢查沒有秘密與真實客戶資料
6. 更新 README 與 TASK-LOG
7. 建立或更新最終 Draft PR

---

## 6. Merge 建議順序

1. Window A 的 bootstrap / public PR
2. Window B 的 domain / engine PR
3. Window C rebase 最新 `main` 後完成 booking / staff PR
4. Issue #8 執行最終整合與 M1 驗收

若 A 與 B 無檔案衝突，可依 PR 準備程度調整前兩者順序；C 必須在最終完成前同步兩者。

---

## 7. 每個窗口開始時必做

1. 讀 `AGENTS.md`
2. 按順序讀所有必讀文件
3. 讀 `docs/M1-THREE-WINDOW-PLAN.md`
4. 讀 `docs/CONTINUITY-PROTOCOL.md`
5. 讀自己的 Issue 與工作日誌
6. 在 Issue 留下 `CLAIMED` 訊息
7. 建立指定 branch / worktree
8. 將自己的日誌改為 `IN_PROGRESS`
9. 寫下 base commit、目前計畫與第一個下一步
10. 才開始改程式

---

## 8. 窗口不得做的事

- 不得實作另外兩個窗口的主要範圍
- 不得直接推送 `main`
- 不得把對話當成正式規格
- 不得另建不同框架、不同 package manager 或第二套 domain types
- 不得自行選擇正式預約、付款、通知或會員供應商
- 不得加入真實客戶資料
- 不得因使用量將盡而只留下未提交的本機改動
- 不得宣稱完成但沒有更新工作日誌與 Issue

---

## 9. 完成標準

單一工作軌只有在以下條件成立才算完成：

- Issue 內所有驗收條件完成
- 工作日誌為 `PR_OPEN` 或 `DONE`
- 所有修改已 Commit 並 Push
- Draft PR 已建立並連結 Issue
- PR 說明檢查結果、限制與下一步
- 沒有修改不屬於自己的核心檔案，或已清楚揭露並取得協調
- 可由另一個全新窗口只讀 Git 後接手

M1 只有在 Issue #8 通過時才算整體完成。