# Codex Work Log — MVP3 Minimum Production

## Active identity — Issue #32

- Role: Codex
- Issue: #32
- Branch: `agent/32-production-decision-baseline`
- Primary responsibility: freeze the minimum Production architecture, business schedule, identity, data-retention and operations contract without changing runtime
- Status: `PR_OPEN`

## MVP3_DECISION_BASELINE checkpoint

- Status: `PR_OPEN`
- Updated at: `2026-08-01 +08:00`
- Parent Epic: https://github.com/z72124223/dum-barbershop-platform/issues/31
- Issue: https://github.com/z72124223/dum-barbershop-platform/issues/32
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/38
- Branch: `agent/32-production-decision-baseline`
- Integration gate completed: PR #28 merged at `7e180ed3b215a89be14f7c591e2cc08c394b296e`; PR #30 was retargeted to `main`, revalidated and merged at `f7bc974df32dc947969b6184a0e4454a143e6722`.
- Final `main` validation: Node 24.14.0 / pnpm 11.9.0; typecheck PASS; lint PASS; tests PASS (50/50); production build PASS.
- Decision scope: Windows single-origin risk, Cloudflare Tunnel ingress, SQLite WAL, fixed staff/time contract, auto-confirm booking, customer data minimization and retention, Better Auth sessions, staging/production separation, backup/restore, alert and rollback ownership.
- Runtime boundary: documentation only; no port, firewall, DNS, database, service, secret or real customer data change.
- Decision proposal: proposed D-017 and `docs/PRODUCTION-BASELINE.md`; Owner approved the exact eight values in Codex on 2026-08-01, recorded in Issue #32 comment `5150975055`.
- Approved responsibility: `@z72124223` is the accountable maintenance／alert／rollback Owner, manages the customer-data contact channel and approved encrypted A／B backup rotation.
- Required Owner input: Issue #32 must still name the actual Production domain; credentials and secret paths remain out of Git.
- Blocker: #32 cannot complete and #33 cannot start before the Production domain is recorded in GitHub.
- Proposal commit: `c2202d7acbd413e6b6ec4c9cc98523cd6a79681f`; documentation links, diff check and secret／PII pattern scans PASS.
- Exact next action: request and record the actual Production domain／hostname. Keep PR #38 Draft, do not close #32 and do not start #33 before that remaining gate.

## ISSUE_29_MVP2_HISTORY_TAIPEI checkpoint

- Status: `MERGED`
- Updated at: `2026-07-29 +08:00`
- Branch: `codex/29-mvp2-history-taipei`
- Base: `main` after PR #28 merged
- Issue: https://github.com/z72124223/dum-barbershop-platform/issues/29
- Merged PR: https://github.com/z72124223/dum-barbershop-platform/pull/30
- Last validated implementation commit: `b663e069f538859562e6abfed8a29c437b52b7a2`
- Scope implemented: `/staff` adds a history tab with inclusive start/end dates plus Staff and booking/note filters; each result shows its Taipei date/time and current saved booking note or independent manual note. The agenda now provides explicit edit, save and cancel controls for note content while leaving all other entry fields unchanged; the history tab remains read-only.
- Edit safety: independent note content cannot be blank, booking notes may be cleared, cancel performs no write, same-origin cross-tab update conflicts are detected, and keyboard focus returns to the edit control after closing the editor.
- Time boundary: all Taipei date, calendar shift, formatting and elapsed-slot logic now comes from one pure `Asia/Taipei` module; the browser clock refreshes every minute and on focus/visibility return.
- Customer safety: elapsed Taipei slots are disabled and confirmation rechecks the slot before saving.
- Persistence boundary: the existing `dum_mvp_schedule_entries_v1` browser data shape and key are unchanged; no API, database, cross-device sync or external provider was added.
- Explicit exclusions retained: photos, portfolio/works, LINE, finance/payment, membership and AI remain out of scope.
- Checks: `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm test` PASS (50 / 50); `pnpm build` PASS on Next.js 16.2.10.
- HTTP smoke: `/`, `/booking` and `/staff/login` return 200; anonymous `/staff` returns 307 to `/staff/login?next=%2Fstaff`.
- Visual browser QA: not separately claimed; the rebuilt loopback-only local preview is running at `http://127.0.0.1:3100`.
- Owner decision needed: none for this device-local Mock MVP2.
- Blockers: none for local review; production identity, shared persistence and hosting remain outside this Issue.
- Merge: `f7bc974df32dc947969b6184a0e4454a143e6722` after retarget, 50/50 tests and production build validation.
- Exact next action: none for Issue #29; continue under Epic #31 / Issue #32.

