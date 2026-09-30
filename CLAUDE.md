# EduGrade — Claude Code Guidelines

This document provides core project instructions, architectural boundaries, code clean-code standards, and operational workflows for AI assistants working on the EduGrade codebase.

---

## 1. Project Context & Stack
* **Domain:** Tutoring center management system (Grades 6–9: Math, Physics, Chemistry, Biology) for a single center.
* **Framework:** Next.js (App Router), TypeScript, React, Tailwind CSS.
* **UI Components:** Radix UI / Shadcn UI primitives (`src/components/ui/`), `lucide-react`.
* **Forms & Validation:** `react-hook-form`, `@hookform/resolvers/zod`, `zod`.
* **State & URL Management:** `nuqs` for URL search parameter state (e.g., active child switcher).

---

## 2. Mandatory Rules Before Executing Tasks

1. **Read Context First:** Read `CLAUDE.md`, `AGENTS.md`, applicable rules in `.claude/rules/`, memory logs in `.claude/memory/`, and specifications in `docs/` before implementing any feature[cite: 1].
2. **Inspect Existing Code:** Examine existing patterns to ensure strict consistency across components and feature modules[cite: 1].
3. **Plan Before Modifying Code:** For any non-trivial task, inspect the codebase and present a clear execution plan first. **Do NOT modify code until the plan is approved.**[cite: 1]
4. **No Unnecessary Refactoring:** Do not rewrite existing working components or introduce new dependencies/technologies unless explicitly instructed[cite: 1].
5. **Auto-Fix Warnings & Canonical Styling:** Always write clean code adhering strictly to canonical Tailwind CSS classes (e.g., use `w-25` instead of `w-[100px]`, `bg-black/6` instead of `bg-black/[.06]`). Fix all linter, type, and style warnings in files you touch before finishing.
6. **No Direct Code Pushes to `main`:** All work must be conducted on the `dev` branch or dedicated feature branches (`feature/*`)[cite: 1].

---

## 3. Core Architectural & Domain Rules

* **App Router Layer (`src/app/`):**[cite: 1]
  * Serves strictly as Page Controllers and Layout Wrappers[cite: 1].
  * **Rule:** Do NOT write business logic inside `page.tsx` files. Delegate logic to `src/features/` or `src/components/`[cite: 1].
  * Scoped strictly using Route Groups: `(auth)`, `(manager)`, `(teacher)`, `(parent)`, `(public)`[cite: 1]. `(manager)` is the shared back-office (`/manager/*`) for `admin`, `center_manager`, `curriculum_designer` and `staff`; which role sees which screen is defined only in `src/constants/role-access.ts`.

* **Feature Domain Layer (`src/features/`):**[cite: 1]
  * Business logic, feature hooks, and domain modules reside in domain folders (`attendance/`, `classes/`, `payments/`, `students/`)[cite: 1].

* **Shared UI Layer (`src/components/`):**[cite: 1]
  * `src/components/ui/`: Base UI primitives (Button, Card, Dialog, Table, Badge, Tabs, Input). **Always reuse primitive components; do not hand-roll raw Tailwind markup for standard UI controls.**[cite: 1]
  * `src/components/shared/`: Cross-cutting dynamic UI components (`ChildSwitcher`, `<StatusBadge />`, `<EmptyState />`, `<LoadingSkeleton />`, `<ErrorState />`)[cite: 1].
  * Use `cn()` from `@/lib/utils` when merging dynamic class names[cite: 1].

* **Forms:**[cite: 1]
  * Must use `react-hook-form` paired with Zod validation schemas imported from `src/lib/validators/`. Hand-rolled `useState` form management is prohibited[cite: 1].

* **Domain & Account Model:**[cite: 1]
  * Parent Account = Unique Login Email + Password, self-registered on the mobile app[cite: 1].
  * Student Profile = Child record attached under a Parent Account (1 Parent can manage N Children), created by the parent on mobile before the center can enroll it[cite: 1]. There is no activation link/code for parents.
  * There are **NO separate Student login accounts**. Students act via their Parent's active session[cite: 1].
  * AI evaluation yields a **PROPOSED** draft state and **MUST** be reviewed and published by a Teacher before parents/students can view it[cite: 1].

---

## 4. Work Verification & Memory Update Workflow

After completing any task, execute the following mandatory verification & auto-fix pipeline:

1. **Auto-Fix & Lint Checking:**
   Run linter to clean up code style, unused variables, and Tailwind CSS warnings:
   ```bash
   npx eslint --fix .
   npm run lint