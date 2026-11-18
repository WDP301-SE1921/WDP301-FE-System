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

[Báo cáo test production online](https://wdp301-se1921.github.io/WDP301-FE-System/) · [Web production](https://edugrade.45.77.168.110.sslip.io) · [Admin production](https://admin.edugrade.45.77.168.110.sslip.io) · [API health](https://api.edugrade.45.77.168.110.sslip.io/api/v1/health/ready)

Chỉ cần repo frontend và Node.js 22+, không cần backend/database local:

```powershell
npm ci
npm run test:e2e:production:setup
# Nhận/điền cấu hình riêng ở e2e/production/.env một lần.
npm run test:e2e:production:full
```

Chạy xong, lệnh cập nhật báo cáo trên web, in link online rồi kết thúc; không mở báo cáo hoặc máy chủ local, không cần bấm Run trong Playwright. Người có quyền ghi repo xuất bản bằng đăng nhập Git sẵn có. Cả team xem kết quả ở link online phía trên. Chạy riêng AI/email bằng `npm run test:e2e:production:services`; `npm run test:e2e:production:report` in link báo cáo online đã có. File `.env` thật không được commit. [Hướng dẫn đầy đủ](e2e/production/README.md).

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
