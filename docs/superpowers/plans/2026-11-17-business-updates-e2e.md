# Business updates and E2E implementation plan

**Goal:** Cover the new WDP business flows and close integration gaps, leaving test execution to the user.

**Architecture:** Extend the existing real-API Playwright system suite and its guarded local MySQL/MinIO fixtures. Use the current shared web/mobile components and backend authorization rules; no new libraries or visual redesign.

**Specification:** `docs/BUSINESS_FIXES_2026-11-15.md`, the latest report/grading/curriculum changes, and mobile `develop` release 1.1.0. The user explicitly chose to keep `feat/push-notifications` separate.

## Constraints and rulings

- Do not execute tests, launch browsers, mutate databases, send emails/AI requests, deploy, commit or push in this preparation pass.
- Static checks and Prisma client generation are allowed; they do not execute test bodies or apply migrations.
- All new business E2E writes must stay behind `World`'s dedicated `127.0.0.1:3308/edugrade_e2e` guard.
- Preserve historical reports. New cases are **not run**; the 14/11 results are not evidence for these changes.
- Retain the existing Maia / mobile design tokens and shared controls.
- Baselines pulled: FE `aac59f5`, BE `e7cbfb6`, ADMIN `97c59a7`, mobile `f6d743b`.

## Tasks

- [x] Pull and compare all four repositories; inspect the unmerged popup branch without merging it.
- [x] Add typed billing fixtures and E2E for Tết pricing, cash/bank methods, shift totals, refund approval/rejection, parent visibility and legacy receipts.
- [x] Add E2E for manual extensions at full capacity, pause credit/rollback and cancellation credit without changing bills.
- [x] Add E2E for parent leave submission/retry and same-day attendance corrections, including role/window/excused constraints.
- [x] Add E2E for detailed report snapshots, question-scoped attachments, public center information and curriculum displays.
- [x] Correct parent refund visibility at the API boundary, reject blank business reasons, and serialize attendance correction with make-up booking.
- [x] Complete inline load-error recovery for mobile leave and payment-method gating in the web confirmation dialog.
- [x] Preserve and restore payment attempts with the new method field and legacy immutable payloads; cover recovery through the actual confirmation UI.
- [x] Defer public landing data reads to request time so API unavailability during image builds does not freeze empty catalog/contact content.
- [x] Update older specs affected by the new payment method and provide a focused command plus a coverage checklist.
- [x] Generate types; run only type, lint, formatting and diff checks; record that runtime tests remain pending.
- [x] Read-only final review; prepare the handoff and run commands in `e2e/system/UPDATES-2026-11-17.md`.

## Handoff status

Implementation and static checks are prepared. No test body, browser/app session, database migration/seed, real provider call, build, commit, push or deployment was executed in this pass. The user will run the 16 tagged update scenarios or the complete system suite. Historical reports remain unchanged.

## Continuation on 18 November

The user explicitly requested test execution and commit/push. Mobile develop was refreshed to `d0c540e`, including the upstream popup merge. The new popup E2E brings the update subset to 17 cases. The full headed system run passed 113/113; backend unit/adapter 594/594, backend integration 113/113, mobile 680/680, web logic 63/63 plus 9/9 regressions, and Admin 61/61 passed. All four remotes were fetched again before committing, with no additional source commits missing. See `e2e/system/RESULTS-2026-11-18.md` for evidence, fixes and limits.

## Review focus

1. Pending/rejected refunds must stay out of all parent financial responses, including legacy raw registration routes.
2. A failed leave lookup must not offer a duplicate request as if no request existed.
3. An attendance correction and a make-up booking must not leave a present original with an active replacement.
4. Tests must tolerate repeated local runs and use receipt/student IDs rather than unrelated seeded records.
5. Tests around dates must use Vietnam calendar dates and independent expected monetary values.