## ISSUE_27_FIRST_MVP checkpoint

- Status: `VALIDATED`
- Updated at: `2026-07-29 +08:00`
- Branch: `codex/27-first-mvp`
- Issue: https://github.com/z72124223/dum-barbershop-platform/issues/27
- Merged PR: https://github.com/z72124223/dum-barbershop-platform/pull/28
- Last validated implementation commit: `6a6c393473396a3488ca7b68c7948cc0d3944cfa`
- Scope implemented: four focused routes only — `/`, `/booking`, `/staff/login` and `/staff`; Owner and Staff share one schedule/notes workspace.
- Customer flow: choose date, time and staff; enter name, phone and optional note; confirm into the shared device-local schedule.
- Staff flow: browse the combined agenda, filter by date/staff, and manually add either a booking or a free-text note.
- Persistence boundary: booking entries, notes and Mock Session remain on this browser/device only; no API, production identity, external provider or real customer database is present.
- Explicit exclusions: photos, portfolio/works, LINE, finance/payment, membership, AI and API integrations are not exposed in this MVP.
- Checks: `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm test` PASS (35 / 35); `pnpm build` PASS on Next.js 16.2.10.
- HTTP smoke: `/`, `/booking` and `/staff/login` return 200; protected `/staff` redirects to login; removed `/works` returns 404; `/og.png` returns `image/png`.
- Visual browser QA: not separately claimed in this checkpoint; the production preview was opened for owner inspection after automated checks.
- Owner decision needed: none for this local Mock MVP; real authentication, shared persistence and production hosting remain future work.
- Blockers: none for local MVP review.
- Exact next action: review the Draft PR and continue only through a new or updated Issue when the next MVP requirement is provided.

## ISSUE_25_STAFF_MOCK_AUTH checkpoint

- Status: `VALIDATED`
- Updated at: `2026-07-19 +08:00`
- Branch: `codex/25-staff-mock-auth`
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/26
- Last validated implementation commit: `5e71f7e7c4a3591da06c021a8145dcc5d883e916`
- Scope implemented: `/staff/login`, five fictional Staff identities, public demo code `DUM-DEMO`, eight-hour browser-local Session, server-side Staff route interception, logout flow and role-permission integration.
- Mock role scope: the barber identity is linked to `staff-mock-bravo` and can only see or operate that fictional staff record's bookings, schedule blocks and assigned customer fixtures. This is a Mock acceptance boundary, not a formal employee-visibility policy.
- Customer boundary: public website and customer booking remain login-free.
- Security boundary: this is a local Mock identity implementation only. It is not production authentication; no real account, credential, provider or customer data was added.
- Checks: `pnpm install --frozen-lockfile` PASS; `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm test` PASS (43 / 43); `pnpm build` PASS on Next.js 16.2.10 with Proxy middleware.
- Browser smoke: PASS for invalid credentials, successful Owner login, reload Session restore, logout and protected-route redirect, Owner integration access, barber integration denial and barber-only schedule/customer scope.
- Mobile smoke: 390x844 target (375px content viewport) has no horizontal overflow; the login card starts first and the submit button is fully visible. Browser console errors: none.
- Owner decision needed: none for this local Mock implementation; formal identity provider, account policy, credentials and production authorization remain reserved.
- Blockers: none.
- Exact next action: resume from PR #26, inspect any GPT/CI review feedback, fix only confirmed Issue #25 defects, rerun the affected checks and update the same branch/PR. If no Required fix exists, the PR is ready for non-production review/merge under project policy.
- Resume command: `git fetch origin && git switch codex/25-staff-mock-auth && git pull --ff-only`
- Uncommitted changes after this checkpoint commit: none.

