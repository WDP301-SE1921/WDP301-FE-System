# Production report publishing

**Goal:** Every completed production test run publishes a stable online report URL, prints the link and exits. No local report server or automatic browser opening. Pulling the frontend plus one private `.env` is sufficient to run it.

**Approach:** Render Playwright HTML from the recorded JSON using the installed reporter. Private evidence remains on the runner. Public reports keep original case outcomes/durations and production links, removing credentials, request logs, private attachments and error bodies. Store profiles separately on `gh-pages`, keeping the full report as the default page. Use GitHub Pages and the existing Git login; CI requests a Pages build explicitly. Keep source changes reviewable through a PR.

- [x] Test and implement recorded-result rendering and public data allowlisting; restore the saved 96-case report without running tests.
- [x] Test and implement publication to a report-only branch, with profile isolation and conflict-safe pushes.
- [x] Publish after CLI tests, print the online URL and exit without a local report server; skip publication for CI/UI/list, retain the test exit code.
- [x] Enable Pages, publish the existing full results and verify the online URL and native report contents.
- [ ] Update CI/private environment setup and team instructions, review, verify, fetch/merge remote changes, commit/push and integrate the PR.

Private `.env`, auth, raw JSON and original evidence stay outside Git/Pages. Do not reset or rerun production business data just to regenerate a report.
