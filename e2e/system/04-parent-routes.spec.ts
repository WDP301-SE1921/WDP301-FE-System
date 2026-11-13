import { test, expect, day } from "../demo/world";

test("parent every static and detail route", async ({
  world,
  actors,
}, info) => {
  const f = await world.fixture("parent routes");
  const parent = await actors.open("parent");
  const session = await world.session(f, 2);
  await world.db.sessionParticipant.create({
    data: { sessionId: session.id, enrollmentId: f.enrollment!.id },
  });
  const assignment = await world.call<{ id: string }>(
    "teacher",
    "academic/assignments",
    "POST",
    {
      classId: f.classroom.id,
      title: "E2E parent routes",
      instructions: "Synthetic route fixture",
      dueAt: `${day(7)}T12:00:00Z`,
      maxAttempts: 2,
      questions: [
        { kind: "ESSAY", prompt: "2x + 3 = 7", maxScore: 10, rubric: "x = 2" },
      ],
    },
  );
  await world.call(
    "teacher",
    `academic/assignments/${assignment.id}/publish`,
    "POST",
    { enrollmentIds: [f.enrollment!.id] },
  );
  const registration = await world.db.registrationOrder.findFirstOrThrow({
    where: { enrollment: { id: f.enrollment!.id } },
  });
  // A real paid receipt is provided by the enrollment workflow; use it rather than inventing one.
  const paid = await world.db.registrationOrder.findFirstOrThrow({
    where: {
      status: "COMPLETED",
      payment: { isNot: null },
      parentEmail: f.users.parent.email,
    },
  });
  const routes = [
    "/",
    "/schedule",
    "/grades",
    "/tuition",
    "/notifications",
    "/profile",
    "/edit-account",
    "/change-password",
    "/add-child",
    "/verify-email",
    `/children/${f.student.id}`,
    `/sessions/${session.id}?studentId=${f.student.id}`,
    `/assignments/${assignment.id}?studentId=${f.student.id}`,
    `/bills/${registration.id}`,
    `/receipts/${paid.id}`,
  ];
  const errors: string[] = [];
  parent.on("pageerror", (error) => errors.push(error.message));
  parent.on("response", (response) => {
    if (response.status() >= 500)
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  for (const route of routes)
    await test.step(route, async () => {
      const response = await parent.goto(route);
      expect(response?.status()).toBe(200);
      await parent
        .waitForLoadState("networkidle", { timeout: 10000 })
        .catch(() => {});
      expect(parent.url()).not.toContain("/login");
      await expect(
        parent.getByText("Unmatched Route", { exact: true }),
      ).toHaveCount(0);
      await expect(parent.locator("body")).toHaveText(/\S/);
      expect(
        await parent.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(431);
      if (route === "/profile" || route === "/grades")
        await info.attach(`parent ${route.slice(1)}`, {
          body: await parent.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
    });
  expect(errors).toEqual([]);
});
