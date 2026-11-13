# Full-system checks and production verification

- [x] Read the UI, route, API and environment contracts across four repositories.
- [x] Keep local business tests on the dedicated MySQL 3308 database.
- [x] Prepare a separate, explicitly targeted production Playwright configuration. Keep credentials and sessions in an ignored directory.
- [x] Inventory every source route, exercise static and dynamic pages, guest redirects and role denials.
- [x] Check every deployed protected API operation denies unauthenticated requests; check authorized reads and record each result.
- [x] Exercise the production business flow using only uniquely named synthetic records. Keep a cleanup manifest; do not modify existing classes, grades, schedules, enrollments or account settings.
- [x] Verify real AI text, actual image/PDF reading and SMTP; distinguish provider checks, application pipeline and inbox delivery.
- [x] Consolidate repeated form controls into the shared UI and correct observed layout defects.
- [x] Add regressions for reproduced defects, fix the source, and rerun relevant checks.
- [x] Run all available repository test suites and required build/lint/type checks.
- [x] Run a final visible Playwright suite, preserve the HTML report and evidence, and document coverage and remaining deployment limits.

Production writes are limited to this test run's own marked records. The user has explicitly authorized deployment, commit and push after pulling and merging the latest code. Use the existing deployment CI, wait for readiness, and rerun the production suite with a fresh AI task before reporting production success. See `e2e/system/RESULTS.md` for local verification and the private production HTML report for deployment verification.
