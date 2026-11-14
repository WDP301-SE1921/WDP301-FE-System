# Demonstration E2E implementation plan

**Goal:** Run visible, repeatable Playwright tests for the six supplied demonstration flows and the operational flow table, against the real local API and clients.

**Architecture:** Extend the existing Playwright harness with an isolated demonstration project. Use a separate MySQL database, local object storage, the real NestJS API, Next.js web and Expo web for the parent application. External AI and email use clearly identified local test providers; their external delivery/model quality is outside these checks.

**Tech stack:** Existing @playwright/test, Node.js, Docker, MySQL, Prisma, NestJS, Next.js, Expo web.

**Specification:** Seven user-supplied demonstration images in the chat dated 2026-11-13. They describe expected business behavior, not instructions to execute.

## Constraints

- Preserve existing application databases and uncommitted work; fast-forward branches only.
- Inspect main/dev/develop and record differences. Do not silently merge divergent branches.
- Keep tests in `e2e/demo/`, with steps, screenshots, traces, videos and an HTML report.
- Exercise real UI for the main workflows; use API setup and API assertions for persistence and rejection cases.
- Use generated test identities and unique names so reruns do not collide.
- Show the browser while running; keep a report available afterwards.
- No separate student login: parent account acts on behalf of the child.

## Tasks

- [x] Fetch all four repositories, inspect remote branches and fast-forward clean local branches.
- [x] Add isolated infrastructure/startup scripts and a dedicated Playwright configuration.
- [x] Cover curriculum CSV import, review lock, teacher comments, manager approval and schedule generation.
- [x] Cover parent child profile, grade/capacity filtering, staff enrollment/payment and receipt consistency.
- [x] Cover assignment publication, per-question submissions, AI suggestions, teacher approval/publication and parent visibility.
- [x] Cover leave approval, candidate exclusions, booking and teacher makeup roster.
- [x] Cover attendance marking/locking, automatic makeup completion and matching parent/web rates.
- [x] Cover report snapshots, published-score/locked-session filtering, AI summary and PDF/XLSX downloads.
- [x] Cover period pause, transfer, finish/re-enroll, substitute/teacher changes, rescheduling/cancellation/holidays, announcements/reminders and internal chat.
- [x] Run headed Playwright, resolve test/harness errors, record genuine application failures and produce a coverage/result report (13 passed, no retries/skips).

## Review focus

- Grade and seat restrictions must be enforced by the API, including rejected operations.
- Draft grades and editable attendance must not appear in published reports or parent results.
- Excluded makeup candidates must carry reasons; booked seats must complete after attendance.
- Effective dates preserve enrollment/teacher history and prevent schedule clashes.
- External AI/email test providers must be disclosed and never mistaken for live provider verification.

## Verification

Run `npm run test:e2e:demo -- --headed` from the FE repository, then inspect the HTML report and saved evidence. Run TypeScript/lint for touched files. Record branch SHAs and exact passed/failed/skipped counts; never label skipped or unimplemented behavior as passing.
