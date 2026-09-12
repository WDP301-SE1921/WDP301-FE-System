# Security & Permissions

- Login account = parent only. Never add a student-facing login form or student JWT/session type.
- Route guards per role: a `(manager)` route must 403 for a teacher/parent session, and vice versa — check this on the server (layout/middleware), not just by hiding UI.
- A parent session must only ever be able to fetch data scoped to their own `StudentProfile` records — never trust a `studentProfileId` from the client without checking it belongs to the authenticated parent.
- Manager can never see another center's data — moot at single-tenant scope today, but don't hardcode assumptions that would make multi-tenant impossible to add later without a rewrite.
- Never log or display a full activation link/token in an error message or console log — it's a one-time credential.
