# DUM BARBERSHOP Platform — Roadmap

## Phase 0 — Foundation

- Establish Git as the single source of truth
- Add project constitution, blueprint, architecture, decisions, work protocol and local engine rules
- Define Owner, GPT and Codex responsibilities

Exit criteria:

- Core documents exist on `main`
- Work begins only from GitHub Issues

Status: **Complete**

## Phase 1 — Local Framework

- Create the local application skeleton
- Implement the dark design system
- Add the public site page structure
- Add Mock booking flow
- Add Mock Staff workspace
- Add membership placeholder
- Add typed multi-staff Domain models and adapter boundaries
- Add tests and reproducible local validation

No production integrations are allowed in this phase.

### M1 two-role execution

#### GPT / Issue #13

- Maintain specifications, content requirements and acceptance criteria
- Protect Frozen Core and Reserved decisions
- Prepare QA checklist
- Review the Codex Draft PR against Git authority
- Record acceptance, defects and next milestone tasks

#### Codex / Issue #14

- Build the complete local scaffold and design system
- Build public pages
- Build multi-staff Domain and Mock booking engine
- Build customer booking flow and Staff Prototype
- Add provider-neutral ports and Mock repositories
- Run Typecheck, Lint, Tests, Production Build and mobile smoke checks
- Create Draft PR and resolve GPT Review

Detailed model: `docs/TWO-ROLE-WORK-MODEL.md`  
Continuity: `docs/CONTINUITY-PROTOCOL.md`

### M1 exit criteria

- `GPT_BASELINE_READY` recorded
- Codex `SCAFFOLD_READY`, `DOMAIN_READY`, `PUBLIC_SITE_READY`, `BOOKING_STAFF_READY` and `M1_VALIDATION_READY` recorded
- Typecheck, Lint, Tests and Production Build pass
- Mobile-first Mock booking flow is usable
- Staff Mock workflow is usable
- Multi-staff rules are tested
- No real provider, payment, customer data or secret is connected
- README and Task Log reflect the reproducible local state
- Existing Required review findings are resolved or tracked as scope-limited follow-up Issues
- Validated non-production PR merges to `main` without requiring Owner manual review

Status: **Complete** (Issue #14 / PR #17)

## Phase 2 — Brand Content

- Add approved logo, photography, copy, real services, staff profiles, prices, address and hours
- Finalize design tokens

Starts after M1 validation and PR merge. GPT content / QA review may continue asynchronously and does not block safe placeholder implementation.

Local preview status: **Complete** in Issue #20. Production content remains reserved until approved brand assets and facts are provided.

## Phase 3 — Booking Provider Evaluation and Integration

- GPT compares providers against approved requirements
- Owner selects provider
- Codex implements provider adapter
- Test booking, reschedule, cancellation, multi-staff availability and notifications

Local preview status: **Complete** in Issue #20 with Booking Provider and Identity ports plus disabled / Mock operation simulation. Production provider selection remains reserved.

## Phase 4 — Calendar and Apple Ecosystem

- Define Google Calendar ownership and per-staff calendar structure
- Implement calendar sync
- Validate busy-time blocking
- Test iPhone and Apple Watch viewing
- Prototype quick block actions

Local preview status: **Complete** in Issue #20 with sync metadata, conflict / retry simulation and responsive quick actions. Real Google / Apple integration remains reserved.

## Phase 5 — Customer History

- Add customer search, visit history, service notes, preferred barber and audit controls
- Add authorization boundaries

Local preview status: **Complete** in Issue #20 with masked fictional history, preferences, technical notes and role-aware UI. Production privacy and authorization remain reserved.

## Phase 6 — Membership

Starts only after Owner approves the membership model.

Local preview status: **Complete as a disabled placeholder**. Formal membership remains reserved.

## Phase 7 — Advanced Watch and Automation

- Next-customer workflow
- Block-time shortcuts
- Status updates
- Customer lookup subject to privacy constraints

Local preview status: **Complete as a responsive web preview**. Native watchOS work is not promised or enabled.

## Phase 8 — LINE and Growth Automation

- LINE booking entry
- Reminders
- Review requests
- Return-visit campaigns

Local preview status: **Complete as disabled delivery placeholders**. LINE registration, credentials, consent and outbound delivery remain reserved.

## MVP3 — Minimum Production Go-Live

這是目前唯一啟用的產品路線；先前 Blueprint 的圖片、作品、LINE、會員、付款、Calendar、分析與成長／通知自動化不會隨正式上線一起啟用。

依賴主線：

`PR #28 merged → PR #30 retargeted / validated / merged → #32 → #33 → #34 → #35 → #36 → #37`

- [x] PR #28：MVP1 合併至 `main`（2026-08-01）
- [x] PR #30：MVP2 retarget `main`、50/50 tests 與 production build 通過後合併（2026-08-01）
- [ ] #32 / MVP3-0：正式上線決策與資料治理基線
- [ ] #33 / MVP3-1：共用預約資料層與併發保護
- [ ] #34 / MVP3-2：老闆／職員正式登入與伺服器端授權
- [ ] #35 / MVP3-3：客戶預約與員工時段／註記跨裝置串接
- [ ] #36 / MVP3-4：Windows 常駐、HTTPS、備份、監控與回滾
- [ ] #37 / MVP3-5：正式上線驗收、切換與 24–72 小時穩定觀察

MVP3-0 的正式決策合約位於 `docs/PRODUCTION-BASELINE.md`。每片一個 Issue、feature branch、checks、Commit、Push 與 Draft PR；#37 是唯一可啟用 Production 流量與真實資料的切片。

## Current milestone

`MVP3-0 production decision baseline — IN PROGRESS / NOT ACTIVATED`

Current execution sources:

- Parent Epic: Issue #31
- Current slice: Issue #32 / `agent/32-production-decision-baseline`
- Merged baseline: PR #28 and PR #30
- Prior Blueprint history: Issue #2, Issue #14 / PR #17, Issue #20
- Task dashboard: `docs/TASK-LOG.md`

Issues #4–#8 and the three-window plan are superseded historical records.

## Continuous implementation policy

- Codex continues through Blueprint phases until all technically implementable non-production scope is build-complete.
- Each implementation unit still requires a GitHub Issue, feature branch, checks, Commit, Push and PR.
- Owner manual review is not a blocking gate for validated non-production implementation or merge.
- Real brand facts, prices, staff identities, policies, provider choices, credentials and production actions remain protected decisions.
- When a phase depends on those items, Codex implements the interface, Mock / disabled adapter, states, tests and documentation, records `TODO(owner-decision)`, and continues the remaining phases.
- `Build-complete` does not mean production-ready. Production activation remains a separately verified milestone.
