# Project Memory — Index

This folder is a manually-curated project journal, separate from Claude Code's built-in per-agent memory (`.claude/agent-memory/`, enabled via the `memory:` field on an agent). Agents and humans both read and update these files during normal work — they are not auto-generated.

- `decisions.md` — architectural/product decisions and why they were made. Check before proposing something that might contradict one.
- `gotchas.md` — known pitfalls already hit once. Check before debugging something that "feels familiar".
- `progress.md` — running log of what's been built, in date order.

Keep each file scannable — one line per entry where possible. Use `/forget` to prune stale entries instead of letting them grow forever.
