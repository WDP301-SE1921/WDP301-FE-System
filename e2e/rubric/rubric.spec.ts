import { test, expect } from "@playwright/test";
import { normalizeGradeSuggestion } from "../../src/features/grading/suggestions";
import type { AssignmentQuestion } from "../../src/types/academic-workflows";
import { academicRoles } from "../../src/lib/api/backend-permissions";

test("AI criteria are matched by ID, and invalid criterion sets are rejected", () => {
  const question: AssignmentQuestion = {
    id: "q",
    kind: "ESSAY",
    prompt: "Giải",
    maxScore: 4,
    choices: null,
    criteria: [
      { id: "method", title: "Phương pháp", description: "", maxScore: 3 },
      { id: "result", title: "Kết quả", description: "", maxScore: 1 },
    ],
  };
  const suggestion = {
    questionId: "q",
    score: 99,
    feedback: "Đúng một phần",
    criteria: [
      { criterionId: "result", score: 1, feedback: "Đúng" },
      { criterionId: "method", score: 2, feedback: "Thiếu bước" },
    ],
  };
  const normalized = normalizeGradeSuggestion(question, suggestion);
  expect(normalized?.score).toBe(3);
  expect(normalized?.criteria?.map((c) => c.criterionId)).toEqual([
    "method",
    "result",
  ]);
  expect(
    normalizeGradeSuggestion(question, {
      ...suggestion,
      criteria: [suggestion.criteria[0]],
    }),
  ).toBeUndefined();
  expect(
    normalizeGradeSuggestion(question, {
      ...suggestion,
      criteria: [suggestion.criteria[0], suggestion.criteria[0]],
    }),
  ).toBeUndefined();
  expect(
    normalizeGradeSuggestion(question, {
      ...suggestion,
      criteria: [
        { ...suggestion.criteria[0], score: 2 },
        suggestion.criteria[1],
      ],
    }),
  ).toBeUndefined();
});

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "edugrade_access",
      value: "isolated-ui-fixture",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
});

