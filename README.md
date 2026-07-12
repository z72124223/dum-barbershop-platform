# DUM BARBERSHOP Platform

DUM BARBERSHOP website, booking and multi-staff operation platform.

## Repository authority

This private repository is the project's **single source of truth** for product decisions, architecture, implementation, review, and release history.

Chat messages and local notes are not authoritative until they are recorded in this repository.

## Required reading

All contributors and AI workers must read, in order:

1. [`docs/PROJECT-CONSTITUTION.md`](docs/PROJECT-CONSTITUTION.md)
2. [`docs/DECISIONS.md`](docs/DECISIONS.md)
3. [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/ROADMAP.md`](docs/ROADMAP.md)
6. [`docs/WORK-PROTOCOL.md`](docs/WORK-PROTOCOL.md)
7. [`docs/LOCAL-ENGINE.md`](docs/LOCAL-ENGINE.md)
8. [`AGENTS.md`](AGENTS.md)

## Current state

The project is in **Phase 1 — Local Framework**. Issue #2 provides a local, responsive Next.js prototype with fictional mock data only.

Included in M1:

- dark fixed brand theme and centralized design tokens
- public page shells for home, services, barbers, works, booking, membership, about, contact, and policies
- interactive six-step mock booking flow
- staff prototype for today/full-day schedule, next customer, barber filtering, customer search, block time, booking details, and completion
- typed domain models and replaceable adapter contracts

No production booking provider, payment, membership logic, real customer data, notification, or calendar synchronization is connected.

## Local requirements

- Node.js `>=20.9.0`
- pnpm `11.7.0` (Corepack may be used to install the declared package manager)

## Install and run

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The `.env.local` file is optional for M1 because mock mode is the default. Never place credentials or real customer data in committed files.

## Validation

```bash
pnpm typecheck
pnpm lint
pnpm build
```

There are no database migrations or seed commands in M1. Fixtures are fictional in-memory data in `src/data/mock-data.ts`.

## Main routes

- `/` — public home
- `/services`, `/barbers`, `/works` — public catalog shells
- `/booking` — interactive mock booking
- `/membership` — reserved membership placeholder
- `/about`, `/contact`, `/policies` — information and decision-safe policy shells
- `/staff` — local staff operations prototype

## Architecture boundaries

- `src/domain` — typed domain models and centralized booking state transitions
- `src/adapters` — booking, calendar, notification, and membership provider contracts plus mock implementations
- `src/data` — fictional local fixtures
- `src/app` — customer and staff application surfaces

The M1 UI never calls a production service. External providers must be introduced behind adapters after an approved decision and dedicated Issue.

## Repository

- Owner: `z72124223`
- Visibility: Private
- Default branch: `main`
- Implementation: local environment
- Work unit: GitHub Issue → feature branch → draft PR → review → merge
