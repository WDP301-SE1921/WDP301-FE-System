---
name: code-review
description: Checklist for reviewing a diff against project rules. Used by the reviewer agent.
user-invocable: false
---

# Review Checklist

Walk the diff against each of these before approving:

- **Design** (`rules/ui.md`): rounded corners everywhere touched, no hardcoded colors outside the token set.
- **Architecture** (`rules/architecture.md`): new files in the correct role route group / feature folder, not dumped in `components/`.
- **Naming** (`rules/naming.md`): kebab-case files, correct hook/schema naming pattern.
- **Data contracts** (`rules/data-contracts.md`): field names match the backend exactly, no invented "convenience" fields.
- **Security** (`rules/security.md`): no student login surface added, route guards present for role-restricted pages, no `studentProfileId` trusted from the client unchecked.
- **Conventions** (`rules/frontend.md`): no enums, functional components only, minimal `"use client"`.

Flag anything that contradicts `.claude/memory/decisions.md` as blocking, not a suggestion.
