# Frontend Conventions

- Functional components only.
- No enums — use plain object maps instead.
- Prefer `interface` over `type` for object shapes.
- Components in `src/components` named kebab-case.
- Minimize `"use client"` — prefer React Server Components.
- Use `nuqs` for URL-synced state (filters, pagination, tabs), not local state.
- Images: WebP format, lazy loading.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`. One branch per feature. PR into `main`.