## Identity

- Role: Codex
- Issue: #20
- Branch: `codex/20-blueprint-build-complete`
- Primary responsibility: all application code, engine, tests, build and integration
- Status: DONE

## Issue #20 current objective

All safe, local and non-production Blueprint previews are implemented, validated and merged. Production credentials, real business facts and unresolved policies remain Mock, disabled or `TODO(owner-decision)`; any future work starts from a new scope-limited Issue.

## Issue #20 ordered gates

1. `PUBLIC_EXPERIENCE_COMPLETE`
2. `BOOKING_LIFECYCLE_COMPLETE`
3. `STAFF_OPERATIONS_COMPLETE`
4. `INTEGRATION_SIMULATION_COMPLETE`
5. `BLUEPRINT_BUILD_COMPLETE`

## Issue #20 durable checkpoint

- Claimed Issue: https://github.com/z72124223/dum-barbershop-platform/issues/20
- Base `main`: `cf418fb72e0bb7b18ce19cec0e9369b54e70a6d7`
- Branch source: merged Issue #14 / M1 platform
- Last good implementation commit: `f217e2d95393da78e8f95b1fc1d4f01d9fc1eb65`
- Final implementation PR: https://github.com/z72124223/dum-barbershop-platform/pull/21
- Final merge SHA: `234ffd1c0635e02c0008c681a54787ec360ec21c`
- Exact next action: none for Issue #20; future production or content work requires a new GitHub Issue and the relevant approved decisions.
- Blockers: none.
- Owner decision needed: none for local Mock implementation.

## BOOKING_LIFECYCLE_COMPLETE checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 16:44:53 +08:00`
- Completed: customer-side local lookup, booking detail, cancellation request and reschedule preview at `/booking/manage`.
- Domain safety: reschedule lineage links original and replacement records; all status changes use the central transition engine and emit audit records.
- Queue safety: pending and waitlisted records can be ranked without modifying or displacing confirmed bookings.
- Adapter safety: Booking Provider and Identity boundaries are explicit; production behavior remains disabled and Mock identity never claims real authentication.
- Integration reliability model: idempotency, conflict, timeout, bounded retry and partial-failure states are represented and tested.
- Privacy: locally entered phone values are masked before persistence to the session preview.
- Checks: typecheck and scoped lint passed; lifecycle, integration and adapter tests passed.
- Exact next action: expand the Staff workspace with day/week operations, leave/overtime blocks, safe pending/waitlist handling, customer notes and role-aware controls.
- Blockers: none.
- Owner decision needed: none; cancellation, refund, payment and production authentication rules remain disabled or `TODO(owner-decision)`.

## STAFF_OPERATIONS_COMPLETE checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 16:51:53 +08:00`
- New route: `/staff/operations` with day, seven-day week, safe queue, fictional customer record and configuration views.
- Scheduling: local blocked-time, leave and overtime previews reject same-staff conflicts.
- Booking operations: pending, waitlist, confirm, check-in, in-service, completed, shop-cancelled, no-show and reschedule actions use Domain rules; reschedule keeps lineage.
- Queue behavior: only pending and waitlisted records are ranked; confirmed bookings are never displaced automatically.
- Customer preview: masked fictional identity, preferences, service history and technical notes with local audit display.
- Configuration preview: staff roles, capabilities, service duration and schedule coverage; formal prices remain `TODO(owner-decision)`.
- Permission preview: Owner, Manager, barber, reception and read-only UI scopes are enforced locally; the screen explicitly states there is no production authentication.
- Checks: typecheck PASS, lint PASS, 34/34 tests PASS, production build PASS with 12 application routes plus not-found.
- Exact next action: build the integration operations console and Apple-style quick-action preview with disabled external delivery.
- Blockers: none.
- Owner decision needed: none for the Mock preview; production identity and staff authorization policy remain reserved.

