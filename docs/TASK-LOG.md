# DUM BARBERSHOP Platform — Task Log

最後更新：2026-08-12（Asia/Taipei）
目前 Milestone：MVP3 minimum production go-live
父任務：Issue #31
目前實作：Issue #35

本檔案是里程碑級儀表板。詳細續接資訊位於角色日誌：

- GPT：`docs/workstreams/GPT.md`
- Codex：`docs/workstreams/CODEX.md`

## Current Dashboard

| Role | Issue | Expected Branch | Status | Current Gate | Detailed Log | Primary Scope |
|---|---:|---|---|---|---|---|
| GPT — Product / QA | #13 / async review | documentation / review branch as needed | ASYNC | Non-blocking review | `docs/workstreams/GPT.md` | Specs, content, QA and later production decisions |
| Codex — Implementation | #35 | `agent/35-cross-device-schedule` | VALIDATED / DRAFT_PR_PENDING | `MVP3_CROSS_DEVICE_SCHEDULE` | `docs/workstreams/CODEX.md` | Same-site schedule HTTP/UI, privacy notice and controlled anonymization |

Current MVP3 gates:

- `MVP1_MERGED` — PR #28 / merge `7e180ed3b215a89be14f7c591e2cc08c394b296e`
- `MVP2_MERGED` — PR #30 / merge `f7bc974df32dc947969b6184a0e4454a143e6722`
- `FINAL_MAIN_VALIDATED` — typecheck, lint, 50/50 tests and production build PASS
- `MVP3_DECISION_BASELINE` — PR #38 merged at `e6f65bd8c58c3356b663c974926c26d779ace4a3`; Issue #32 closed
- `MVP3_SHARED_DATA` — Issue #33 merged through PR #40
- `MVP3_FORMAL_AUTH` — Issue #34 merged through PR #41 at `bba3797c4efafb60005de8dff1b83bf37466054c`
- `MVP3_CROSS_DEVICE_SCHEDULE` — Issue #35 validated locally; Draft PR pending
- #36–#37 — deployment hardening and explicit GO remain pending

Prior completed Blueprint gates:

- `BOOKING_LIFECYCLE_COMPLETE`
- `STAFF_OPERATIONS_COMPLETE`
- `INTEGRATION_SIMULATION_COMPLETE`
- `PUBLIC_EXPERIENCE_COMPLETE`
- `BLUEPRINT_BUILD_COMPLETE`

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
- Draft PR: https://github.com/z72124223/dum-barbershop-platform/pull/21
- Merge: `234ffd1c0635e02c0008c681a54787ec360ec21c`

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

Completed: Draft PR #21 was validated with no Required review findings and squash-merged to `main` at `234ffd1c0635e02c0008c681a54787ec360ec21c`.

Next: continue only through future scope-limited Issues; production activation still requires approved decisions, accounts and credentials.

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
