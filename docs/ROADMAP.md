# DUM BARBERSHOP Platform — Roadmap

## Phase 0 — Foundation

- Establish Git as the single source of truth
- Add project constitution, blueprint, architecture, decisions, work protocol, and local engine rules
- Define ownership and multi-worker rules

Exit criteria:
- Core documents exist on `main`
- Work begins only from GitHub Issues

## Phase 1 — Local Framework

- Create the local application skeleton
- Implement the dark design system
- Add the public site page structure
- Add mock booking flow
- Add mock staff day view
- Add membership placeholder
- Add typed domain models and adapter boundaries

No production integrations are allowed in this phase.

## Phase 2 — Brand Content

- Add approved logo, photography, copy, real services, staff profiles, prices, address, and hours
- Finalize design tokens

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

`M0: Repository governance baseline`

Next implementation milestone after approval:

`M1: Local UI and domain framework with mock data`
