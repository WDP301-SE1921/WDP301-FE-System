---
paths:
  - "src/app/**/*.{tsx,ts}"
  - "src/components/**/*.{tsx,ts}"
  - "src/features/**/*.{tsx,ts}"
---

# UI / Design System Rules

Friendly Professional, classic — serious and trustworthy, but warm and approachable. No childish/cartoonish styling. No cold, gray, corporate look.

## Colors
- Primary: `#2563EB` (blue) or `#16A34A` (green)
- Accent: `#F59E0B` — CTA buttons, highlights
- Light background as the base, generous whitespace. No dark mode as default.

## Typography
Be Vietnam Pro, Inter, or Plus Jakarta Sans. Clear heading hierarchy, enough contrast for mobile.

## Border radius — mandatory, no exceptions
No sharp/square corners anywhere. Larger block → larger radius.

| Element | Radius (Tailwind) |
|---|---|
| Logo | `rounded-full` / `rounded-2xl` |
| Hero image | `rounded-3xl` |
| Cards | `rounded-2xl` — same across all cards |
| Contact/section blocks | `rounded-3xl` |
| Input field | `rounded-xl` |
| Button | `rounded-full` or `rounded-xl` |
| Icon container | `rounded-full` / `rounded-2xl` |

Minimum radius `rounded-xl`. Never `rounded-none` / `rounded-sm`.
