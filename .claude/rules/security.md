# Security & Permissions

- Parent login = mobile only. Never add a student-facing login form or student JWT/session type.
- Route guards per role: a `(manager)` route must 403 for a role that is not allowed to open it (teacher, parent, or a back-office role without that area — e.g. `staff` on `/manager/catalog`), and `/teacher/*` must 403 for every non-teacher — check this on the server (`src/proxy.ts` via `canAccessPath`), not just by hiding UI. A missing or unknown role cookie must never be treated as a default role: no cookie → `/login`, unknown value → 403.
- The role → screens table is `src/constants/role-access.ts`; menus, proxy and hidden buttons all read it. There is no per-feature permission beyond it (only `ACCOUNT_MANAGE_TARGETS` for who may create which role's account).
- A parent session must only ever be able to fetch data scoped to their own `StudentProfile` records — never trust a `studentProfileId` from the client without checking it belongs to the authenticated parent.
- Manager can never see another center's data — moot at single-tenant scope today, but don't hardcode assumptions that would make multi-tenant impossible to add later without a rewrite.
- Never log or display a full staff-invitation token in an error message or console log — it's a one-time credential. (Parents no longer have activation links/tokens.)
- Centers never create, view or reset a parent's password.
