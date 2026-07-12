# Codex Work Log — Complete M1 Local Implementation

## Identity

- Role: Codex
- Issue: #14
- Expected branch: `codex/14-m1-platform`
- Primary responsibility: all application code, engine, tests, build and integration
- Status: READY

## Durable checkpoint

- Base / last synced `main` SHA: pending
- Last good commit SHA: pending
- Last checkpoint time (Asia/Taipei): pending
- Draft PR: none
- Uncommitted changes: none

## Current objective

Implement the complete M1 local framework with fictional Mock Data, including the platform scaffold, public site, multi-staff Domain, Mock booking flow, Staff Prototype and full validation.

## Ordered implementation checkpoints

1. `SCAFFOLD_READY`
   - Next.js / TypeScript / Tailwind
   - one package manager and lockfile
   - strict TypeScript, scripts, `.env.example`
   - dark design tokens and shared shell
2. `DOMAIN_READY`
   - Branch, Staff, Service, Customer, Booking, Deposit, Membership placeholder, Calendar Block and Audit types
   - availability calculation
   - booking status transition rules
   - ports, Mock adapters and tests
3. `PUBLIC_SITE_READY`
   - home, services, barbers, works, membership placeholder, about, contact and policies
4. `BOOKING_STAFF_READY`
   - complete Mock customer booking flow
   - Staff today / full-day schedule, next customer, search, blocks and status actions
5. `M1_VALIDATION_READY`
   - typecheck, lint, tests, production build and mobile smoke checks
   - README setup commands
   - Draft PR and evidence

## Completed

- None.

## In progress

- None.

## Exact next action

Read Issue #14, claim it, create or checkout `codex/14-m1-platform`, initialize the local application scaffold and publish the `SCAFFOLD_READY` checkpoint.

## Resume commands

```bash
git fetch --all --prune
git checkout codex/14-m1-platform
git pull --ff-only
```

Then use the package manager and commands recorded by the latest checkpoint.

## Checks

- Install: not run
- Typecheck: not run
- Lint: not run
- Tests: not run
- Production build: not run
- Mobile smoke: not run
- Secret / real-data review: not run

## Blockers

- None. Production integrations and unresolved business policies remain disabled, Mock or `TODO(owner-decision)`.

## Owner decision needed

- None required to begin M1.