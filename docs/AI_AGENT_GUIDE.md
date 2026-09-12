# AI Agent Guide

How Claude Code (and any other AI coding agent) works in this repo. Read this once before your first session here.

## The five pieces
- **`.claude/rules/`** — always-relevant or path-scoped constraints (architecture, naming, security, data contracts, UI). Loaded automatically, never invoked by hand.
- **`.claude/skills/`** — reusable domain knowledge (enrollment flow, attendance rules, review checklist, shared UI patterns). Auto-discovered when relevant; not shown as slash commands.
- **`.claude/agents/`** — specialized subagents: `frontend` (implements a feature), `reviewer` (checks a diff before commit).
- **`.claude/commands/`** — slash-command entry points: `/feature`, `/fix`, `/review`, `/verify`, `/forget`.
- **`.claude/memory/`** — a manually-curated project journal (`decisions.md`, `gotchas.md`, `progress.md`), separate from Claude Code's own per-agent memory.

## Typical flow for a new feature
1. `/feature <name> <role>` — implements it, reviews it, logs progress. No separate planning step — this is a course project, not a multi-team codebase; go straight from request to implementation.
2. `/verify` before opening a PR.
3. `/fix` for a one-off bug instead of the full feature flow.
4. `/forget` occasionally to prune stale memory entries.

## Where the "real" business rules live
`docs/BUSINESS_WORKFLOW.md` — read it before touching enrollment, payment, or attendance code; the agent-facing summary in `.claude/rules/` is intentionally terse.
