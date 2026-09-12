# Decisions

- **2026-09** — Single-tenant scope: the whole system serves exactly one education center. No multi-tenant/Center model, no tenant isolation logic.
- **2026-09** — Account model is parent-only: one login account belongs to a parent, who holds one or more `StudentProfile` children. There is no separate student login, ever.
- **2026-09** — Parent role is Mobile-only per the latest spec (Web + Mobile for manager/teacher, Mobile for parent) — don't build a parent web UI unless this changes.
- **2026-09** — Shadcn preset: **Maia** (soft, rounded, generous spacing) — chosen for a friendly, non-clinical feel for parents.
- **2026-09** — Route groups by role: `(public)`, `(auth)`, `(manager)`, `(teacher)`, `(parent)` — each with its own layout.
- **2026-09** — State management: TanStack Query for server state, `nuqs` for URL state, plain React state for local UI. No Redux/Zustand.
