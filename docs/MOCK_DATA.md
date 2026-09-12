# Mock Data

While `WDP301-BE-System` doesn't yet expose a given endpoint, the FE can still build ahead using typed mocks.

## Rules (enforced version: `.claude/rules/mock-data.md`)
- Mocks live in `src/lib/mocks/<domain>.ts`, typed against `.claude/rules/data-contracts.md`.
- Mock hooks mirror the real hook's signature exactly, so swapping to the real API later is a one-line change in the hook body, not a rewrite of every component that calls it.
- Toggle with `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`.

## Why this matters
The FE and BE repos move on separate timelines. Typed mocks let FE work proceed without blocking on BE, while keeping the eventual swap-over close to free — the alternative (untyped `any` mocks, or waiting on BE) either creates bugs later or wastes time now.