## INTEGRATION_SIMULATION_COMPLETE checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 16:57:19 +08:00`
- New routes: `/staff/integrations` and `/staff/quick-actions`.
- Integration console: Booking Provider, Calendar, Notification, Payment, Membership, Identity and LINE are separated by provider-neutral boundaries.
- Reliability simulation: queued, success, conflict, timeout, partial failure, bounded retry and terminal behavior with visible idempotency keys and local audit records.
- Calendar: bidirectional sync direction, external Mock event reference, revision, last-sync time and conflict status are visible.
- Delivery safety: reminders, review requests, return campaigns and LINE delivery are present only as disabled previews; zero external messages are sent.
- Apple-style quick actions: Today, Next, Blocks, Checked In and Completed are available as responsive web previews; this is explicitly not a watchOS application.
- Provider safety: formal booking, payment, membership and LINE integrations remain disabled; no registration, API Key or credential is required.
- Checks: typecheck PASS, lint PASS, 36/36 tests PASS, production build PASS with 14 application routes plus not-found.
- Exact next action: complete the public-site information architecture, responsive content previews, installable metadata and page-level empty/loading/error readiness.
- Blockers: none.
- Owner decision needed: none for the Mock simulation; all production providers and outbound policies remain reserved.

## PUBLIC_EXPERIENCE_COMPLETE checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 17:11:47 +08:00`
- Homepage: complete Blueprint 5.1 preview with hero, booking, services, works, barbers, studio features, reviews, visit/map, contact channels and mobile fixed booking entry.
- Public routes: service categories and booking entry, fictional barber profiles, ten Blueprint work categories, About structure, contact/transport/map placeholders and reserved policy disclosure.
- Truthfulness: no real or generated customer imagery; brand story, photos, reviews, staff facts, prices, address, hours, social links and policies remain explicit placeholders.
- Installable metadata: local manifest, theme metadata, standalone display settings and code-native SVG icon require no external registration.
- States: application loading/error pages, booking Suspense, empty content states, validation messages, disabled controls and integration failure states are visible and truthful.
- Browser desktop: homepage, ten-category works, booking lookup/reschedule, Staff role/weekly view, integration success/retry and quick actions passed; console errors/warnings: none.
- Browser mobile: 390x844 target tested across homepage, booking management, Staff operations, integrations, quick actions and works; no document-level horizontal overflow.
- Mobile safety: fixed booking CTA is visible on public pages and absent from booking/Staff workflows.
- Checks: typecheck PASS, lint PASS, 36/36 tests PASS, production build PASS with manifest and icon routes.
- Exact next action: update README, run clean final validation and route smoke, open Draft PR, merge and record `BLUEPRINT_BUILD_COMPLETE`.
- Blockers: none.
- Owner decision needed: none for build-complete; production content and integrations remain explicitly reserved.

## BLUEPRINT_BUILD_COMPLETE validation checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 17:16:45 +08:00`
- Scope: public website, booking lifecycle, multi-staff operations, integration simulator and responsive quick-action preview are build-complete locally.
- `pnpm install --frozen-lockfile`: PASS with pnpm 11.7.0.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS (36 / 36).
- `pnpm build`: PASS; 14 application routes plus manifest, icon and not-found generated.
- HTTP smoke: PASS (16 / 16 requested application / asset routes returned 200).
- Browser: desktop and 390x844 target mobile workflows PASS; no console errors / warnings and no document-level overflow on tested routes.
- Repository hygiene: exactly one lockfile; only `.env.example` tracked; secret signatures, unmasked phone and email scans PASS; `git diff --check` PASS.
- Documentation: README, Roadmap, Task Log and Codex durable log synchronized with build-complete / not-production-ready status.
- Reserved: real brand assets, prices, service facts, staff identities, location, hours, reviews, policies, privacy retention, providers, credentials, outbound delivery, deployment and native watchOS remain disabled or `TODO(owner-decision)`.
- Blockers: none.
- Owner decision needed: none for merge of this validated non-production preview.
- Final validation commit: `68afefcea4f7586dbe4702cc5e1b3836a8671bfb`.
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/21
- Review findings: none; PR was clean and mergeable with no configured GitHub Actions checks.
- Merge SHA: `234ffd1c0635e02c0008c681a54787ec360ec21c`.
- Merged at: `2026-07-14 17:19:25 +08:00`.
- Uncommitted changes: none after this final completion record is committed.
- Exact next action: none for Issue #20. Resume only from a new scope-limited Issue based on Git authority.

