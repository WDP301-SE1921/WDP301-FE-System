---
name: shared-ui
description: Patterns for building and reusing shared UI components (ChildSwitcher, EmptyState, StatusBadge, etc.) across roles.
user-invocable: false
---

# Shared UI Patterns

## Child switcher (parent role)
Horizontal avatar/tab list at the top of parent screens. Reads the list of `StudentProfile` for the logged-in account; switching sets the active child in URL state (`nuqs`), not component state, so deep links stay shareable.

## Status badges
One `<StatusBadge status={...} />` component maps every domain status (`AttendanceRecord.status`, `Enrollment.status`, AI-grading status) to a consistent color + label — don't hand-roll a `<span className={...}>` per screen.

## Empty / loading / error states
Every list/table view uses the same three shared components (`<EmptyState />`, `<LoadingSkeleton />`, `<ErrorState />`) — never a bare "Loading..." string or a blank screen.

## Forms
Every form uses `react-hook-form` + the matching Zod schema from `src/lib/validators/` via `@hookform/resolvers/zod` — no manually-managed form state.
