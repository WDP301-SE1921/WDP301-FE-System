# AGENTS.md — WDP301-FE-System

## Project
Next.js (App Router) frontend for an education-center management platform (WDP301-SE1921). Web serves 5 roles: Quản trị viên (`admin`), Quản lý trung tâm (`center_manager`), Thiết kế giáo trình (`curriculum_designer`), Nhân viên (`staff`) — sharing the `/manager/*` back-office, screens per role in `src/constants/role-access.ts` — and Giáo viên (`teacher`, `/teacher/*`). Phụ huynh (parent, mobile only) — one account manages multiple children, no separate student login.

## Tech stack
- Next.js App Router + TypeScript
- Shadcn UI (Maia preset) + Tailwind CSS
- React Hook Form + Zod
- TanStack Query + Axios
- nuqs (URL state), date-fns

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npx prettier --write .`
- Add a Shadcn component: `npx shadcn@latest add <component>`

## Code conventions
- Functional components only.
- No enums — use plain object maps instead.
- Prefer `interface` over `type` for object shapes.
- Components in `src/components` named kebab-case.
- Minimize `"use client"` — prefer React Server Components.
- Use `nuqs` for URL-synced state (filters, pagination, tabs), not local state.
- Images: WebP format, lazy loading.

## Folder structure
- `src/app/(public)`, `(auth)`, `(manager)` (back-office for admin / center manager / curriculum designer / staff), `(teacher)`, `(parent)` — route groups, each with its own `layout.tsx`.
- `src/components/ui` — Shadcn-generated; don't hand-edit beyond the CLI.
- `src/components/shared` — cross-role components (Header, ChildSwitcher, Sidebar).
- `src/features/<domain>` — domain logic + UI colocated (students, classes, attendance, payments).
- `src/lib/validators` — Zod schemas, shared between forms and API calls.
- `src/hooks` — custom hooks + TanStack Query hooks.
Full breakdown: `docs/architecture.md`.

## Design system
Every corner is rounded — no sharp corners anywhere (buttons, cards, images, inputs, icons). Full rules: `.claude/rules/design.md`.

## Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.
- One branch per feature: `feature/<name>`.
- PR into `main` — no direct pushes.

## Don'ts
- Don't hardcode colors — use the design system's tokens.
- Don't add another state library (Redux, Zustand) — TanStack Query + React state covers this project's needs.
- Don't bypass Zod validation on forms.
- Don't create a student login — the account model is parent-only (see `docs/business-rules.md`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
