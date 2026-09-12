# Naming Conventions

- Components/files: `kebab-case.tsx` (e.g. `child-switcher.tsx`), component itself exported as `PascalCase`.
- Hooks: `use-kebab-case.ts` exporting `useCamelCase` (e.g. `use-students.ts` → `useStudents`).
- Zod schemas/validators: `kebab-case.ts`, schema exported as `camelCaseSchema` (e.g. `enrollmentSchema`).
- Route folders: lowercase, role groups in parentheses — `(manager)`, `(teacher)`, `(parent)`.
- Booleans: prefix with `is`/`has`/`can` (`isLoading`, `hasEnrollment`, `canConfirmPayment`).
- No abbreviations that aren't obvious (`enrollment`, not `enrl`).
