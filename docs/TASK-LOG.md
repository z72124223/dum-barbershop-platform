# DUM BARBERSHOP Platform — Task Log

最後更新：2026-07-12（Asia/Taipei）  
目前 Milestone：M1 — Local Framework with Mock Data  
父任務：Issue #2

本檔案是里程碑級儀表板。詳細續接資訊位於角色日誌：

- GPT：`docs/workstreams/GPT.md`
- Codex：`docs/workstreams/CODEX.md`

## M1 Dashboard

| Role | Issue | Expected Branch | Status | Current Gate | Detailed Log | Primary Scope |
|---|---:|---|---|---|---|---|
| GPT — Planning & QA | #13 | documentation / review branch as needed | READY | `GPT_BASELINE_READY` pending | `docs/workstreams/GPT.md` | Specs, content, Issues, QA, PR review |
| Codex — Implementation | #14 | `codex/14-m1-platform` | READY | `SCAFFOLD_READY` pending | `docs/workstreams/CODEX.md` | Complete code, engine, UI, tests and integration |

## Codex implementation gates

### 1. SCAFFOLD_READY

- Commit SHA:
- Draft PR:
- Package manager / lockfile:
- Install:
- Dev:
- Typecheck:
- Lint:
- Build:

### 2. DOMAIN_READY

- Commit SHA:
- Models exported:
- Availability engine:
- Status transition API:
- Adapter ports / Mock repositories:
- Tests:

### 3. PUBLIC_SITE_READY

- Commit SHA:
- Public routes:
- Shared UI / tokens:
- Mobile navigation:

### 4. BOOKING_STAFF_READY

- Commit SHA:
- Booking flow:
- Staff Prototype:
- Domain integration:
- Error / empty / loading states:

### 5. M1_VALIDATION_READY

- Integration commit:
- Final Draft PR:
- Typecheck:
- Lint:
- Tests:
- Production build:
- Mobile smoke:
- Secret / real-data check:
- README updated:
- Remaining limitations:

## GPT gates

### GPT_BASELINE_READY

- Issue #14 scope reviewed:
- Blueprint coverage:
- Reserved decisions protected:
- QA checklist ready:

### GPT_PR_REVIEW_COMPLETE

- PR reviewed against Constitution / Decisions / Blueprint:
- Functional findings:
- UI / content findings:
- Security / data findings:
- Required fixes resolved:
- Acceptance recommendation:

## Work order

1. GPT confirms the implementation baseline and QA checklist in Issue #13.
2. Codex executes Issue #14 from scaffold through complete M1 validation.
3. Codex opens a Draft PR and records evidence.
4. GPT reviews the PR and creates concrete review comments / defects.
5. Codex resolves findings and re-runs checks.
6. GPT records acceptance and updates Roadmap / Task Log.
7. Approved PR merges into `main`.

GPT work does not need to block Codex startup when the Blueprint and Issue #14 are already sufficient. Both roles can proceed, but Git remains the only coordination surface.

## Current Owner decisions blocking M1

None. M1 uses fictional Mock Data and disabled placeholders for unresolved business policies.

## Durable progress rules

- A status without a Git Commit, pushed branch, Issue checkpoint or PR is not durable progress.
- GPT updates its own log and Issue #13.
- Codex updates its own log and Issue #14.
- Before quota exhaustion or task closure, record Last good commit, Exact next action, resume steps and checks.
- Chat messages never override this file or GitHub Issues.

## Superseded execution model

The previous three-workstream Issues #4–#8 and `docs/M1-THREE-WINDOW-PLAN.md` are historical only. They must not be used for new implementation work.