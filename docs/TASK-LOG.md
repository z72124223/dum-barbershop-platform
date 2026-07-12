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
| Codex — Implementation | #14 | `codex/14-m1-platform` | READY | Existing scaffold imported; `SCAFFOLD_MIGRATED` pending | `docs/workstreams/CODEX.md` | Complete code, engine, UI, tests and integration |

## Existing Codex code handoff

The former Issue #4 branch produced valid code before the two-role model replaced the three-window workflow.

- Former branch: `work/4-platform-public`
- Consolidated Codex branch created from it: `codex/14-m1-platform`
- Imported branch HEAD: `f4bbed09fa905e079478b0b9fe07506aa0ea35b3`
- Last good code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Package manager: pnpm 11.7.0
- Existing install / typecheck / lint / test / build: PASS
- Existing public routes: `/`, `/about`, `/barbers`, `/contact`, `/membership`, `/policies`, `/services`, `/works`
- Required next action: merge latest `main` into `codex/14-m1-platform`, preserve code, keep latest governance files, re-run checks

The former Issue #5 branch contains only claim / journal setup and no application or Domain code. Issue #6 did not begin. There is no additional code to migrate from them.

## Codex implementation gates

### 0. SCAFFOLD_MIGRATED

- Source code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Consolidated branch: `codex/14-m1-platform`
- Latest governance main to merge: `2e0f1f0eb95c713f92e456f76cfa4ae69d68cfd0`
- Merge commit:
- Install after merge:
- Typecheck after merge:
- Lint after merge:
- Tests after merge:
- Build after merge:

### 1. DOMAIN_READY

- Commit SHA:
- Models exported:
- Availability engine:
- Status transition API:
- Adapter ports / Mock repositories:
- Tests:

### 2. PUBLIC_SITE_READY

- Inherited public code commit: `20004c615876c3beb7110bec2e0a97764c21735a`
- Verification / refinement commit:
- Public routes:
- Shared UI / tokens:
- Mobile navigation:

### 3. BOOKING_STAFF_READY

- Commit SHA:
- Booking flow:
- Staff Prototype:
- Domain integration:
- Error / empty / loading states:

### 4. M1_VALIDATION_READY

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
- Existing scaffold handoff reviewed:
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

1. Codex merges current `main` into the inherited `codex/14-m1-platform` branch and records `SCAFFOLD_MIGRATED`.
2. GPT confirms the implementation baseline and QA checklist in Issue #13.
3. Codex completes Domain, Booking / Staff and full M1 validation in Issue #14.
4. Codex opens a Draft PR and records evidence.
5. GPT reviews the PR and creates concrete review comments / defects.
6. Codex resolves findings and re-runs checks.
7. GPT records acceptance and updates Roadmap / Task Log.
8. Approved PR merges into `main`.

GPT work does not need to block Codex migration or implementation when Git requirements are already sufficient.

## Current Owner decisions blocking M1

None. M1 uses fictional Mock Data and disabled placeholders for unresolved business policies.

## Durable progress rules

- A status without a Git Commit, pushed branch, Issue checkpoint or PR is not durable progress.
- GPT updates its own log and Issue #13.
- Codex updates its own log and Issue #14.
- Before quota exhaustion or task closure, record Last good commit, Exact next action, resume steps and checks.
- Chat messages never override this file or GitHub Issues.

## Superseded execution model

The previous three-workstream Issues #4–#8 and `docs/M1-THREE-WINDOW-PLAN.md` are historical only. Their usable code has been explicitly migrated as described above.