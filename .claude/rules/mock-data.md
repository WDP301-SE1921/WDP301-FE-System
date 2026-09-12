# Mock Data

Used while `WDP301-BE-System` doesn't yet expose an endpoint.

- Mock fixtures live in `src/lib/mocks/<domain>.ts`, typed against the real contract in `.claude/rules/data-contracts.md` — never a shape you invented for convenience.
- A mock hook has the identical signature to its real TanStack Query counterpart (`useStudents`, `useAttendance`, etc.) so swapping it out later is a one-line change, not a rewrite.
- Gate mocks behind `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` — never behind a hardcoded `if` that could ship to production.
- Delete the mock file in the same PR that wires up the real endpoint — don't let dead mocks accumulate.
