import { test, expect, day, unique } from "../demo/world";

test("@latest Phụ huynh xem CLO cấp bài dù câu hỏi không gắn CLO, không thấy cả bộ mục tiêu", async ({
  world,
  actors,
}) => {
  const f = await world.fixture("parent assignment CLO");
  const unmeasured = await world.db.learningOutcome.create({
    data: {
      outcomeSetId: f.outcomeSet.id,
      code: "E2E-UNMEASURED-02",
      title: unique("Mục tiêu không đo trong bài này"),
      statement:
        "Mục tiêu khác thuộc cùng bộ nhưng không được chọn cho bài tập.",
      lessonLinks: { create: { lessonId: f.lesson.id } },
    },
  });
  await world.call(
    "teacher",
    `academic/outcome-sets/${f.outcomeSet.id}/technical-approve`,
    "POST",
  );
  const assignment = await world.call<{ id: string }>(
    "teacher",
    "academic/assignments",
    "POST",
    {
      classId: f.classroom.id,
      title: unique("Bài tập gắn CLO cấp bài"),
      instructions: "Giải phương trình và kiểm tra nghiệm.",
      dueAt: `${day(7)}T12:00:00Z`,
      maxAttempts: 1,
      outcomeIds: [f.outcome.id],
      questions: [
        {
          kind: "ESSAY",
          prompt: "Giải 2x + 3 = 7",
          maxScore: 10,
          rubric: "Nghiệm x = 2",
        },
      ],
    },
  );
  await world.call(
    "teacher",
    `academic/assignments/${assignment.id}/publish`,
    "POST",
    { enrollmentIds: [f.enrollment!.id] },
  );
  const detail = await world.call<{
    outcomes: { id: string; code: string }[];
    questions: { outcomeId?: string | null }[];
  }>("parent", `academic/assignments/${assignment.id}`);
  expect(detail.outcomes).toEqual([
    expect.objectContaining({ id: f.outcome.id, code: f.outcome.code }),
  ]);
  expect(detail.questions.every((question) => !question.outcomeId)).toBe(true);
  const parent = await actors.open("parent");
  await parent.goto(`/assignments/${assignment.id}?studentId=${f.student.id}`);
  await expect(
    parent.getByText(f.outcome.title, { exact: true }),
  ).toBeVisible();
  await expect(parent.getByText(unmeasured.title, { exact: true })).toHaveCount(
    0,
  );
  await actors.shot(parent, "latest-parent-assignment-clo");
});
