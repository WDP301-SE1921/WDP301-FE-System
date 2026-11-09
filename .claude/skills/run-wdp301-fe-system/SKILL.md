---
name: run-wdp301-fe-system
description: Run, start, build, screenshot and drive the EduGrade web app (WDP301-FE-System, Next.js) together with its NestJS backend (sibling WDP301-BE-System) on the local dev DB. Use when asked to "chạy thử", start/launch the web app or backend, log in as manager/staff/teacher/designer, click through a screen, take a screenshot, or check a UI change in the real app.
---

EduGrade web = Next.js FE (`:3001`) talking to the NestJS BE (`:3000`, repo `../WDP301-BE-System`) on MySQL in Docker. An agent drives it with `.claude/skills/run-wdp301-fe-system/driver.mjs`: a headless-Chrome driver that reads one command per line from stdin, logs in per role, and saves screenshots.

All paths below are relative to `WDP301-FE-System/`. Verified on Windows 11 with Claude Code's Git Bash (and PowerShell for stopping).

## Prerequisites

- Docker Desktop with the container `edugrade_mysql` (MySQL on `localhost:3307`, the `DATABASE_URL` in `../WDP301-BE-System/.env`).
- Node 22, Google Chrome installed (the driver launches it with `channel: "chrome"`).
- `../WDP301-BE-System` checked out next to this repo with its `.env` and `node_modules`; this repo has `node_modules`. (Both were already installed when this skill was written.)
- One-time: `playwright-core` for the driver, outside the repo:

```bash
mkdir -p ~/.cache/wdp-run-tools && cd ~/.cache/wdp-run-tools && npm init -y >/dev/null && npm install --no-audit --no-fund playwright-core@1.48.2
```

## Build

Production build of the FE (several minutes). Use this, not `next dev` (see Gotchas):

```bash
npx next build --webpack
```

## Run (agent path)

1. Database and migrations (`migrate deploy` only adds pending migrations; BE code expects them):

```bash
docker start edugrade_mysql && until [ "$(docker inspect -f '{{.State.Health.Status}}' edugrade_mysql)" = healthy ]; do sleep 1; done && echo mysql healthy && (cd ../WDP301-BE-System && npx prisma migrate deploy 2>&1 | tail -1)
```

2. Start both servers with the Bash tool's `run_in_background` (one call each). The BE `.env` holds a real Gmail SMTP: always blank the mail vars.

```bash
cd ../WDP301-BE-System && SMTP_URL= SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASSWORD= MAIL_FROM= npx nest start --watch > /tmp/wdp-be.log 2>&1
```

```bash
npx next start -p 3001 > /tmp/wdp-fe.log 2>&1
```

3. Wait on the health endpoints (not on log text):

```bash
timeout 180 bash -c 'until curl -sf http://localhost:3000/api/v1/health/ready >/dev/null && curl -sf -o /dev/null http://localhost:3001/login; do sleep 2; done' && echo BOTH_UP
```

4. Drive it. Example that checks the course frequency screens and ends with screenshots:

```bash
node .claude/skills/run-wdp301-fe-system/driver.mjs <<'EOF'
as manager
nav /manager/curriculum
wait-for Tạo khóa học
text main
ss courses
nav /manager/sessions
pick #generation-program | Toán 6 - Chương trình trung tâm
wait-for Chuẩn khóa
ss generator
errors
as designer
nav /manager/curriculum
button Tạo giáo trình
pick #unit-program | Toán 6 - Chương trình trung tâm
fill #unit-from | 2027-01-04
fill #unit-to | 2027-01-31
sleep 1500
value #unit-weekly-count
ss designer-form
errors
EOF
```

Screenshots → `%TEMP%\wdp-run-shots\NN-<name>.png` (override with `SHOTS=`; numbering restarts and overwrites each run). Every failed command prints `ERROR …`, saves `NN-error.png`, and the driver exits 1. **Open the screenshots** before calling anything done.

| command | what it does |
|---|---|
| `as <manager\|staff\|teacher\|designer>` | switch to that role's browser context; logs in once (`*@edugrade.local`, password `SEED_DEFAULT_PASSWORD` from the BE `.env`, or `SEED_PASSWORD=`) |
| `nav <path>` | open `WEB_URL + path` (default `http://localhost:3001`) |
| `wait-for <text>` | wait until the text is on the page |
| `click <playwright selector>` | e.g. `click #program-name`, `click role=tab[name="Bảng"]` |
| `button <exact name>` | click a button by its accessible name |
| `fill <selector> \| <value>` | type into an input |
| `pick <trigger selector> \| <option>` | open a Base UI select and choose an option |
| `text [selector]` | print flattened `innerText` (default `main`, first 600 chars) |
| `value <selector>` | print an input's value |
| `ss [name]` | screenshot the viewport (1440×900) |
| `errors` | print API responses ≥ 400 and page errors since the last call |
| `sleep <ms>` / `quit` | wait / stop reading |

5. Stop (PowerShell tool): kills the port listeners and the nest watcher.

```powershell
foreach ($port in 3000, 3001) { Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false } }; Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'nest(\.js)?"? start --watch' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
```

The background tasks then report exit code 127; that is the kill, not a crash.

## Run (human path)

After steps 1–3, open http://localhost:3001 and log in with a seed account.

## Test

```bash
npx tsc --noEmit -p .
npx eslint src
```

Expect 0 errors (eslint currently shows 4 old warnings in `src/components/shared`).

## Gotchas

- **`edugrade_db` is the team's real dev data.** Prefer read-only flows, form-side validation, and requests the BE rejects. Anything you create (courses, classes) stays.
- **`npm run dev` (Turbopack) breaks on this Windows checkout**: it keeps failing to rename manifests in `.next/dev` (`EPERM`), so pages such as `/manager/classes/:id` and `/manager/sessions` answer 500 or render blank even though the code is fine. Deleting `.next/dev` does not help; no process holds the files. Use `next build --webpack` + `next start`. Under dev, the first compile of a page also takes 30–90 s, long enough to time out a login.
- **Do not wait on the nest log with `grep -i error`**: the watcher prints `Found 0 errors. Watching for file changes.` Poll `/api/v1/health/ready`.
- **Mail is real by default**: without the blank `SMTP_*`/`MAIL_FROM` the outbox worker sends email from the BE `.env` Gmail account.
- **Prisma refuses destructive commands from an AI agent** (`migrate reset`, so `pnpm reseed` and the reseed case of `tests/e2e/demo-seed.e2e-spec.ts`): it stops with "Prisma Migrate detected that it was invoked by Claude Code". Ask a human to run those; never set the consent variable yourself.
- **Selects are Base UI, not `<select>`**: `fill`/`selectOption` do nothing; use `pick` (trigger, then `role=option`).
- **After login, wait for the role's home page before navigating**; otherwise the post-login redirect races the next `goto`. The driver's `as` does this (designer lands on `/manager/curriculum/overview`).

## Troubleshooting

- **`EPERM: operation not permitted, rename '...\.next\dev\...manifest.js.tmp...'`** in the FE log, pages 500: you are on `next dev`. Stop it, `npx next build --webpack`, `npx next start -p 3001`.
- **`page.waitForURL: Timeout 90000ms exceeded` on `as <role>`**: the FE was still compiling (dev mode). Use the production build.
