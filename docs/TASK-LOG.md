# DUM BARBERSHOP Platform — Task Log

最後初始化：2026-07-12（Asia/Taipei）  
目前 Milestone：M1 — Local Framework with Mock Data  
父任務：Issue #2  
協調：Issue #7  
最終整合：Issue #8

此檔案是里程碑級儀表板，不取代各工作軌的詳細日誌。各窗口日常只更新自己的 `docs/workstreams/M1-*.md`，避免多人同時衝突；Window C / Integrator 在 Gate 或合併時更新本檔。

---

## M1 Dashboard

| Workstream | Issue | Expected Branch | Status | Current Gate | Detailed Log | Primary Scope |
|---|---:|---|---|---|---|---|
| A — Platform & Public | #4 | `work/4-platform-public` | READY | A0 `BOOTSTRAP_READY` pending | `docs/workstreams/M1-A.md` | Scaffold, theme, shared UI, public pages |
| B — Domain & Engine | #5 | `work/5-domain-engine` | READY | B0 `DOMAIN_CONTRACT_READY` pending | `docs/workstreams/M1-B.md` | Models, mock booking engine, adapters, tests |
| C — Booking & Staff | #6 | `work/6-booking-staff` | READY | C0 `UI_INTEGRATION_READY` pending | `docs/workstreams/M1-C.md` | Booking flow, staff UI, integration |
| M1 Integration Gate | #8 | integration branch decided at Gate | BLOCKED_DEPENDENCY | Waiting for A/B/C PRs | This file + Issue #8 | Merge, validate, docs, final M1 PR |

---

## Required Gate Evidence

### A0 — BOOTSTRAP_READY

- Commit SHA:
- PR:
- Install command:
- Dev command:
- Typecheck:
- Lint:
- Build:

### B0 — DOMAIN_CONTRACT_READY

- Commit SHA:
- PR:
- Models exported:
- Booking engine entry points:
- Adapter ports:
- Tests:

### C0 — UI_INTEGRATION_READY

- Commit SHA:
- PR:
- Booking flow status:
- Staff prototype status:
- Domain integration status:
- UI checks:

### M1 — FINAL_VALIDATION

- Integration commit:
- Final PR:
- Typecheck:
- Lint:
- Tests:
- Production build:
- Mobile smoke test:
- Secret / real-data check:
- README updated:
- Remaining limitations:

---

## Merge Order

1. Workstream A
2. Workstream B
3. Workstream C after syncing A + B
4. Issue #8 final integration and validation

A and B may swap order if their PRs are independent and conflict-free. C must integrate the current contracts rather than introducing duplicates.

---

## Current Owner Decisions Blocking M1

None. M1 uses Mock Data and disabled placeholders for all reserved business rules.

Any new Owner decision request must be recorded in the relevant Issue and `docs/DECISIONS.md`; it should block only the affected portion, not unrelated work.

---

## Log Update Rules

- Each window updates only its own detailed log during normal work.
- Each Gate must be recorded in the related Issue comment with a commit SHA.
- Integrator updates this dashboard after a Gate, PR merge, or final validation.
- A status without a remote Commit / PR is not considered durable progress.
- Chat messages never override this file or the Issues.