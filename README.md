# WDP301-FE-System

Frontend web app (Next.js) for the WDP301-SE1921 education-center management platform. Part of a 3-repo project:

- `WDP301-FE-System` — this repo, web
- `WDP301-FEM-System` — mobile (React Native/Expo)
- `WDP301-BE-System` — backend API

## Tech stack

- Next.js (App Router) + TypeScript
- Shadcn UI (Maia preset) + Tailwind CSS
- React Hook Form + Zod
- TanStack Query + Axios
- nuqs, date-fns

## Getting started

```bash
git clone https://github.com/WDP301-SE1921/WDP301-FE-System.git
cd WDP301-FE-System
npm install
cp .env.example .env.local   # fill in API URL, etc.
npm run dev
```

Open http://localhost:3001 (the backend keeps port 3000)

## Kiểm thử production cùng team

[Web production](https://edugrade.45.77.168.110.sslip.io) · [Admin production](https://admin.edugrade.45.77.168.110.sslip.io) · [API health](https://api.edugrade.45.77.168.110.sslip.io/api/v1/health/ready)

Chỉ cần repo frontend và Node.js 22+, không cần backend/database local:

```powershell
npm ci
npm run test:e2e:production:setup
# Nhận/điền cấu hình riêng ở e2e/production/.env một lần.
npm run test:e2e:production:ui
```

Trang Playwright Production: `http://127.0.0.1:9326`. Chạy AI/email thật bằng `npm run test:e2e:production:services -- --headed`, toàn bộ bằng `npm run test:e2e:production:full -- --headed`, mở báo cáo riêng bằng `npm run test:e2e:production:report`. File `.env` thật không được commit; `.env.example` có sẵn trong source. [Hướng dẫn đầy đủ và workflow cho team](e2e/production/README.md).

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start dev server         |
| `npm run build` | Production build         |
| `npm run start` | Run the production build |
| `npm run lint`  | Lint code                |

## Folder structure

Full breakdown in [`docs/architecture.md`](docs/architecture.md). Top level:

```
src/app/         Route groups by role: (public) (auth) (manager) (curriculum) (staff) (teacher) (parent)
src/components/  Shared components + Shadcn UI
src/features/    Domain logic (students, classes, attendance, payments)
src/lib/         axios instance, utils, zod validators
src/hooks/       Custom hooks + React Query hooks
```

## Design system

Rounded-corner, "Friendly Professional" style — see [`design.md`](design.md) at repo root.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — folder structure & conventions in depth
- [`docs/business-rules.md`](docs/business-rules.md) — domain rules (roles, enrollment, attendance, payment flow)
- [`docs/setup.md`](docs/setup.md) — environment variables & local setup
- [`docs/api-integration.md`](docs/api-integration.md) — how the FE talks to `WDP301-BE-System`

## Related repos

- Backend: https://github.com/WDP301-SE1921/WDP301-BE-System
- Mobile: https://github.com/WDP301-SE1921/WDP301-FEM-System

## Team

WDP301-SE1921
