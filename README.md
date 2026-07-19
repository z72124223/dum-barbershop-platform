# DUM BARBERSHOP Platform

DUM BARBERSHOP website, booking and multi-staff operation platform.

## Repository authority

This private repository is the project's **single source of truth** for product decisions, architecture, implementation, review and release history.

Chat messages and local notes are not authoritative until they are recorded in this repository.

## Required reading

All contributors and AI workers must begin with [`AGENTS.md`](AGENTS.md), then follow its required reading order.

Core documents:

1. [`docs/PROJECT-CONSTITUTION.md`](docs/PROJECT-CONSTITUTION.md)
2. [`docs/DECISIONS.md`](docs/DECISIONS.md)
3. [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/ROADMAP.md`](docs/ROADMAP.md)
6. [`docs/TWO-ROLE-WORK-MODEL.md`](docs/TWO-ROLE-WORK-MODEL.md)
7. [`docs/EXECUTION-MODE.md`](docs/EXECUTION-MODE.md)
8. [`docs/WORK-PROTOCOL.md`](docs/WORK-PROTOCOL.md)
9. [`docs/CONTINUITY-PROTOCOL.md`](docs/CONTINUITY-PROTOCOL.md)
10. [`docs/TASK-LOG.md`](docs/TASK-LOG.md)

Role logs:

- [`docs/workstreams/GPT.md`](docs/workstreams/GPT.md)
- [`docs/workstreams/CODEX.md`](docs/workstreams/CODEX.md)

## Current state

The repository contains a **Blueprint build-complete local preview**. The public website, customer booking lifecycle, multi-staff operations, provider-neutral integration simulator and Apple-style quick-action preview can all be inspected locally with fictional or masked data.

This is not production-ready. Build-complete means every safe Blueprint area has a working local preview; it does not mean that real content, policies, accounts, credentials or providers have been approved.

- Implementation Issue: #20
- Merged implementation branch: `codex/20-blueprint-build-complete` via PR #21
- Durable implementation log: `docs/workstreams/CODEX.md`
- Original M1 delivery: Issue #14 / PR #17

No production booking provider, identity service, Google Calendar sync, outbound notification, payment system, membership policy, real customer database or deployment has been approved or enabled.

## Local requirements

- Node.js `>=20.9.0`
- pnpm `11.7.0` (declared in `package.json`)

## Install and run

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The local environment file is optional for the Mock preview. Never add credentials, provider tokens or real customer data.

## Validation commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Local routes

- `/` — complete Blueprint homepage information architecture
- `/services` — fictional service categories, details and booking entries
- `/barbers` — fictional staff profiles and staff-specific booking entries
- `/works` — ten Blueprint work categories without real customer media
- `/booking` — complete multi-step Mock booking flow; no real booking is created
- `/booking/manage` — local lookup, detail, cancellation request and reschedule preview
- `/membership` — disabled membership placeholder
- `/about` — brand/platform structure with reserved real story and imagery
- `/contact` — safe address, phone, LINE, Instagram, map and transport placeholders
- `/policies` — explicit Owner-decision placeholders
- `/staff/login` — Staff Mock 登入頁；提供 5 個虛構身份與公開示範通行碼 `DUM-DEMO`
- `/staff` — 受 Mock 登入保護的今日／全日工作區
- `/staff/operations` — day/week, queue, customer, schedule and role previews
- `/staff/integrations` — provider health, idempotency, conflict, retry and delivery simulator
- `/staff/quick-actions` — responsive Today, Next, Blocks, Checked In and Completed preview

The customer booking flow uses fictional services, staff, dates, availability and customer details. Use only fictional form values. The confirmation explicitly states that no request was sent to the shop, no notification was delivered and no payment was collected.

The Staff Prototype uses the fixed fictional operating date `2026-07-14` so schedule, conflict and status-transition tests remain reproducible. It supports day/week views, staff filtering, booking details, safe pending/waitlist handling, local block/leave/overtime previews, masked fictional customer history and Domain-controlled status actions.

### Staff Mock 登入

- `/staff` 與其子頁面現在會先檢查本機 Mock Session；未登入或 Session 失效時會導向 `/staff/login`。
- 登入頁提供 5 個虛構身份：Owner、Manager、Barber、Reception 與 Read Only，公開示範通行碼皆為 `DUM-DEMO`。
- Session 會存放在目前瀏覽器的 `localStorage`，並以同一份 Mock Cookie 讓伺服器入口先攔截匿名 Staff 請求；有效時間為 8 小時，登出會清除兩者。
- 店主與管理者可查看整合預覽；設計師示範身份只會看見及操作綁定給自己的虛構行程與客戶，唯讀身份不能修改資料。這些只是假資料驗收範圍，不是正式員工權限政策。
- 客人的網站與預約流程維持免登入，不受 Staff 登入影響。
- 這只是本機 Mock 身份邊界，不是正式資安或 Production Authentication。正式身份供應商、帳號政策、憑證與個資權限仍待 Owner 決策，且必須透過 Identity Adapter 接入。

## Build-complete safety boundaries

- All names, phone displays, services, schedules, bookings and customer histories are fictional or masked.
- Formal prices, policies, membership benefits, deposits and privacy rules remain disabled or `TODO(owner-decision)`.
- Booking, identity, calendar, notification, payment and membership integrations use provider-neutral ports with local Mock or disabled adapters only.
- LINE, reminders, review requests and return campaigns never send externally.
- Integration scenarios show success, conflict, timeout, partial failure and bounded retry without contacting a provider.
- The installable manifest and Apple-style quick actions are web previews; there is no native watchOS application or external registration.
- Reloading the browser resets customer and Staff operation changes; the Mock 登入 Session 會在同一瀏覽器保留最多 8 小時。No production database exists.
- Do not enter secrets or real customer data into the repository or the local prototype.

## Validation evidence

The current build-complete baseline passes:

- TypeScript typecheck
- ESLint
- 43 automated Domain, identity, adapter, booking, Staff, integration and quick-action tests
- Next.js Production Build
- Desktop and mobile browser smoke at the main customer and Staff routes

See `docs/workstreams/CODEX.md` and Issue #20 for exact commits and checkpoint evidence.

## Continuity

GPT and Codex each maintain one durable work log. Before quota exhaustion, shutdown or handoff, the active role must update its log and leave a `CHECKPOINT` in its Issue.

Codex must also Commit and Push all recoverable code to its remote feature branch. A new Task resumes from Git and does not require previous chat context.

## Repository

- Owner: `z72124223`
- Visibility: Private
- Default branch: `main`
- Product / QA role: GPT
- Implementation: Codex local environment
- Work unit: GitHub Issue → durable log → feature branch / review → checkpoints → draft PR → review → merge
