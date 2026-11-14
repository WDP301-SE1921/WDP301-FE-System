import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import type { seedCenterProfile } from "../../../WDP301-BE-System/src/database/seeds/seed-center";
import environment from "./environment.cjs";
const { backend, env, password } = environment;
// Resolve Prisma's type within the BE package so pnpm's generated-client junction is respected.
type Client = Extract<
  Parameters<typeof seedCenterProfile>[0],
  { $disconnect(): Promise<void> }
>;

const backendRequire = createRequire(path.join(backend, "package.json"));
const { PrismaClient } = backendRequire("@prisma/client") as {
  PrismaClient: new (options: { datasourceUrl: string }) => Client;
};
export const API = "http://localhost:3000/api/v1";
export const WEB = "http://localhost:3001";
export const MOBILE = "http://localhost:8081";
export type Role =
  "admin" | "manager" | "staff" | "teacher" | "designer" | "parent";
interface Auth {
  user: { id: string; email: string; role: string; displayName: string };
  tokens: { accessToken: string; refreshToken: string };
}
const homes: Record<Role, string> = {
  admin: "/manager/dashboard",
  manager: "/manager/dashboard",
  staff: "/staff/dashboard",
  teacher: "/teacher/dashboard",
  designer: "/manager/curriculum/overview",
  parent: "/",
};

export const unique = (label: string) =>
  `E2E ${label} ${randomUUID().slice(0, 8)}`;
export function day(offset = 0) {
  const date = new Date();
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = local.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
}
export const instant = (offset: number, time = "08:00") =>
  new Date(`${day(offset)}T${time}:00+07:00`);

