# Shared Component Architecture

- `components/ui/` — Shadcn-generated only. Add new primitives via `npx shadcn@latest add <name>`, never hand-write a new file here.
- `components/shared/` — components used by 2+ roles (Header, ChildSwitcher, Sidebar, EmptyState). Promote a component here only after it's actually reused, not preemptively.
- `features/<domain>/components/` — components used by exactly one feature. Default location for anything new.
- A component graduates `features/ → components/shared/` when a second feature needs it — move it, don't copy-paste it.
- Never import one feature's internal component directly from another feature (`features/attendance` importing from `features/payments/components/`) — promote it to `shared/` first.