test("teacher approval immediately makes the CLO set available for new assignments", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:3100/__fixtures/clo", {
    data: { status: "DRAFT" },
  });
  await page.goto("/teacher/curriculum?tab=outcomes");
  await page
    .getByRole("button", { name: "Duyệt bộ mục tiêu", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("không cần Quản lý duyệt thêm");
  await dialog
    .getByRole("button", { name: "Duyệt bộ mục tiêu", exact: true })
    .click();
  // ApiForm hỏi lại trước khi gửi: bấm nút trong hộp xác nhận.
  const confirm = page.getByRole("alertdialog").or(page.getByRole("dialog")).last();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/outcome-sets/clo-set/technical-approve") &&
      r.request().method() === "POST",
  );
  await confirm
    .getByRole("button", { name: "Duyệt bộ mục tiêu", exact: true })
    .click();
  expect((await (await response).json()).data.status).toBe("APPROVED");
  await expect(
    page.getByText("Đã duyệt áp dụng", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Duyệt bộ mục tiêu", exact: true }),
  ).toHaveCount(0);
  expect(
    academicRoles("POST", "academic/outcome-sets/clo-set/approve"),
  ).toBeNull();
  await page.goto("/teacher/assignments/new");
  await page
    .getByRole("combobox", { name: "Lớp được giao", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Toán 8 — Demo", exact: true })
    .click();
  await page
    .getByRole("combobox", {
      name: "Mục tiêu khóa học (không bắt buộc)",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("option", { name: /Toán 8 cơ bản · bản 1/ }),
  ).toBeVisible();
});

test("manager requests a new CLO revision without an approval gate or revoking the current set", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:3100/__fixtures/clo", {
    data: { status: "APPROVED" },
  });
  await context.addCookies([
    {
      name: "edugrade_access",
      value: "isolated-ui-manager",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto(
    "/manager/curriculum?tab=programs&program=program&programTab=outcomes",
  );
  await expect(
    page.getByRole("button", { name: "Duyệt bộ mục tiêu", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Yêu cầu điều chỉnh", exact: true })
    .click();
  const dialog = page.getByRole("dialog").last();
  await dialog
    .getByLabel("Cần sửa gì", { exact: true })
    .fill("Bổ sung phạm vi của chuẩn đầu ra");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/outcome-sets/clo-set/request-changes") &&
      r.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Gửi yêu cầu điều chỉnh", exact: true })
    .click();
  expect((await (await response).json()).data.status).toBe("APPROVED");
  await expect(
    page.getByText("Bổ sung phạm vi của chuẩn đầu ra", { exact: true }),
  ).toBeVisible();
});

test("teacher adds rubric criteria and uploads a private-by-default file", async ({
  page,
}) => {
  await page.goto("/teacher/assignments/draft/edit");
  await page
    .getByRole("button", { name: "Thêm tiêu chí", exact: true })
    .click();
  await page.getByLabel("Tên tiêu chí 1", { exact: true }).fill("Phương pháp");
  await page
    .getByLabel("Hướng dẫn chấm và điểm một phần", { exact: true })
    .fill("Đúng phép biến đổi");
  const rubric = page.getByRole("region", { name: "Rubric câu 1" });
  await rubric.getByLabel("Điểm tối đa", { exact: true }).fill("4");
  await expect(rubric).toContainText("Đã phân bổ 4/4 điểm");
  await page.getByLabel("Thêm file / ảnh", { exact: true }).setInputFiles({
    name: "de-bai.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  await expect(
    page.getByRole("checkbox", {
      name: "Chỉ giáo viên xem (đáp án/hướng dẫn chấm)",
    }),
  ).toBeChecked();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "e2e/.results/rubric-editor.png",
    fullPage: true,
  });
  const request = page.waitForRequest(
    (req) =>
      req.method() === "PATCH" &&
      req.url().includes("academic/assignments/draft"),
  );
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  const payload = (await request).postDataJSON();
  expect(payload.questions[0].criteria[0]).toMatchObject({
    title: "Phương pháp",
    maxScore: 4,
  });
  expect(payload.files[0]).toMatchObject({
    fileId: "uploaded",
    teacherOnly: true,
  });
});

test("importing questions preserves a rubric drafted before entering the question text", async ({
  page,
}) => {
  await page.goto("/teacher/assignments/draft/edit");
  await page.getByLabel("Đề bài", { exact: true }).fill("");
  await page
    .getByLabel("Barem dạng văn bản (bài cũ)", { exact: true })
    .fill("");
  await page
    .getByRole("button", { name: "Thêm tiêu chí", exact: true })
    .click();
  const rubric = page.getByRole("region", {
    name: "Rubric câu 1",
    exact: true,
  });
  await rubric
    .getByLabel("Tên tiêu chí 1", { exact: true })
    .fill("Tiêu chí cần giữ");
  await page
    .getByRole("button", { name: "Nhập câu hỏi từ file", exact: true })
    .click();
  await page
    .getByLabel("File bài tập / đề kiểm tra", { exact: true })
    .setInputFiles({
      name: "cau-hoi.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "kind,prompt,choices,correctAnswer,rubric,maxScore\nESSAY,Cau hoi,,,Barem,4",
      ),
    });
  await page
    .getByRole("button", { name: "Đọc file và xem trước", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm vào bản nháp", exact: true })
    .click();
  await expect(
    rubric.getByLabel("Tên tiêu chí 1", { exact: true }),
  ).toHaveValue("Tiêu chí cần giữ");
  await expect(page.getByLabel("Đề bài", { exact: true }).nth(1)).toHaveValue(
    "Câu nhập từ CSV",
  );
});

test("teacher sees image reading, applies criterion suggestions and saves detailed scores", async ({
  page,
}) => {
  await page.goto("/teacher/grading/submission?assignmentId=assignment");
  await page.getByRole("button", { name: "Gợi ý AI", exact: true }).click();
  await expect(
    page.getByText("AI đọc bài · Đã đọc", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Tệp 1, trang 1", { exact: true })).toBeVisible();
  await page
    .getByRole("button", {
      name: "Dùng gợi ý AI cho các câu đã đọc",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Phương pháp · tối đa 3")).toHaveValue("2");
  await expect(page.getByLabel("Kết quả · tối đa 1")).toHaveValue("1");
  await expect(page.getByText("Tổng câu: 3/4", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "e2e/.results/rubric-grading.png",
    fullPage: true,
  });
  const request = page.waitForRequest(
    (req) =>
      req.method() === "POST" &&
      req.url().endsWith("/submissions/submission/grades"),
  );
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  const payload = (await request).postDataJSON();
  expect(payload.expectedRevision).toBe(0);
  expect(payload.scores[0].criteria).toEqual([
    { criterionId: "method", score: 2, feedback: "Thiếu bước chuyển vế" },
    { criterionId: "result", score: 1, feedback: "Đúng nghiệm" },
  ]);
});
