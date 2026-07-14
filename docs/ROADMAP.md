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

Status: **Active**

## Phase 2 — Brand Content

- Add approved logo, photography, copy, real services, staff profiles, prices, address and hours
- Finalize design tokens

Starts after M1 validation and PR merge. GPT content / QA review may continue asynchronously and does not block safe placeholder implementation.

## Phase 3 — Booking Provider Evaluation and Integration

- GPT compares providers against approved requirements
- Owner selects provider
- Codex implements provider adapter
- Test booking, reschedule, cancellation, multi-staff availability and notifications

## Phase 4 — Calendar and Apple Ecosystem

- Define Google Calendar ownership and per-staff calendar structure
- Implement calendar sync
- Validate busy-time blocking
- Test iPhone and Apple Watch viewing
- Prototype quick block actions

## Phase 5 — Customer History

- Add customer search, visit history, service notes, preferred barber and audit controls
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

`M1: Local UI and domain framework with Mock Data — ACTIVE`

Current execution sources:

- Parent Epic: Issue #2
- GPT work: Issue #13
- Codex implementation: Issue #14
- Task dashboard: `docs/TASK-LOG.md`

Issues #4–#8 and the three-window plan are superseded historical records.

## Continuous implementation policy

- Codex continues through Blueprint phases until all technically implementable non-production scope is build-complete.
- Each implementation unit still requires a GitHub Issue, feature branch, checks, Commit, Push and PR.
- Owner manual review is not a blocking gate for validated non-production implementation or merge.
- Real brand facts, prices, staff identities, policies, provider choices, credentials and production actions remain protected decisions.
- When a phase depends on those items, Codex implements the interface, Mock / disabled adapter, states, tests and documentation, records `TODO(owner-decision)`, and continues the remaining phases.
- `Build-complete` does not mean production-ready. Production activation remains a separately verified milestone.
