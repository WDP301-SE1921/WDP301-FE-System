# Business Workflow

## Roles (5, up from the original 3)
- **Quản lý trung tâm** (Web) — CRUD staff/teacher/parent records, dashboard (revenue, counts), creates classes (subject + grade + program + room + fixed schedule), assigns a teacher to an existing fixed class. The "admin: có tất cả" line in the spec describes this role's overall authority, not a separate 6th role.
- **Thiết kế giáo trình** (Web, **new**) — authors per-subject curriculum content (Toán/Lý/Hóa/Sinh, based on textbooks), sets pacing: 1 lesson per session, 1 test per month.
- **Nhân viên** (Web, **new**) — day-to-day admissions/operations: student registration (see A below), payment confirmation, schedule changes, makeup scheduling, permanent/long-term leave.
- **Giáo viên** (Web — see platform note) — attendance (now also feeds teacher compensation), homework, AI-grading review/approval, reports, confirms the fixed schedule for an assigned class.
- **Phụ huynh** (Mobile) — self-registers their own account and creates each child's `StudentProfile` themselves in the app. No separate student account.

**Platform note:** the role list says "Giáo viên — Web" only; §1.3's own heading still says "(Web + Mobile)". Treated as Web-only here — flag if that's not intended.

## A. Registration + payment (no activation link — removed entirely)
- **No account yet**: at the counter, staff tells the parent to download the app → parent self-registers (email + password) → parent creates the child's `StudentProfile` themselves. Staff isn't involved in this part.
- **Shared step, every case**: staff types the parent's email into a debounced search (suggestions after 1–2 characters) → picks the account → sees that account's children → picks the right one → picks subject/class (against the class's fixed schedule) → confirms payment → `Enrollment` is created and attached immediately. No link, no extra parent confirmation — the parent is standing at the counter.

## B. Attendance (Giáo viên)
Teacher marks `present | absent | made_up | excused` per session → attendance rate recalculates immediately → email to parent → **also now an input to teacher compensation** (payroll logic TBD with backend).

## C. Makeup class / schedule changes (owned by Nhân viên)
Parent reports an absence → staff marks `absent` → finds a replacement session (same program + lesson, future, has capacity) → assigns → attended → original becomes `made_up`; no-show → stays `absent`. Permanent schedule changes and long-term leave follow the same staff ownership.

## D. Curriculum content (Thiết kế giáo trình)
Designs each subject's lesson sequence from the textbook, sets the 1-lesson-per-session / 1-test-per-month cadence. Does not touch class scheduling or rooms.

## E. Class creation (Quản lý trung tâm)
Choose subject + grade + program + room + fixed schedule, assign a teacher to an existing fixed class slot.

## F. AI grading (Giáo viên)
Child submits (via parent's session) → AI scores it as a suggestion → teacher reviews/edits → approves → only then does the parent/child see it. AI never auto-publishes.

## G. Reports (Giáo viên)
Picks class/student + date range → system aggregates scores + attendance → AI compiles → exports Excel/PDF. Teacher-only, never auto-sent to parents.
