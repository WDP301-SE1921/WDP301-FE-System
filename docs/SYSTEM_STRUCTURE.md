# System Structure

## Repos
- `WDP301-FE-System` — this repo. Next.js web app for manager + teacher.
- `WDP301-FEM-System` — React Native/Expo mobile app for teacher + parent.
- `WDP301-BE-System` — backend API, source of truth for all data contracts.

## Roles × platform
| Role | Web | Mobile |
|---|---|---|
| Manager | ✅ | — |
| Teacher | ✅ | ✅ |
| Parent | — | ✅ |

## High-level flow
Manager (web) registers a child and confirms payment → parent (mobile) activates an account via the emailed link → teacher (web/mobile) runs classes, attendance, and grading → parent (mobile) sees schedule, attendance, and approved grades for each child.

## Tech stack summary
Next.js + TypeScript + Shadcn (Maia) + Tailwind on web; React Native + Expo on mobile; both consume the same `WDP301-BE-System` REST API via Axios + TanStack Query.