## Existing durable checkpoint

- Source branch inherited: `work/4-platform-public`
- New consolidated branch: `codex/14-m1-platform`
- Branch creation source HEAD: `f4bbed09fa905e079478b0b9fe07506aa0ea35b3`
- Last good code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Latest governance `main` SHA merged: `1dba51eb0718d811534f06817ebb82cb2336512c`
- Last checkpoint source: former Issue #4
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/17
- Uncommitted changes: none after this final PR log update is committed

## Current objective

Continue from the existing tested scaffold and complete M1: synchronize current `main`, add multi-staff Domain and Mock engine, add booking and Staff experiences, run full validation and open one Draft PR for Issue #14.

## Existing completed work

The inherited branch already contains:

- Next.js scaffold
- pnpm 11.7.0 and one pnpm lockfile
- strict TypeScript / project scripts
- centralized dark design tokens
- shared UI and global layout
- public routes: `/`, `/about`, `/barbers`, `/contact`, `/membership`, `/policies`, `/services`, `/works`
- README local setup
- production build and local HTTP smoke check
- secret-pattern and diff checks

Previously reported checks at code commit `20004c615876c3beb7110bec2e0a97764c21735a`:

- `pnpm install`: PASS
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS
- local HTTP smoke: PASS

## Not yet implemented

- None for the Issue #14 M1 implementation scope. Any required review fixes will be handled on the same branch and Draft PR.

## Ordered implementation checkpoints

1. `SCAFFOLD_MIGRATED`
   - Merge latest `main` into `codex/14-m1-platform`
   - Preserve existing application code
   - Prefer latest `main` for governance files
   - Re-run install, typecheck, lint, tests and build
2. `DOMAIN_READY`
   - Branch, Staff, Service, Customer, Booking, Deposit, Membership placeholder, Calendar Block and Audit types
   - availability calculation
   - booking status transition rules
   - ports, Mock adapters and tests
3. `PUBLIC_SITE_READY`
   - verify and refine inherited public routes
   - add `/booking` entry and consistent navigation
4. `BOOKING_STAFF_READY`
   - complete Mock booking flow
   - Staff today / full-day schedule, next customer, search, blocks and status actions
5. `M1_VALIDATION_READY`
   - typecheck, lint, tests, production build and mobile smoke checks
   - README setup commands
   - Draft PR and evidence

## Exact next action

Push the latest-main merge and this validation record, mark Draft PR #17 ready, merge it under Decision D-016, then create the next scope-limited Blueprint implementation Issue and branch.

## Resume commands

