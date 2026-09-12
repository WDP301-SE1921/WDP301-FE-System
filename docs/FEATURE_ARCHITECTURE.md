# Feature Architecture

Human-readable companion to `.claude/rules/architecture.md`.

## Why route groups by role
Manager, teacher, and parent have almost nothing in common in terms of navigation, density, or even platform (`(parent)` is mobile-only today). Separate route groups with separate layouts let each evolve independently instead of one shared shell full of role-conditional branches.

## Why `features/<domain>/` instead of a flat `components/`
Domain logic (a hook, its validator, its components) tends to change together. Colocating them means one PR touches one folder instead of three, and it's obvious where new attendance-related code goes without a team convention doc being the only source of truth.

## Why TanStack Query + `nuqs`, no global store
Almost everything this app renders is server state (students, classes, payments) or URL state (which child is selected, which filter is active). There's no cross-cutting client-only state that would justify Redux/Zustand — adding one would be solving a problem we don't have.