export class World {
  db: Client;
  auth = new Map<Role, Auth>();
  private unverified = new Set<Role>();
  private cache = path.join(environment.root, "e2e/.demo-runtime/auth.json");
  constructor() {
    const url = new URL(env.DATABASE_URL);
    if (
      url.hostname !== "127.0.0.1" ||
      url.port !== "3308" ||
      url.pathname !== "/edugrade_e2e"
    )
      throw new Error(
        "Tests require the dedicated local edugrade_e2e database.",
      );
    this.db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
    try {
      const cached = JSON.parse(fs.readFileSync(this.cache, "utf8")) as [
        Role,
        Auth,
      ][];
      for (const [role, auth] of cached) {
        const claims = JSON.parse(
          Buffer.from(
            auth.tokens.accessToken.split(".")[1],
            "base64url",
          ).toString(),
        );
        if (claims.exp > Date.now() / 1000 + 600) {
          this.auth.set(role, auth);
          this.unverified.add(role);
        }
      }
    } catch {
      /* First run or expired local test sessions. */
    }
  }
  async login(role: Role): Promise<Auth> {
    const cached = this.auth.get(role);
    if (cached) {
      if (!this.unverified.delete(role)) return cached;
      const check = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${cached.tokens.accessToken}` },
      });
      if (check.ok) return cached;
      this.auth.delete(role);
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${role}@edugrade.local`, password }),
      });
      if (response.status === 429) {
        const seconds = Math.max(
          1,
          Math.min(60, Number(response.headers.get("retry-after") || 60)),
        );
        console.log(`Đợi giới hạn đăng nhập: ${seconds}s.`);
        await new Promise((resolve) =>
          setTimeout(resolve, seconds * 1000 + 100),
        );
        continue;
      }
      expect(response.status, `Login ${role}`).toBe(200);
      const body = await response.json();
      const claims = JSON.parse(
        Buffer.from(
          body.data.tokens.accessToken.split(".")[1],
          "base64url",
        ).toString(),
      );
      expect(
        claims.iss,
        "Refuse to mutate an API outside the isolated E2E environment",
      ).toBe("wdp-e2e");
      this.auth.set(role, body.data);
      fs.mkdirSync(path.dirname(this.cache), { recursive: true });
      fs.writeFileSync(this.cache, JSON.stringify([...this.auth]));
      return body.data;
    }
    throw new Error(`Login throttled: ${role}`);
  }
  async raw(
    role: Role,
    route: string,
    method = "GET",
    data?: unknown,
    headers: Record<string, string> = {},
  ) {
    const session = await this.login(role);
    return fetch(`${API}/${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.tokens.accessToken}`,
        ...(method === "GET" ? {} : { "Idempotency-Key": randomUUID() }),
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
  async call<T = Record<string, unknown>>(
    role: Role,
    route: string,
    method = "GET",
    data?: unknown,
    expected?: number,
  ): Promise<T> {
    const response = await this.raw(role, route, method, data);
    const body = await response.json();
    if (expected !== undefined)
      expect(
        response.status,
        `${method} ${route}: ${JSON.stringify(body)}`,
      ).toBe(expected);
    else
      expect(response.ok, `${method} ${route}: ${JSON.stringify(body)}`).toBe(
        true,
      );
    return body.data as T;
  }
  async fixture(
    label: string,
    options: { enroll?: boolean; capacity?: number; grade?: number } = {},
  ) {
    const users = Object.fromEntries(
      await Promise.all(
        (["manager", "staff", "teacher", "designer", "parent"] as Role[]).map(
          async (role) => [
            role,
            await this.db.user.findUniqueOrThrow({
              where: { email: `${role}@edugrade.local` },
            }),
          ],
        ),
      ),
    );
    const subject = await this.db.subject.findFirstOrThrow({
      where: { name: "Toán" },
    });
    const program = await this.db.program.create({
      data: {
        name: unique(label),
        subject: "Toán",
        subjectId: subject.id,
        grade: options.grade ?? 8,
        sessionsPerWeek: 2,
      },
    });
    const classroom = await this.db.class.create({
      data: {
        programId: program.id,
        name: unique(`lớp ${label}`),
        teacherId: users.teacher.id,
        monthlyFee: 500000,
        capacity: options.capacity ?? 8,
        scheduleConfirmedAt: new Date(),
        scheduleConfirmedById: users.manager.id,
        weeklySchedules: {
          create: [
            { weekday: 1, startTime: "05:00", endTime: "06:00" },
            { weekday: 3, startTime: "05:00", endTime: "06:00" },
          ],
        },
      },
    });
    const lesson = await this.db.lesson.create({
      data: {
        programId: program.id,
        designerId: users.designer.id,
        title: unique("Phương trình"),
        content: "Giải phương trình 2x + 3 = 7; x = 2.",
        status: "APPROVED",
        sequence: 1,
      },
    });
    const parent = await this.db.parentProfile.findUniqueOrThrow({
      where: { userId: users.parent.id },
    });
    const student = await this.db.studentProfile.create({
      data: {
        parentProfileId: parent.id,
        fullName: unique(`học sinh ${label}`),
        grade: options.grade ?? 8,
      },
    });
    let enrollment = null;
    if (options.enroll !== false) {
      const order = await this.db.registrationOrder.create({
        data: {
          type: "NEW_CHILD",
          parentEmail: users.parent.email,
          studentFullName: student.fullName,
          studentGrade: student.grade,
          targetStudentId: student.id,
          classId: classroom.id,
          packageMonths: 12,
          quotedAmount: 6000000,
          createdByManagerId: users.staff.id,
          status: "COMPLETED",
          startDate: instant(-60, "00:00"),
          endDate: instant(180, "00:00"),
        },
      });
      enrollment = await this.db.enrollment.create({
        data: {
          registrationOrderId: order.id,
          studentProfileId: student.id,
          classId: classroom.id,
          packageMonths: 12,
          status: "ACTIVE",
          startDate: instant(-60, "00:00"),
          endDate: instant(180, "00:00"),
          activatedAt: instant(-60, "00:00"),
          placements: {
            create: {
              classId: classroom.id,
              effectiveFrom: instant(-60, "00:00"),
            },
          },
        },
      });
    }
    return { users, program, classroom, lesson, student, enrollment };
  }
  async session(
    fixture: Awaited<ReturnType<World["fixture"]>>,
    offset: number,
    time = "08:00",
    options: {
      lessonId?: string;
      classId?: string;
      status?: "SCHEDULED" | "COMPLETED";
    } = {},
  ) {
    const start = instant(offset, time);
    return this.db.classSession.create({
      data: {
        classId: options.classId ?? fixture.classroom.id,
        lessonId: options.lessonId ?? fixture.lesson.id,
        teacherId: fixture.users.teacher.id,
        startsAt: start,
        endsAt: new Date(start.getTime() + 3600000),
        status: options.status ?? "SCHEDULED",
      },
    });
  }
  async enrollIn(classId: string, studentId: string) {
    const classroom = await this.db.class.findUniqueOrThrow({
      where: { id: classId },
      include: { program: true },
    });
    const student = await this.db.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
      include: { parentProfile: { include: { user: true } } },
    });
    const staff = await this.db.user.findUniqueOrThrow({
      where: { email: "staff@edugrade.local" },
    });
    const order = await this.db.registrationOrder.create({
      data: {
        type: "NEW_CHILD",
        parentEmail: student.parentProfile.user.email,
        studentFullName: student.fullName,
        studentGrade: student.grade,
        targetStudentId: student.id,
        classId,
        packageMonths: 12,
        quotedAmount: Number(classroom.monthlyFee) * 12,
        createdByManagerId: staff.id,
        status: "COMPLETED",
        startDate: instant(-60, "00:00"),
        endDate: instant(180, "00:00"),
      },
    });
    return this.db.enrollment.create({
      data: {
        registrationOrderId: order.id,
        studentProfileId: student.id,
        classId,
        packageMonths: 12,
        status: "ACTIVE",
        startDate: instant(-60, "00:00"),
        endDate: instant(180, "00:00"),
        placements: {
          create: { classId, effectiveFrom: instant(-60, "00:00") },
        },
      },
    });
  }
}

