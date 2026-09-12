---
description: Quick bug-fix workflow for a single reported issue.
argument-hint: [short bug description or file path]
---

Fix the following issue: $ARGUMENTS

1. Reproduce or locate the bug first — don't guess at a fix without reading the actual failing code path.
2. Check `.claude/memory/gotchas.md` — this may already be a known, documented pitfall.
3. Make the smallest correct fix. Don't refactor unrelated code in the same change.
4. Run `npm run lint` and `npm run build` to confirm nothing else broke.
5. If this bug is the kind that could easily happen again (a footgun, not a typo), add one line to `.claude/memory/gotchas.md`.
