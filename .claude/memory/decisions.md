# Decisions

- **2026-09** — Single-tenant scope: the whole system serves exactly one education center. No multi-tenant/Center model, no tenant isolation logic.
- **2026-09** — Account model is parent-only: one login account belongs to a parent, who holds one or more `StudentProfile` children. There is no separate student login, ever.
- **2026-09** — Parent role is Mobile-only per the latest spec (Web + Mobile for manager/teacher, Mobile for parent) — don't build a parent web UI unless this changes.
- **2026-09** — Shadcn preset: **Maia** (soft, rounded, generous spacing) — chosen for a friendly, non-clinical feel for parents.
- **2026-09** — Route groups by role: `(public)`, `(auth)`, `(manager)`, `(teacher)`, `(parent)` — each with its own layout.
- **2026-09** — State management: TanStack Query for server state, `nuqs` for URL state, plain React state for local UI. No Redux/Zustand.
- **2026-10** — Split the manager role into 3: Quản lý trung tâm (staff/teacher CRUD, dashboard, class creation), Thiết kế giáo trình (curriculum content, new), Nhân viên (registration, payment confirmation, schedule/makeup/leave — new). Added route groups `(curriculum)` and `(staff)`. Existing UI under `(manager)` is being reassigned, not rebuilt. Payment confirmation moved from manager to staff.
- **2026-10** — Teacher platform is ambiguous in the spec (role list says Web-only, §1.3 heading still says Web+Mobile) — treated as Web-only pending confirmation.