```bash
git fetch --all --prune
git checkout codex/14-m1-platform
git pull --ff-only origin codex/14-m1-platform
git merge origin/main
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

During merge conflicts:

- keep latest `main` versions of `AGENTS.md`, `README.md` workflow sections and `docs/**` governance files
- preserve application scaffold and public-site code from the Codex branch
- do not restore superseded three-window instructions

## Current checks

- Inherited scaffold checks: PASS at `20004c615876c3beb7110bec2e0a97764c21735a`
- Checks after current-main merge `4a7c263edc5d6e80e82386bd86f116271443a873`: install, typecheck, lint, test and production build PASS
- Domain / adapter / booking / staff tests: 23 passed
- Customer booking browser smoke: passed end-to-end through clear Mock confirmation
- Staff logic tests: 5 passed; total automated tests: 23
- Staff browser smoke: status chain, all-day view, block success / conflict, customer search passed
- Mobile smoke: home navigation / fixed booking entry and `/booking` 390×844 viewport passed
- Final install, typecheck, lint, 23 tests and production build: PASS
- All 10 application routes returned HTTP 200 from the local development server
- Required, empty and adapter-conflict states: verified through browser and automated tests
- Secret / real-data review: PASS; one lockfile, safe `.env.example`, no secret or unmasked phone / email pattern in source
- README final route, safety and local-behavior documentation: updated
- Revalidation after governance Decision D-016 / `origin/main` `1dba51e`: install, typecheck, lint, 23 tests and production build PASS

## Blockers

- None. Production integrations and unresolved business policies remain disabled, Mock or `TODO(owner-decision)`.

## Owner decision needed

- None required to continue M1.

## SCAFFOLD_MIGRATED checkpoint

- Status: `COMPLETE`
- Base / last synced main SHA: `9958ab47f91df9aecafdd1e7fc33ea519b070600`
- Last good code commit: `5349656cb2094a895cacd3075514016bec938e14`
- Last checkpoint time: `2026-07-12 22:51:33 +08:00`
- Completed: latest governance merged from `origin/main`; conflicts resolved in favor of main governance while preserving the inherited Next.js scaffold and public-site code.
- Checks passed: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Production routes: `/`, `/about`, `/barbers`, `/contact`, `/membership`, `/policies`, `/services`, `/works`.
- Exact next action: create multi-staff Domain models and exports under `src/domain/**`, then add availability and transition tests.
- Resume steps: `git fetch --all --prune`; `git switch codex/14-m1-platform`; `git pull --ff-only`; `pnpm install`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm build`.
- Known blockers: none.
- Owner decision needed: none for M1 Mock implementation.
- Draft PR: none yet.

## CHECKPOINT — PAUSED_QUOTA

- Status: `PAUSED_QUOTA`
- Last remote good commit: `5349656cb2094a895cacd3075514016bec938e14`
- Last checkpoint time: `2026-07-12 23:02:32 +08:00`
- Completed locally: multi-staff Domain models, availability calculation, booking transition engine with AuditEvent, provider-neutral ports, fictional Mock repositories/data, and 15 Domain/Adapter tests.
- Checks passed locally: `pnpm typecheck`, `pnpm lint`, `pnpm test` (15/15), `pnpm build`.
- In progress: `DOMAIN_READY` Commit/Push and Issue #14 checkpoint publication.
- Exact next action: stage `.gitignore`, `package.json`, `tsconfig.test.json`, `src/domain/**`, `src/adapters/**`, `src/data/**`, and this log; commit as `checkpoint(#14): implement domain and mock engine`; push `codex/14-m1-platform`; then publish both pending Issue #14 checkpoint comments.
- Resume steps: `git switch codex/14-m1-platform`; inspect `git status`; rerun `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm build`; then perform the exact next action.
- Blocker: automatic approval review rejected Git Commit and GitHub comments because the account usage limit resets at `2026-07-13 03:12 +08:00`.
- Owner decision needed: none.
- Uncommitted changes: `.gitignore`, `package.json`, `tsconfig.test.json`, `src/domain/**`, `src/adapters/**`, `src/data/**`, `docs/workstreams/CODEX.md`.

## DOMAIN_READY checkpoint

- Status: `COMPLETE`
- Resumed at: `2026-07-14 13:31:06 +08:00`
- Checkpoint commit: `8804fac`
- Latest synced `origin/main`: `9958ab47f91df9aecafdd1e7fc33ea519b070600`
- Completed: multi-staff Domain models, staff schedules and blocks, service duration and buffers, Domain-calculated availability, booking status transitions with audit events, deposit / booking status separation, provider-neutral ports and fictional Mock repositories.
- Safety behavior: rejects overlapping bookings for the same staff, allows different staff at the same time, preserves idempotency, and does not implement any unresolved business policy.
- Tests: 15 Domain / Adapter tests passed across availability, transition, booking repository and customer repository behavior.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` passed.
- Issue #14 checkpoint comments: `SCAFFOLD_MIGRATED` and `DOMAIN_READY` published.
- Exact next action: implement `/booking` and public booking entry refinements.
- Blockers: none.
- Owner decision needed: none for M1 Mock implementation.
- Uncommitted changes: none after this checkpoint log is committed.

## PUBLIC_SITE_READY checkpoint

- Status: `COMPLETE`
- Checkpoint commit: `0f17703`
- Completed at: `2026-07-14 13:44:53 +08:00`
- Completed: `/booking` route, six-screen customer flow, Domain-calculated multi-staff slot selection, no-preference actual staff assignment, customer details / notes, disabled-real-payment deposit placeholder, summary and explicit no-real-booking confirmation.
- Public entries: desktop header, homepage hero, mobile fixed CTA, service-specific links and staff-specific links all converge on `/booking`.
- Mobile navigation: accessible disclosure menu added; booking CTA is hidden inside `/booking` and future `/staff` so it cannot cover workflow controls.
- Public refinements: service and staff pages now use fictional Mock records with contextual booking links and no invented formal price or identity.
- Tests: 18 passed, including no-preference staff assignment and duplicate-time collapse.
- Browser evidence: desktop flow completed end-to-end; 390×844 home and booking views have no horizontal overflow; mobile navigation opens; booking confirmation clearly says no real booking was created.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` passed; `/booking` is statically generated.
- Issue #14 checkpoint: `PUBLIC_SITE_READY` published.
- Exact next action: build the `/staff` Mock workspace.
- Blockers: none.
- Owner decision needed: none; real prices, providers, policies, customer data and payment remain absent.

## BOOKING_STAFF_READY checkpoint

- Status: `COMPLETE`
- Checkpoint commit: `b33b1be`
- Completed at: `2026-07-14 13:54:58 +08:00`
- Customer flow: already durable at `PUBLIC_SITE_READY` commit `0f17703` and retested end-to-end.
- Staff workspace: added `/staff` with today metrics, next customer, staff filter, booking list / details, full-day timeline, customer search with fictional history, pending / waitlist placeholders, and explicit no-auth local-prototype warning.
- Status actions: confirmed → checked-in → in-service → completed flow uses the centralized Domain transition API and creates Mock audit events; pending can be confirmed through the same legal transition rules.
- Block time: staff-specific 30 / 60 minute Mock blocks can be added; conflicts with the same staff's booking or block are rejected; different staff remain independent.
- Tests: 23 passed, including staff filtering, next-customer selection, timeline ordering, same-staff block rejection and different-staff allowance.
- Browser evidence: desktop status chain completed; full-day block creation and duplicate conflict were verified; fictional customer search returned one masked record; 390×844 today and full-day views have no horizontal overflow; no browser console errors.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` passed; `/staff` is statically generated.
- Issue #14 checkpoint: `BOOKING_STAFF_READY` published.
- Exact next action: perform final clean install / route / mobile / secret / README validation and open the Draft PR.
- Blockers: none.
- Owner decision needed: none for M1; authentication, production data, real notifications / calendar / payment and operational policies remain out of scope.

## M1_VALIDATION_READY checkpoint

- Status: `COMPLETE`
- Checkpoint commit: `9e38ef4`
- Completed at: `2026-07-14 14:00:09 +08:00`
- Install: `pnpm install --frozen-lockfile` PASS with pnpm 11.7.0; exactly one lockfile (`pnpm-lock.yaml`).
- Typecheck: PASS.
- Lint: PASS.
- Tests: 23 / 23 PASS across Domain availability, status transitions, Mock repositories, customer booking options and Staff workspace logic.
- Production build: PASS; `/`, `/about`, `/barbers`, `/booking`, `/contact`, `/membership`, `/policies`, `/services`, `/staff` and `/works` are statically generated.
- HTTP smoke: all 10 application routes returned 200 from the local development server.
- Customer browser smoke: complete happy path, required-field error, no-schedule empty state and explicit no-real-booking confirmation passed.
- Staff browser smoke: status chain, audit count, next customer, full-day timeline, block success / conflict, customer search and masked history passed.
- Responsive smoke: 390×844 home, booking and Staff views passed with no horizontal overflow; mobile navigation opened; fixed booking CTA did not cover booking / Staff controls.
- Browser console: no errors or warnings during final workflow checks.
- Loading / error readiness: shared application loading / error pages, booking Suspense fallback, empty / validation messages and adapter conflict handling are present.
- Security / data: no secret patterns, unmasked phone or email patterns found in source; `.env.example` contains Mock-only public settings; no real customer data introduced.
- README: install, routes, Mock behavior and safety boundaries updated.
- UI evidence: equivalent detailed desktop / mobile browser smoke evidence recorded here and in Issue #14; no unapproved real or generated customer imagery used.
- Reserved decisions: real prices, identities, policy text, authentication, booking provider, calendar synchronization, notifications, payment, membership and production deployment remain unimplemented.
- Issue #14 checkpoint: `M1_VALIDATION_READY` published.
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/17
- Exact next action: GPT Issue #13 reviews Draft PR #17; Codex addresses any required fixes on `codex/14-m1-platform`.
- Blockers: none.
- Owner decision needed: none for M1 acceptance; all reserved production decisions remain deferred.

## CONTINUOUS_EXECUTION_REVALIDATION checkpoint

- Status: `COMPLETE`
- Completed at: `2026-07-14 16:30 +08:00`
- Latest synced `origin/main`: `1dba51eb0718d811534f06817ebb82cb2336512c`
- Merge commit: `611542f83e9a034278f5e849043fbe9b3297af02`
- Decision applied: D-016 / Issue #18; Owner manual review is not a blocking gate for this validated non-production PR.
- `pnpm install --frozen-lockfile`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS (23/23).
- `pnpm build`: PASS; all 10 application routes generated.
- Review findings: none recorded on PR #17.
- Exact next action: push, merge PR #17, then create the next Blueprint implementation Issue.
- Reserved / production items: remain disabled, Mock or `TODO(owner-decision)`.

## ISSUE_23_VISUAL_LOCALIZATION checkpoint

- Status: `MERGED`
- Completed at: `2026-07-14 18:40 +08:00`
- Branch: `codex/23-zh-gangster-style`
- Completed: public website, customer booking flow, booking management and Staff Mock workspace now use Traditional Chinese as the primary customer-facing language.
- Visual system: introduced a fictional American noir / gangster-inspired presentation with near-black, oxblood red, antique brass, bone white, serif display type, double-line frames, stamped labels and restrained paper-grain treatment.
- Regional presentation: customer-facing copy now describes service for a Traditional Chinese-speaking local audience; all store, staff, service, customer and policy details remain explicitly fictional or undecided.
- Safety boundary: no weapons, violent content, real identities, real prices, real policies, production providers or customer data were introduced.
- Tests: `pnpm test` PASS (36/36).
- Checks: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and `pnpm build` PASS.
- Browser evidence: desktop homepage and 390x844 mobile checks passed across public, booking and Staff routes; no horizontal overflow or browser console errors were observed.
- Local comparison: baseline preserved at `http://127.0.0.1:3101/`; Issue #23 redesign available at `http://127.0.0.1:3102/` while the local preview processes remain active.
- Implementation commit: `05c9a6093e79b239daf3765a30a26bf8e1d5f07f`.
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/24
- Main merge commit: `c745226b3d0879daeb24616a64711c798bd271e2`.
- Exact next action: none for Issue #23; subsequent implementation continues under its own scope-limited Issue and branch.
- Blockers: none.
- Owner decision needed: none for this Mock visual/localization pass; all reserved production decisions remain deferred.
