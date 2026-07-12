# DUM BARBERSHOP Platform

DUM BARBERSHOP website, booking and multi-staff operation platform.

## Repository authority

This private repository is the project's **single source of truth** for product decisions, architecture, implementation, review, and release history.

Chat messages and local notes are not authoritative until they are recorded in this repository.

## Required reading

All contributors and AI workers must begin with [`AGENTS.md`](AGENTS.md), then follow its required reading order.

Core documents:

1. [`docs/PROJECT-CONSTITUTION.md`](docs/PROJECT-CONSTITUTION.md)
2. [`docs/DECISIONS.md`](docs/DECISIONS.md)
3. [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/ROADMAP.md`](docs/ROADMAP.md)
6. [`docs/EXECUTION-MODE.md`](docs/EXECUTION-MODE.md)
7. [`docs/WORK-PROTOCOL.md`](docs/WORK-PROTOCOL.md)
8. [`docs/LOCAL-ENGINE.md`](docs/LOCAL-ENGINE.md)

M1 coordination:

- [`docs/M1-THREE-WINDOW-PLAN.md`](docs/M1-THREE-WINDOW-PLAN.md)
- [`docs/CONTINUITY-PROTOCOL.md`](docs/CONTINUITY-PROTOCOL.md)
- [`docs/TASK-LOG.md`](docs/TASK-LOG.md)
- [`docs/workstreams/M1-A.md`](docs/workstreams/M1-A.md)
- [`docs/workstreams/M1-B.md`](docs/workstreams/M1-B.md)
- [`docs/workstreams/M1-C.md`](docs/workstreams/M1-C.md)

## Current state

The project is in **M1 — Local Framework with Mock Data**.

M1 is split across three independent Codex / local work windows:

| Window | Issue | Responsibility |
|---|---:|---|
| A | #4 | Platform scaffold, dark design system, shared UI, public pages |
| B | #5 | Domain models, mock booking engine, adapters, tests |
| C | #6 | Booking flow, staff prototype, integration and validation |

- Parent Epic: Issue #2
- Coordination: Issue #7
- Final Integration Gate: Issue #8

No production booking provider, payment system, membership policy, real customer database, or calendar integration has been approved yet.

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

The local environment file is optional during M1. Never add credentials, provider tokens or real customer data.

## Validation commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Window A public routes

- `/` — home
- `/services` — fictional service placeholders
- `/barbers` — fictional staff placeholders
- `/works` — work-category placeholders without real customer media
- `/membership` — disabled membership placeholder
- `/about` — platform direction
- `/contact` — safe contact placeholders
- `/policies` — Owner-decision placeholders

The `/booking` and `/staff` feature routes belong to Window C and are not implemented by Window A.

## Continuity

Every work window must maintain a remote branch and durable work log. Before quota exhaustion, shutdown, or handoff, it must Commit, Push, update its `docs/workstreams/*.md` file and leave a `CHECKPOINT` comment in its Issue.

A new window resumes from Git and does not require the previous chat context.

## Repository

- Owner: `z72124223`
- Visibility: Private
- Default branch: `main`
- Implementation: Codex local environment / local worktrees
- Work unit: GitHub Issue → dedicated branch → checkpoints → draft PR → review → merge
