# M1-A 工作日誌 — Platform & Public Experience

Status: PAUSED_LOCAL
Issue: #4  
Expected branch: `work/4-platform-public`  
Owner window: Window A  
Primary gate: `BOOTSTRAP_READY`

---

## 1. 任務目標

建立可在本機重現的 Next.js 專案骨架、深色設計系統、共用 UI 元件與公開網站頁面，提供另外兩個工作軌可依賴的穩定平台。

本工作軌不實作 Booking Domain、不建立正式預約邏輯，也不建立 Staff 功能。

---

## 2. 必做清單

### A1 — Local scaffold

- [x] 初始化單一 Next.js App Router 專案
- [x] 使用 TypeScript strict mode
- [x] 使用 `src/` 目錄
- [x] 設定 `@/*` alias
- [x] 設定 Tailwind CSS
- [x] 選定一個 package manager 並提交唯一 lockfile
- [x] 建立 `.gitignore`
- [x] 建立 `.env.example`，不得含真實值
- [x] 確認本機環境可安裝與啟動

### A2 — Design system

- [x] 在集中位置定義色彩、字型、間距、圓角、陰影與動畫 tokens
- [x] 固定深色主題
- [x] 建立共用 button、card、badge、section、container、empty-state 等基礎元件
- [x] 確保手機單手操作與可讀性
- [x] 避免霓虹、廉價金色、過度圓角與美容院模板感

### A3 — Global shell

- [x] Root layout
- [x] Header / mobile navigation
- [x] Footer
- [x] 手機固定預約入口
- [x] 基本 metadata / SEO skeleton
- [x] Loading / not-found / error 的基礎方向

### A4 — Public pages

建立可導覽的 Mock 頁面：

- [x] Home
- [x] Services
- [x] Barbers
- [x] Works
- [x] Membership placeholder
- [x] About
- [x] Contact
- [x] Policies placeholder

公開頁面使用虛構內容或明顯 placeholder，不得發布未核准價格、政策、設計師名單或客戶評價。

### A5 — Documentation and checks

- [x] README 加入安裝、開發、typecheck、lint、test、build 指令
- [x] 記錄 package manager 與 Node 版本要求
- [x] 執行可用的 typecheck、lint、test、build
- [x] 提供 production build routes 與本機 HTTP smoke check 作為等效證據
- [ ] 建立 Draft PR 並連結 Issue #4

---

## 3. 檔案所有權

本工作軌可直接修改：

- 根設定檔與唯一 lockfile
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
- README 的本機啟動與基礎指令
- 本檔案

不得修改：

- `src/domain/**`
- `src/adapters/**`
- `src/data/mock/**`
- `src/features/booking/**`
- `src/features/staff/**`
- `src/app/booking/**`
- `src/app/staff/**`

若需要跨範圍變更，在 Issue #4 留下 `CROSS-STREAM REQUEST`。

---

## 4. BOOTSTRAP_READY Gate

完成最低可用 scaffold 後，不需要等所有公開頁面完成，立即建立 checkpoint 並在 Issue #4 留言：

```text
BOOTSTRAP_READY: <commit SHA>
Package manager: <name>
Install: <command>
Dev: <command>
Checks: <results>
```

這個 Gate 讓 Window B / C 可以同步根架構。

---

## 5. 驗收條件

- 專案可依 README 在乾淨本機環境啟動
- 只有一個 lockfile
- 所有公開頁面可透過導覽到達
- 深色品牌方向成立且手機版可用
- 不包含正式預約、付款、會員或日曆整合
- 不包含真實個資或秘密
- 通過可用的 TypeScript、Lint 與 Production Build
- Draft PR 清楚列出限制與 Gate commit

---

## 6. Durable Checkpoint

Base / Last synced main SHA: `8408ec2a68d7e5de9b9e6f60167dd76e0fd7387e`
Last good commit SHA: `20004c615876c3beb7110bec2e0a97764c21735a`
Last checkpoint time (Asia/Taipei): `2026-07-12 22:24:50 +08:00`
Completed: Scaffold, single lockfile, centralized dark tokens, shared UI/layout, all eight public routes, README setup, production build and local HTTP smoke check.
In progress: BOOTSTRAP_READY Gate publication and Draft PR remain after the requested pause.
Exact next action: Resume the branch, rerun `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, then complete the Issue #4 Draft PR.
Exact resume commands: `git fetch origin`; `git switch work/4-platform-public`; `git pull --ff-only`; `pnpm install`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm build`.
Files currently touched: Window A-owned root configuration, public app routes, shared UI/layout components, README, and this log.
Checks passed: `pnpm install --offline`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm build`; HTTP 200 with title `DUM BARBERSHOP` and hero content detected.
Checks failing or not run: Responsive browser screenshots not captured; Draft PR not created.
Known blockers: Work paused at Owner request; no technical or Owner-decision blocker.
Owner decision needed: None  
Uncommitted changes: none after checkpoint metadata commit.
PR:  

---

## 7. 進度紀錄

### Checkpoint 0 — READY

- 尚未認領
- 第一個動作：讀 Issue #4、建立 `work/4-platform-public` branch / worktree，更新本檔為 `IN_PROGRESS`。

### Checkpoint 1 — CLAIMED / IN_PROGRESS

- Auto-claim completed from Issue #7; Issue #4 was the lowest-numbered unclaimed workstream.
- Branch: `work/4-platform-public`
- Base: `8408ec2a68d7e5de9b9e6f60167dd76e0fd7387e`
- Next: create and validate the Window A-owned scaffold, then publish `BOOTSTRAP_READY`.

### Checkpoint 2 — PAUSED_LOCAL

- Last good code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Scaffold, dark design system, shared layout/UI and all public routes are implemented.
- Install, typecheck, lint, test, production build and local HTTP smoke checks passed.
- Exact next action: rerun checks after resume, then complete the Issue #4 Draft PR.
- Uncommitted application changes: none.
