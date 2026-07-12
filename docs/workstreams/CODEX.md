# Codex Work Log — Complete M1 Local Implementation

## Identity

- Role: Codex
- Issue: #14
- Branch: `codex/14-m1-platform`
- Primary responsibility: all application code, engine, tests, build and integration
- Status: READY

## Existing durable checkpoint

- Source branch inherited: `work/4-platform-public`
- New consolidated branch: `codex/14-m1-platform`
- Branch creation source HEAD: `f4bbed09fa905e079478b0b9fe07506aa0ea35b3`
- Last good code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Latest governance `main` SHA to merge: `2e0f1f0eb95c713f92e456f76cfa4ae69d68cfd0`
- Last checkpoint source: former Issue #4
- Draft PR: none
- Uncommitted changes: none

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

- Multi-staff Domain models
- Availability calculation
- Booking status transition engine
- Adapter ports and Mock repositories
- `/booking` customer flow
- `/staff` workspace
- Domain / integration / UI tests for those features
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

Checkout `codex/14-m1-platform`, merge `origin/main`, resolve governance-document conflicts in favor of latest `main` while preserving the inherited application code, then run the full existing pnpm checks and publish a `SCAFFOLD_MIGRATED` checkpoint in Issue #14.

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
- Checks after current-main merge: not run
- Domain tests: not run
- Booking / Staff tests: not run
- Mobile smoke: not run
- Secret / real-data review after merge: not run

## Blockers

- None. Production integrations and unresolved business policies remain disabled, Mock or `TODO(owner-decision)`.

## Owner decision needed

- None required to continue M1.