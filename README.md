# DUM BARBERSHOP Platform

DUM BARBERSHOP website, booking and multi-staff operation platform.

## Repository authority

This private repository is the project's **single source of truth** for product decisions, architecture, implementation, review and release history.

Chat messages and local notes are not authoritative until they are recorded in this repository.

## Required reading

All contributors and AI workers must begin with [`AGENTS.md`](AGENTS.md), then follow its required reading order.

Core documents:

1. [`docs/PROJECT-CONSTITUTION.md`](docs/PROJECT-CONSTITUTION.md)
2. [`docs/DECISIONS.md`](docs/DECISIONS.md)
3. [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
5. [`docs/ROADMAP.md`](docs/ROADMAP.md)
6. [`docs/TWO-ROLE-WORK-MODEL.md`](docs/TWO-ROLE-WORK-MODEL.md)
7. [`docs/EXECUTION-MODE.md`](docs/EXECUTION-MODE.md)
8. [`docs/WORK-PROTOCOL.md`](docs/WORK-PROTOCOL.md)
9. [`docs/CONTINUITY-PROTOCOL.md`](docs/CONTINUITY-PROTOCOL.md)
10. [`docs/TASK-LOG.md`](docs/TASK-LOG.md)

Role logs:

- [`docs/workstreams/GPT.md`](docs/workstreams/GPT.md)
- [`docs/workstreams/CODEX.md`](docs/workstreams/CODEX.md)

## Current state

The project is in **M1 — Local Framework with Mock Data**.

M1 now uses two official work roles:

| Role | Issue | Responsibility |
|---|---:|---|
| GPT | #13 | Specifications, content, Git tasks, QA and PR review |
| Codex | #14 | Complete local codebase, booking engine, UI, tests, build and integration |

- Parent Epic: Issue #2
- Codex branch: `codex/14-m1-platform`
- Task dashboard: `docs/TASK-LOG.md`

The previous three-window Issues #4–#8 are superseded and must not be used for new implementation work.

No production booking provider, payment system, membership policy, real customer database or calendar integration has been approved yet.

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

## Existing public routes

- `/` — home
- `/services` — fictional service placeholders
- `/barbers` — fictional staff placeholders
- `/works` — work-category placeholders without real customer media
- `/membership` — disabled membership placeholder
- `/about` — platform direction
- `/contact` — safe contact placeholders
- `/policies` — Owner-decision placeholders

The inherited scaffold provides these routes. Issue #14 adds the `/booking` and `/staff` experiences without replacing the existing public site.

## Continuity

GPT and Codex each maintain one durable work log. Before quota exhaustion, shutdown or handoff, the active role must update its log and leave a `CHECKPOINT` in its Issue.

Codex must also Commit and Push all recoverable code to its remote feature branch. A new Task resumes from Git and does not require previous chat context.

## Repository

- Owner: `z72124223`
- Visibility: Private
- Default branch: `main`
- Product / QA role: GPT
- Implementation: Codex local environment
- Work unit: GitHub Issue → durable log → feature branch / review → checkpoints → draft PR → review → merge
