# Data Contracts

Keep FE types aligned with the backend's field names exactly — don't rename fields "to be cleaner" on the FE side; it just creates a mapping layer nobody asked for.

## Core entities (field names as used by the API)
- `ParentAccount`: `id`, `email` (login + notification email, unique), `phone` (contact only, not unique).
- `StudentProfile`: `id`, `parentAccountId`, `name`.
- `Enrollment`: `id`, `studentProfileId`, `subjectId`, `classId`, `months` (1–12), `status`.
- `Payment`: `id`, `enrollmentId`, `confirmedAt`, `confirmedBy` (**staff id — Nhân viên, not manager**).
- `AttendanceRecord`: `id`, `classSessionId`, `studentProfileId`, `status` (`present | absent | made_up | excused`). Now also an input to teacher compensation — exact payroll schema not yet defined; don't invent one on the FE, just don't assume this record is purely informational anymore.
- `ClassSession`: `id`, `classId`, `lessonId`, `programId`, `date`, `capacity`.
- `Program` (curriculum content, owned by Thiết kế giáo trình): `id`, `subjectId`, `gradeLevel`, `lessons` (ordered), pacing fields for "1 lesson/session, 1 test/month" — confirm exact shape with backend before building the curriculum screens.

## Rules
- Parents self-register with email/password and create child profiles in the app. Staff select an existing parent and child; payment confirmation attaches the Enrollment immediately.
- No invitation credential belongs in parent-registration forms or enrollment DTOs. Email verification and access/refresh tokens are separate authentication concerns.
- Every Zod schema in `src/lib/validators/` must use these exact field names — this is the single source of truth for shape, reused by both forms and API request typing.
- `status` fields are string unions, never numeric enums (see `.claude/rules/frontend.md` — no enums project-wide).
- Never invent a field the backend doesn't return "for convenience" — derive it in a selector/hook instead, so there's one place to fix it if the derivation logic changes.
