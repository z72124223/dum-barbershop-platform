# Codex Work Log — Complete M1 Local Implementation

## Identity

- Role: Codex
- Issue: #14
- Branch: `codex/14-m1-platform`
- Primary responsibility: all application code, engine, tests, build and integration
- Status: IN_PROGRESS

## Existing durable checkpoint

- Source branch inherited: `work/4-platform-public`
- New consolidated branch: `codex/14-m1-platform`
- Branch creation source HEAD: `f4bbed09fa905e079478b0b9fe07506aa0ea35b3`
- Last good code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Latest governance `main` SHA merged: `9958ab47f91df9aecafdd1e7fc33ea519b070600`
- Last checkpoint source: former Issue #4
- Draft PR: none
- Uncommitted changes: Domain / Mock engine checkpoint files listed in the latest checkpoint below

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

- `/booking` customer flow
- `/staff` workspace
- Integration / UI tests for those features
- Responsive screenshots / full M1 validation
- Draft PR

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

Commit and push this completed Domain / Mock engine checkpoint, publish the pending `SCAFFOLD_MIGRATED` and `DOMAIN_READY` Issue #14 comments, then begin the customer booking flow.

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
- Domain / adapter tests: 15 passed
- Booking / Staff UI tests: not run
- Mobile smoke: not run
- Secret / real-data review after merge: not run

## Blockers

- None. Production integrations and unresolved business policies remain disabled, Mock or `TODO(owner-decision)`.

## Owner decision needed

- None required to continue M1.

## SCAFFOLD_MIGRATED checkpoint

- Status: `IN_PROGRESS`
- Base / last synced main SHA: `9958ab47f91df9aecafdd1e7fc33ea519b070600`
- Last good code commit: `4a7c263edc5d6e80e82386bd86f116271443a873`
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

- Status: `READY_TO_COMMIT`
- Resumed at: `2026-07-14 13:31:06 +08:00`
- Latest remote branch commit before this checkpoint: `5349656cb2094a895cacd3075514016bec938e14`
- Latest synced `origin/main`: `9958ab47f91df9aecafdd1e7fc33ea519b070600`
- Completed: multi-staff Domain models, staff schedules and blocks, service duration and buffers, Domain-calculated availability, booking status transitions with audit events, deposit / booking status separation, provider-neutral ports and fictional Mock repositories.
- Safety behavior: rejects overlapping bookings for the same staff, allows different staff at the same time, preserves idempotency, and does not implement any unresolved business policy.
- Tests: 15 Domain / Adapter tests passed across availability, transition, booking repository and customer repository behavior.
- Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` passed.
- Exact next action: commit and push `DOMAIN_READY`, publish Issue #14 checkpoint evidence, then implement `/booking` and public booking entry refinements.
- Blockers: none.
- Owner decision needed: none for M1 Mock implementation.
- Uncommitted changes: `.gitignore`, `eslint.config.mjs`, `package.json`, `tsconfig.test.json`, `src/domain/**`, `src/adapters/**`, `src/data/**`, `docs/workstreams/CODEX.md`.
