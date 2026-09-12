---
description: Run the full local verification suite (lint, typecheck, build) before opening a PR.
---

Run, in order, and report the result of each clearly (don't stop silently on the first failure — run all three and summarize):

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`

If any step fails, show the relevant error output and propose a fix — don't just report pass/fail.
