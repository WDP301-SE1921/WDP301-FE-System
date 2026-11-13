import { test, expect, API, day } from "../demo/world";

test("private image renders through the authenticated web origin", async ({
  world,
  actors,
  page,
  request,
}) => {
  const f = await world.fixture("https image preview");
  await page.setContent(
    '<main style="background:white;color:black;padding:32px;font:28px Arial"><h1>Câu 1</h1><p>2x + 3 = 7</p><p>x = 2</p></main>',
  );
  const image = await page.screenshot();
  const parent = await world.login("parent");
  const upload = await request.post(`${API}/academic/files`, {
    headers: { Authorization: `Bearer ${parent.tokens.accessToken}` },
    multipart: {
      file: {
        name: "private-answer.png",
        mimeType: "image/png",
        buffer: image,
      },
    },
  });
  expect(upload.status()).toBe(201);
  const asset = (await upload.json()).data;
  const assignment = await world.call<{
    id: string;
    questions: { id: string }[];
  }>("teacher", "academic/assignments", "POST", {
    classId: f.classroom.id,
    title: "E2E authenticated image",
    instructions: "Synthetic private file",
    dueAt: `${day(7)}T12:00:00Z`,
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
      fileIds: [asset.id],
      answers: [
        {
          questionId: assignment.questions[0].id,
          answer: "",
          fileIds: [asset.id],
        },
      ],
    },
  );
  const teacher = await actors.open("teacher");
  await teacher.goto(`/teacher/grading/${submission.id}`);
  const file = teacher.getByRole("region", {
    name: "Tệp bài làm 1",
    exact: true,
  });
  await file.getByRole("button", { name: "Xem tệp", exact: true }).click();
  const rendered = file.getByRole("img", {
    name: "Bài làm của học sinh, tệp 1",
    exact: true,
  });
  await expect(rendered).toBeVisible();
  await expect
    .poll(() =>
      rendered.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const source = new URL(
    (await rendered.getAttribute("src")) ?? "",
    teacher.url(),
  );
  expect(source.origin).toBe(new URL(teacher.url()).origin);
  expect(source.pathname).toBe(
    `/api/backend/academic/files/${asset.id}/content`,
  );
  const bytes = await teacher.request.get(
    `/api/backend/academic/files/${asset.id}/content`,
  );
  expect(bytes.status()).toBe(200);
  expect(bytes.headers()["content-type"]).toContain("image/png");
  expect(bytes.headers()["cache-control"]).toContain("no-store");
  expect(await bytes.body()).toEqual(image);
  const guest = await request.get(`${API}/academic/files/${asset.id}/content`);
  expect(guest.status()).toBe(401);
  const staff = await actors.open("staff");
  expect(
    (
      await staff.request.get(`/api/backend/academic/files/${asset.id}/content`)
    ).status(),
  ).toBe(403);
  await actors.shot(teacher, "authenticated-preview");
});
