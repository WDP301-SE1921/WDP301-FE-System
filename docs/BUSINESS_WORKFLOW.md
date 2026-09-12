# Business Workflow

## Roles
- **Manager** (Web) — confirms payment, assigns teachers, edits fixed schedules. Only role that can do these.
- **Teacher** (Web + Mobile) — attendance, grading (reviews AI-suggested scores before publishing), reports.
- **Parent** (Mobile) — one account, manages one or more children (`StudentProfile`). No separate student account.

## A. Registration + payment + linking
- **A1 (first child)**: manager enters child + parent info → confirms payment → `Payment` → `Enrollment` → one-time link (7 days) → receipt → email → parent creates account via the link → `StudentProfile` created.
- **A2 (additional child)**: same, but parent logs into their existing account via the link → new `StudentProfile` only.
- **A3 (additional subject)**: manager picks the existing `StudentProfile` → new `Payment` + `Enrollment` only.

## B. Attendance
Teacher marks `present | absent | made_up | excused` per session → attendance rate recalculates immediately → email to parent.

## C. Makeup class (học bù)
Parent reports an absence → manager marks `absent` → finds a replacement session (same program + lesson, future, has capacity) → assigns → attended → original becomes `made_up`; no-show → stays `absent`.

## D. Fixed schedule change
Manager moves a child to a different class (same program, different schedule, has capacity) permanently — history is kept.

## E. Long-term leave
Manager sets a date range → sessions in range auto-`excused`, not counted toward the required total → child resumes normally after the range ends.

## F. Drop a subject / leave the center
Ends the relevant `Enrollment`(s). History is kept either way; re-enrolling reuses the existing `StudentProfile`.

## G. AI grading
Child submits (via parent's session) → AI scores it as a suggestion → teacher reviews/edits → approves → only then does the parent/child see it. AI never auto-publishes.

## H. Reports
Teacher picks class/student + date range → system aggregates scores + attendance → AI compiles → exports Excel/PDF. Teacher-only, never auto-sent to parents.
