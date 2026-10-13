# Design

Friendly Professional, classic — serious and trustworthy, but warm and approachable. Built for parents of middle/junior-high students who aren't especially tech-savvy: clarity and trust matter more than novelty.

## Colors
- Primary: `#2563EB` (blue) or `#16A34A` (green)
- Accent: `#F59E0B`
- Light background, generous whitespace, no dark mode by default

## Typography
Be Vietnam Pro, Inter, or Plus Jakarta Sans — good Vietnamese diacritic support.

## Border radius
Every corner is rounded — logo, hero image, cards, buttons, inputs, icon containers. Larger block → larger radius. No sharp corners anywhere on the site. Full table of values: `.claude/rules/ui.md`.

## Component library
Shadcn UI, **Maia** preset — soft and rounded with generous spacing, which is the whole point of the border-radius rule above: Maia gives us the base, our rule keeps every *new* component consistent with it instead of drifting back to Shadcn's sharper defaults over time.
