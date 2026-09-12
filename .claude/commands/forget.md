---
description: Prune stale entries from the project memory files (decisions, gotchas, progress) instead of letting them grow forever.
argument-hint: [file: decisions|gotchas|progress|all]
---

Review `.claude/memory/$1.md` (or all three memory files if $1 is "all"):

1. List entries that look resolved, superseded, or no longer relevant (e.g., a gotcha that's been fixed and can't recur, a decision that was later reversed, progress notes older than the last major milestone).
2. Show me the list of entries you propose to remove and WHY, one line each.
3. Wait for my confirmation before deleting anything — never prune memory files silently.
4. After I confirm, remove only the approved entries and keep the rest verbatim.
