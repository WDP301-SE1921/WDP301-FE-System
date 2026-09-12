# Data Contracts

Human-readable version of `.claude/rules/data-contracts.md` — read that file for the version agents enforce verbatim; this one explains the *why*.

## Why field names must match the backend exactly
Every mismatch between the FE's naming and the API's naming becomes a mapping layer someone has to maintain and eventually gets out of sync silently (the classic "FE says `enrollmentStatus`, API says `status`" bug). We don't do that here — Zod schemas in `src/lib/validators/` use the API's field names verbatim.

## Core entities
`ParentAccount`, `StudentProfile`, `Enrollment`, `Payment`, `ActivationLink`, `AttendanceRecord`, `ClassSession` — see `.claude/rules/data-contracts.md` for exact fields.

## Status fields
Always string unions (`"present" | "absent" | "made_up" | "excused"`), never numeric enums — this project doesn't use TypeScript enums anywhere (see naming/frontend rules), partly because string unions serialize identically to what the API sends, with zero mapping.
