# Team Production Playwright Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Reuse the current clean feature checkout and preserve the existing production fixture ownership checks.

**Goal:** A teammate can install this frontend repository, configure one private `.env`, open the Production project in Playwright, and run/report tests against the existing live application.

**Architecture:** Keep the dedicated production configuration and guarded live fixture. Read secrets from `e2e/production/.env` or CI environment variables, remove sibling-repository/build dependencies, and prepare sessions before workers run. Provide separate public, read-only, live-services and full commands; writes remain explicit. Keep reports private and include direct links to the approved production web, Admin and API.

**Tech stack:** Existing Playwright, Node.js native environment-file parsing and test runner; Nodemailer as a frontend development dependency for optional real SMTP verification. Chromium is the portable default.

## Task 1 — Environment configuration and onboarding

- [x] Add failing tests for quoted `.env` values, process-variable precedence, per-role passwords, approved hosts, missing-field diagnostics and secret-free public links.
- [x] Replace JSON settings with an injectable `.env` reader and explicit profile validation; keep existing consumer fields stable.
- [x] Ship a tracked `.env.example` and an idempotent setup command; migrate this machine's private configuration without printing or committing it.
- [x] Verify configuration tests and Git exclusion of real keys.

## Task 2 — Standalone production tests

- [x] Replace the local backend AI client import with a small real-provider probe, with contract tests for payloads and error redaction.
- [x] Add Nodemailer to development dependencies; ship the tiny synthetic PDF fixture and Admin route inventory in this repository.
- [x] Remove production imports of local demo/backend/Admin builds. Retain application-side image/PDF grading and outbox verification.
- [x] Verify provider contracts, dependency installation and E2E type checks.

## Task 3 — Production project, commands and links

- [x] Add tested run profiles: public checks without credentials, read-only by default, explicit live-services/full writes.
- [x] Move network/session preparation into global setup; defer API inventory reads until test execution so list/UI discovery works on a fresh checkout.
- [x] Name the project `production`, add public-link checks/report metadata and separate UI/report commands.
- [x] Verify listing without cached runtime files, fresh-session UI/CLI startup, live public checks and the seven live-service cases; clean only the new synthetic fixture.

## Task 4 — Team handoff

- [x] Document one-time setup, private `.env` distribution, commands and direct production links in the root and production READMEs.
- [x] Record fresh verification and clarify that local report links require a report server; online report hosting depends on the user's clarification.
- [x] Run relevant contract tests, lint/format/type checks and a fresh read-only/live-services run. Review the final change, fetch new remote commits, then commit/push the tested feature branch.

## Review focus

- `--list`/UI discovery must not need old `auth.json`, OpenAPI, sibling repositories or a backend build.
- Public checks must work without secrets; missing credentials must fail before a live write.
- Provider failures, public links and reports must never print API keys, SMTP URLs or passwords.
- Each receipt must belong to the current fixture and reach `SENT`; UI startup and polling must not reuse stale sessions/results as proof.
- Cleanup must keep ownership checks and support both draft deletion and approved-unit archival.
