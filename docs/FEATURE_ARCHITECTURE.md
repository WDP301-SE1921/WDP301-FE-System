# Feature Architecture

Human-readable companion to `.claude/rules/architecture.md`. **5 staff-side roles now, up from 3** — see `docs/BUSINESS_WORKFLOW.md` for the full breakdown.

## Why route groups by role
Quản lý trung tâm, Thiết kế giáo trình, Nhân viên, Giáo viên, and Phụ huynh have almost nothing in common in terms of navigation, density, or platform (`(parent)` is mobile-only; teacher is web-only per the latest role list). Separate route groups with separate layouts let each evolve independently.

## Reassigning existing UI — not rebuilding it
The split added `(curriculum)` and `(staff)` as new route groups. Nothing already built needs a redesign — only a move:
- Everything under 1.2.2/1.2.3/1.5/1.7–1.10 of the spec (student registration, payment confirmation, schedule changes, makeup scheduling, leave) moves from `(manager)` to `(staff)` — this is now **Nhân viên**'s job, not the manager's.
- Subject/Program/Lesson/Room content (1.2.4) moves from `(manager)` to `(curriculum)` — this is now **Thiết kế giáo trình**'s job.
- Class creation (choosing subject + grade + program + room + fixed schedule + teacher) and teacher/staff/parent-record CRUD, plus the dashboard, stay in `(manager)`.

## Why `features/<domain>/` instead of a flat `components/`
Domain logic (a hook, its validator, its components) tends to change together. Colocating them means one PR touches one folder instead of three.

## Why TanStack Query + `nuqs`, no global store
Almost everything this app renders is server state or URL state. No cross-cutting client-only state justifies Redux/Zustand.
