# Data Contracts

Human-readable version of `.claude/rules/data-contracts.md`.

## What changed
- No `ActivationLink` entity — account and profile creation are fully self-service by the parent in the app; staff never generate or send a link/code.
- `Payment.confirmedBy` is a **staff (Nhân viên)** id, not a manager id.
- `AttendanceRecord` is no longer purely informational — it now feeds teacher compensation. The exact payroll schema isn't defined yet; don't build FE assumptions around a specific shape until backend confirms it.
- A new `Program`-adjacent curriculum shape (owned by Thiết kế giáo trình) needs confirming with backend before building those screens — subject, grade level, ordered lessons, and the 1-lesson/1-test pacing.

## Core entities
`ParentAccount`, `StudentProfile`, `Enrollment`, `Payment`, `AttendanceRecord`, `ClassSession`, `Program` — see `.claude/rules/data-contracts.md` for exact fields.
