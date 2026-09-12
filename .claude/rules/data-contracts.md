# Data Contracts

Keep FE types aligned with the backend's field names exactly — don't rename fields "to be cleaner" on the FE side; it just creates a mapping layer nobody asked for.

## Core entities (field names as used by the API)
- `ParentAccount`: `id`, `email` (login + notification email, unique), `phone` (contact only, not unique).
- `StudentProfile`: `id`, `parentAccountId`, `name`.
- `Enrollment`: `id`, `studentProfileId`, `subjectId`, `classId`, `months` (1–12), `status`.
- `Payment`: `id`, `enrollmentId`, `confirmedAt`, `confirmedBy` (manager id).
- `ActivationLink`: `id`, `enrollmentId`, `token`, `expiresAt` (7 days), `usedAt`.
- `AttendanceRecord`: `id`, `classSessionId`, `studentProfileId`, `status` (`present | absent | made_up | excused`).
- `ClassSession`: `id`, `classId`, `lessonId`, `programId`, `date`, `capacity`.

## Rules
- Every Zod schema in `src/lib/validators/` must use these exact field names — this is the single source of truth for shape, reused by both forms and API request typing.
- `status` fields are string unions, never numeric enums (see `.claude/rules/frontend.md` — no enums project-wide).
- Never invent a field the backend doesn't return "for convenience" — derive it in a selector/hook instead, so there's one place to fix it if the derivation logic changes.
