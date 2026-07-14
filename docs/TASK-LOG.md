# DUM BARBERSHOP Platform — Task Log

最後更新：2026-07-14（Asia/Taipei）
目前 Milestone：Blueprint local preview — Build-Complete validation
父任務：Issue #2
目前實作：Issue #20

本檔案是里程碑級儀表板。詳細續接資訊位於角色日誌：

- GPT：`docs/workstreams/GPT.md`
- Codex：`docs/workstreams/CODEX.md`

## Current Dashboard

| Role | Issue | Expected Branch | Status | Current Gate | Detailed Log | Primary Scope |
|---|---:|---|---|---|---|---|
| GPT — Product / QA | #13 / async review | documentation / review branch as needed | ASYNC | Non-blocking review | `docs/workstreams/GPT.md` | Specs, content, QA and later production decisions |
| Codex — Implementation | #20 | `codex/20-blueprint-build-complete` | IN_PROGRESS | Final PR / merge | `docs/workstreams/CODEX.md` | Blueprint local preview, tests, build and integration simulation |

Current completed gates:

- `BOOKING_LIFECYCLE_COMPLETE`
- `STAFF_OPERATIONS_COMPLETE`
- `INTEGRATION_SIMULATION_COMPLETE`
- `PUBLIC_EXPERIENCE_COMPLETE`
- `BLUEPRINT_BUILD_COMPLETE` pending final PR / merge record

## Historical M1 code handoff

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

## Issue #20 implementation gates

### BOOKING_LIFECYCLE_COMPLETE

- Commit: `dce490d`
- Customer lookup, cancellation request and reschedule preview
- Two-way reschedule lineage, safe waitlist ranking and provider-neutral Booking / Identity boundaries

### STAFF_OPERATIONS_COMPLETE

- Commit: `48cbec0`
- Day / week, queue, customer, schedule and role previews
- Domain-controlled manual status, no-show, cancel and reschedule operations

### INTEGRATION_SIMULATION_COMPLETE

- Commit: `e4b6dfa`
- Provider health, idempotency, conflict, timeout, partial failure and bounded retry
- Calendar sync metadata, disabled outbound delivery and Apple-style quick actions

### PUBLIC_EXPERIENCE_COMPLETE

- Commit: `f217e2d`
- Complete homepage information architecture and public route previews
- Desktop / mobile browser checks with no console errors or document overflow

### BLUEPRINT_BUILD_COMPLETE

- Frozen install: PASS
- Typecheck: PASS
- Lint: PASS
- Tests: 36 / 36 PASS
- Production build: PASS
- HTTP routes: 16 / 16 PASS including manifest and icon
- Secret / real-data scan: PASS
- README / Roadmap / Task Log: updated
- Draft PR / merge: pending final checkpoint

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

## Final work order

1. Commit and push final documentation / validation evidence.
2. Open the Issue #20 Draft PR.
3. Confirm no unresolved Required review findings and merge the validated non-production PR.
4. Record merge SHA and `BLUEPRINT_BUILD_COMPLETE` in Issue #20 and the Codex log.
5. Continue only through future scope-limited Issues; production activation still requires approved decisions, accounts and credentials.

## Current Owner decisions blocking build-complete

None. Real content, policies, providers, credentials and deployment block only production activation; the local preview uses fictional, Mock or disabled behavior.

## Durable progress rules

- A status without a Git Commit, pushed branch, Issue checkpoint or PR is not durable progress.
- GPT updates its own log and Issue #13.
- Codex updates its own log and active implementation Issue (#20 for this milestone).
- Before quota exhaustion or task closure, record Last good commit, Exact next action, resume steps and checks.
- Chat messages never override this file or GitHub Issues.

## Superseded execution model

The previous three-workstream Issues #4–#8 and `docs/M1-THREE-WINDOW-PLAN.md` are historical only. Their usable code has been explicitly migrated as described above.
