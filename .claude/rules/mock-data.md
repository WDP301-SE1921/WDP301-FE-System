# Mock Data

Used while `WDP301-BE-System` doesn't yet expose an endpoint. The whole web app is
mock-only today — there is no real API client wired up.

- Mock fixtures live in `src/mocks/data/<domain>.ts`, typed against the real contract in `.claude/rules/data-contracts.md` — never a shape you invented for convenience.
- `src/mocks/utils/mock-query.ts` holds the shared helpers (`mockQuery`, `mockMutation`, `MockError`) that simulate network latency and business errors. Every mock hook goes through them instead of resolving instantly.
- A mock hook has the identical signature to its real TanStack Query counterpart (`useStudents`, `useAttendance`, etc.) so swapping it out later is a one-line change of `queryFn`/`mutationFn`, not a rewrite.
- `MockError` carries a Vietnamese message pulled from `src/constants/messages/` — never a hardcoded string, so the copy survives the swap to the real API.
- Delete the mock file in the same PR that wires up the real endpoint — don't let dead mocks accumulate.
