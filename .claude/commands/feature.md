---
description: Implement a feature end-to-end for a given role, then review it.
argument-hint: [feature-name] [role: manager|curriculum|staff|teacher|parent]
---

Build the feature $1 for the $2 role in WDP301-FE-System:

1. Invoke the `frontend` agent to implement it under `src/features/$1/` and `src/app/($2)/$1/`.
2. Invoke the `reviewer` agent on the resulting diff.
3. Append one line to `.claude/memory/progress.md`: what was built and its status.
