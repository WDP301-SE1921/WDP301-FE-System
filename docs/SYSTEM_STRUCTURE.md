# System Structure

## Repos
- `WDP301-FE-System` — this repo. Next.js web app for manager, curriculum designer, staff, and teacher.
- `WDP301-FEM-System` — React Native/Expo mobile app for parent (and teacher, pending the platform question below).
- `WDP301-BE-System` — backend API, source of truth for all data contracts.

## Roles × platform (5 roles, up from 3)
| Role | Web | Mobile |
|---|---|---|
| Quản lý trung tâm | ✅ | — |
| Thiết kế giáo trình | ✅ | — |
| Nhân viên | ✅ | — |
| Giáo viên | ✅ | ⚠️ unclear — role list says Web only, §1.3 heading says Web+Mobile |
| Phụ huynh | — | ✅ |

## High-level flow
Parent (mobile) self-registers an account and creates each child's profile in the app → Nhân viên (web) looks the parent up by email at the counter, picks the child, assigns a class, confirms payment — no link, no extra confirmation step → Thiết kế giáo trình (web) defines what gets taught and when → Quản lý trung tâm (web) creates the class and assigns a teacher → Giáo viên runs classes, attendance, and grading → parent (mobile) sees schedule, attendance, and approved grades for each child.

## Tech stack summary
Next.js + TypeScript + Shadcn (Maia) + Tailwind on web; React Native + Expo on mobile; both consume the same `WDP301-BE-System` REST API via Axios + TanStack Query.
