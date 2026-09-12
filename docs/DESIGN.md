# Design System — Education Center Landing/About Page

Applies to every component/page built in this project. Keep it consistent — don't drift in style when adding new sections or pages.

## Overall Style
Friendly Professional, classic — serious and trustworthy, but still warm and approachable.
- Avoid overly childish/cartoonish styling.
- Avoid a cold, gray, corporate look.

## Colors
- Primary: trustworthy blue `#2563EB` or green `#16A34A`
- Accent: warm orange/yellow `#F59E0B` — used for CTA buttons and highlights
- Light background as the base, generous whitespace
- Do not use dark mode as the default

## Typography
- Clear, readable font with good Vietnamese diacritics support: Be Vietnam Pro, Inter, or Plus Jakarta Sans
- Bold, clearly hierarchical headings; body text with enough contrast to read on mobile

## Border Radius — mandatory rule across the whole page
No sharp/square corners anywhere. The larger the block, the larger the radius.

| Element | Suggested radius (Tailwind) |
|---|---|
| Logo | `rounded-full` or `rounded-2xl` |
| Hero image | `rounded-3xl` |
| Cards (subjects, teachers, testimonials) | `rounded-2xl`, consistent across all cards |
| Contact block/section | `rounded-3xl` for the main container |
| Input field | `rounded-xl` |
| Button | `rounded-full` (pill) or `rounded-xl` |
| Icon container (icon background) | `rounded-full` or `rounded-2xl` |

Rule of thumb: minimum radius `rounded-xl`, never use `rounded-none`/`rounded-sm` anywhere on the page.

## Component Stack
- Next.js App Router + TypeScript
- Shadcn UI + Tailwind CSS
- Functional components only
- Images: WebP, lazy loading

## Target Audience
Parents of middle/junior-high school students (grades 6–9) — not very tech-savvy, need to feel trust and clarity, no clutter. Prioritize the mobile experience.
