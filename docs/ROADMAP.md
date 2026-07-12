# DUM BARBERSHOP Platform — Roadmap

## Phase 0 — Foundation

- Establish Git as the single source of truth
- Add project constitution, blueprint, architecture, decisions, work protocol, and local engine rules
- Define ownership and multi-worker rules

Exit criteria:

- Core documents exist on `main`
- Work begins only from GitHub Issues

Status: **Complete**

## Phase 1 — Local Framework

- Create the local application skeleton
- Implement the dark design system
- Add the public site page structure
- Add mock booking flow
- Add mock staff day view
- Add membership placeholder
- Add typed domain models and adapter boundaries

No production integrations are allowed in this phase.

### M1 parallel workstreams

M1 is executed through three independent windows:

1. **M1-A / Issue #4 — Platform & Public Experience**
   - Local scaffold
   - Dark design system
   - Shared UI and global shell
   - Public site pages

2. **M1-B / Issue #5 — Domain & Mock Engine**
   - Multi-staff domain models
   - Availability calculation
   - Booking status transitions
   - Mock data and adapters
   - Domain tests

3. **M1-C / Issue #6 — Booking, Staff & Integration**
   - Customer booking flow
   - Staff prototype
   - Domain integration
   - Final M1 validation

Coordination: Issue #7  
Final Integration Gate: Issue #8  
Detailed plan: `docs/M1-THREE-WINDOW-PLAN.md`  
Continuity: `docs/CONTINUITY-PROTOCOL.md`

M1 exit criteria:

- A0 `BOOTSTRAP_READY` recorded
- B0 `DOMAIN_CONTRACT_READY` recorded
- C0 `UI_INTEGRATION_READY` recorded
- Typecheck, lint, tests and production build pass after integration
- Mobile-first Mock booking flow is usable
- Staff Mock workflow is usable
- No real provider, payment, customer data or secret is connected
- README and Task Log reflect the reproducible local state

Status: **Active**

## Phase 2 — Brand Content

- Add approved logo, photography, copy, real services, staff profiles, prices, address, and hours
- Finalize design tokens

Starts after M1 Integration Gate passes.

## Phase 3 — Booking Provider Evaluation and Integration

- Compare providers against the approved requirements
- Owner selects provider
- Implement provider adapter
- Test booking, reschedule, cancellation, multi-staff availability, and notifications

## Phase 4 — Calendar and Apple Ecosystem

- Define Google Calendar ownership and per-staff calendar structure
- Implement calendar sync
- Validate busy-time blocking
- Test iPhone and Apple Watch viewing
- Prototype quick block actions

## Phase 5 — Customer History

- Add customer search, visit history, service notes, preferred barber, and audit controls
- Add authorization boundaries

## Phase 6 — Membership

Starts only after Owner approves the membership model.

## Phase 7 — Advanced Watch and Automation

- Next-customer workflow
- Block-time shortcuts
- Status updates
- Customer lookup subject to privacy constraints

## Phase 8 — LINE and Growth Automation

- LINE booking entry
- Reminders
- Review requests
- Return-visit campaigns

## Current milestone

`M1: Local UI and domain framework with mock data — ACTIVE`

Current execution sources:

- Parent Epic: Issue #2
- Workstream A: Issue #4
- Workstream B: Issue #5
- Workstream C: Issue #6
- Coordination: Issue #7
- Integration Gate: Issue #8