export class Actors {
  opened: { role: Role; context: BrowserContext; page: Page }[] = [];
  constructor(
    public world: World,
    public browser: Browser,
    public info: TestInfo,
  ) {}
  async open(role: Role) {
    const auth = await this.world.login(role);
    const isParent = role === "parent";
    const context = await this.browser.newContext({
      baseURL: isParent ? MOBILE : WEB,
      locale: "vi-VN",
      timezoneId: "Asia/Ho_Chi_Minh",
      viewport: isParent
        ? { width: 430, height: 900 }
        : { width: 1440, height: 900 },
      recordVideo: {
        dir: this.info.outputPath("videos"),
        size: isParent
          ? { width: 430, height: 900 }
          : { width: 1280, height: 800 },
      },
      storageState: isParent
        ? {
            cookies: [],
            origins: [
              {
                origin: MOBILE,
                localStorage: [
                  {
                    name: "fem.auth.access_token",
                    value: auth.tokens.accessToken,
                  },
                  {
                    name: "fem.auth.refresh_token",
                    value: auth.tokens.refreshToken,
                  },
                  { name: "fem.auth.user", value: JSON.stringify(auth.user) },
                  { name: "fem.app.onboarding_done", value: "true" },
                ],
              },
            ],
          }
        : undefined,
    });
    if (!isParent)
      await context.addCookies([
        {
          name: "edugrade_access",
          value: auth.tokens.accessToken,
          domain: "localhost",
          path: "/",
        },
        {
          name: "edugrade_refresh",
          value: auth.tokens.refreshToken,
          domain: "localhost",
          path: "/",
        },
      ]);
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    this.opened.push({ role, context, page });
    return page;
  }
  async shot(page: Page, name: string) {
    const file = this.info.outputPath(`${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    await this.info.attach(name, { path: file, contentType: "image/png" });
  }
  async finish() {
    for (let index = 0; index < this.opened.length; index++) {
      const { role, context, page } = this.opened[index];
      const label = `${role}-${index}`;
      await this.shot(page, `${label}-final`).catch(() => {});
      const video = page.video();
      await context.close();
      if (video)
        await this.info.attach(`${label} video`, {
          path: await video.path(),
          contentType: "video/webm",
        });
    }
  }
}

export const test = base.extend<{ actors: Actors }, { world: World }>({
  world: [
    async ({}, use) => {
      const world = new World();
      await use(world);
      await world.db.$disconnect();
    },
    { scope: "worker" },
  ],
  actors: async ({ world, browser }, provide, info) => {
    const actors = new Actors(world, browser, info);
    try {
      await provide(actors);
    } finally {
      await actors.finish();
    }
  },
});
export { expect, homes };

export async function select(
  page: Page,
  label: string,
  option: string | RegExp,
) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page
    .getByRole("option", { name: option, exact: typeof option === "string" })
    .first()
    .click();
}
export async function confirm(page: Page, label: string | RegExp) {
  const dialog = page
    .getByRole("dialog")
    .or(page.getByRole("alertdialog"))
    .last();
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: label, exact: typeof label === "string" })
    .click();
}
