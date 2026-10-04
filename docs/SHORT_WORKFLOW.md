# Short Workflow (cheat sheet)

```
/feature <name> <role>   → implement → review → progress logged
/fix <description>       → quick bug fix, checks gotchas.md first
/verify                  → lint + typecheck + build
/review                  → reviewer agent on staged diff
/forget <file|all>       → prune stale memory entries (asks first)
```

Commit convention: `feat:` / `fix:` / `chore:` / `docs:`. One branch per feature, PR into `main`.

Before touching enrollment/payment/attendance code, skim `docs/BUSINESS_WORKFLOW.md` once — it's short and prevents the most common mistakes in this codebase.
