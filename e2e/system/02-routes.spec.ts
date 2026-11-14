import { test, expect, day, type Role } from "../demo/world";
import inventory from "../production/route-inventory.cjs";
interface Entry {
  route: string;
  role: Role | "guest";
  dynamic: boolean;
  source: string;
}
let ids: Record<string, string>;
test.beforeAll(async ({ world }) => {
  const f = await world.fixture("route inventory");
  const unit = await world.call<{ id: string }>(
    "designer",
    "academic/curriculum-units",
    "POST",
    {
      programId: f.program.id,
      title: "E2E route unit",
      fromDate: day(-7),
      toDate: day(14),
    },
  );
  await world.db.curriculumUnit.update({
    where: { id: unit.id },
    data: {
      status: "APPROVED",
      reviewerTeacherId: f.users.teacher.id,
      approvedAt: new Date(),
    },
  });
  await world.db.lesson.update({
    where: { id: f.lesson.id },
    data: { unitId: unit.id },
  });
  const session = await world.session(f, -1);
  const assignment = await world.call<{
    id: string;
    questions: { id: string }[];
  }>("teacher", "academic/assignments", "POST", {
    classId: f.classroom.id,
    title: "E2E route assignment",
    instructions: "Route fixture",
    dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    maxAttempts: 2,
    questions: [
      { kind: "ESSAY", prompt: "2x + 3 = 7", rubric: "x = 2", maxScore: 10 },
    ],
  });
  await world.call(
    "teacher",
    `academic/assignments/${assignment.id}/publish`,
    "POST",
    { enrollmentIds: [f.enrollment!.id] },
  );
  const recipient = await world.db.assignmentRecipient.findFirstOrThrow({
    where: { assignmentId: assignment.id },
  });
  const submission = await world.call<{ id: string }>(
    "parent",
    "academic/submissions",
    "POST",
    {
      recipientId: recipient.id,
      answers: [{ questionId: assignment.questions[0].id, answer: "x = 2" }],
    },
  );
  ids = {
    class: f.classroom.id,
    program: f.program.id,
    student: f.student.id,
    parent: f.users.parent.id,
    teacher: f.users.teacher.id,
    staff: f.users.staff.id,
    unit: unit.id,
    session: session.id,
    assignment: assignment.id,
    submission: submission.id,
  };
});
function resolve(route: string) {
  const id = route.includes("/catalog/programs/")
    ? ids.program
    : route.includes("/classes/")
      ? ids.class
      : route.includes("/students/")
        ? ids.student
        : route.includes("/parents/")
          ? ids.parent
          : route.includes("/teachers/")
            ? ids.teacher
            : route.includes("/system/staff/")
              ? ids.staff
              : route.includes("/curriculum/")
                ? ids.unit
                : route.includes("/attendance/")
                  ? ids.session
                  : route.includes("/grading/")
                    ? ids.submission
                    : ids.assignment;
  return route.replace(/\[[^\]]+\]/g, id);
}
for (const [index, entry] of (inventory.routes as Entry[]).entries()) {
  test(`page ${String(index + 1).padStart(2, "0")} ${entry.route}`, async ({
    actors,
    page: guest,
  }, info) => {
    const page = entry.role === "guest" ? guest : await actors.open(entry.role);
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500)
        problems.push(
          `${response.status()} ${new URL(response.url()).pathname}`,
        );
    });
    const route = entry.dynamic ? resolve(entry.route) : entry.route;
    const response = await page.goto(route);
    await page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => {});
    expect(response?.status(), route).toBe(
      route.startsWith("/dev/") ? 404 : 200,
    );
    await expect(page.locator("h1").first()).toBeVisible();
    expect(problems).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      "Page exceeds a 390px viewport",
    ).toBeLessThanOrEqual(391);
    if (entry.dynamic || route.includes("dashboard"))
      await info.attach("mobile", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
  });
}

test("unauthenticated redirects retain the public origin", async ({
  request,
}) => {
  for (const route of [
    "/manager/dashboard",
    "/staff/dashboard",
    "/teacher/dashboard",
  ]) {
    const response = await request.get(route, {
      maxRedirects: 0,
      headers: { Host: "browser.example.test" },
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(
      "http://browser.example.test/login",
    );
  }
});
