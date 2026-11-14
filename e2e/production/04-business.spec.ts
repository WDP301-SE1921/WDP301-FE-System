import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";
import files from "../demo/files.cjs";
const { config, runtime, call, raw, session, items, day } = api;
const fixtureFile = `${runtime}/fixture.json`;
const read = () => JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
const save = (value: unknown) =>
  fs.writeFileSync(fixtureFile, JSON.stringify(value, null, 2));

test("production payment receipt and actual email delivery", async ({}, info) => {
  const f = read();
  expect(Number(f.payment.quotedAmount)).toBe(0);
  expect(f.payment.status).toBe("COMPLETED");
  const receipt = await call(
    "parent",
    `registrations/${f.registration.id}/receipt`,
  );
  expect(JSON.stringify(receipt)).toContain(f.student.fullName);
  const response = await raw(
    "staff",
    `registrations/${f.registration.id}/confirm-payment`,
    "POST",
    {},
    { "Idempotency-Key": randomUUID() },
  );
  expect(response.status).toBe(409);
  const deliveries = items(
    await call(
      "manager",
      `academic/email-deliveries?search=${encodeURIComponent(config.accounts.parent)}`,
    ),
  );
  const delivery = deliveries.find(
    (e: {
      eventType: string;
      aggregateId?: string;
      dedupeKey?: string;
      recipient: string;
      createdAt: string;
    }) =>
      e.eventType === "PAYMENT_CONFIRMED" &&
      e.aggregateId === f.registration.id &&
      e.dedupeKey === `PAYMENT_CONFIRMED:${f.registration.id}` &&
      e.recipient === config.accounts.parent &&
      e.createdAt >= f.createdAt,
  );
  expect(delivery, "This run's production receipt email").toBeTruthy();
  expect(delivery.status).toBe("SENT");
  expect(delivery.attemptCount).toBeGreaterThan(0);
  expect(delivery.sentAt).toBeTruthy();
  await info.attach("real outbox delivery", {
    body: JSON.stringify({
      eventType: delivery.eventType,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      sentAt: delivery.sentAt,
      valueVnd: 0,
      inbox: "Not independently opened",
    }),
    contentType: "application/json",
  });
});

test("production image PDF AI and teacher publication", async ({
  page,
  context,
  request,
}, info) => {
  const f = read();
  await api.ensure("parent");
  await api.ensure("teacher");
  if (!f.assignment) {
    f.assignment = await call("teacher", "academic/assignments", "POST", {
      classId: f.classroom.id,
      title: `${f.prefix} image and PDF`,
      instructions: "Synthetic E2E work. Solve 2x + 3 = 7.",
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxAttempts: 2,
      questions: [1, 2].map((i) => ({
        kind: "ESSAY",
        prompt: `Câu ${i}: Giải phương trình 2x + 3 = 7.`,
        rubric: "Biến đổi 2x = 4 được 3 điểm; kết luận x = 2 được 2 điểm.",
        maxScore: 5,
      })),
    });
    save(f);
    await call(
      "teacher",
      `academic/assignments/${f.assignment.id}/publish`,
      "POST",
      { enrollmentIds: [f.enrollment.id] },
    );
  }
  if (!f.submission) {
    await page.setContent(
      '<main style="padding:40px;font:32px Arial;background:white;color:black"><h1>Câu 1</h1><p>2x + 3 = 7</p><p>2x = 4</p><p>x = 2</p></main>',
    );
    const png = await page.screenshot();
    const pdf = await files.answerPdf();
    const uploaded: { id: string }[] = f.files || [];
    for (const [name, mimeType, buffer] of (uploaded.length === 2
      ? []
      : [
          ["answer-1.png", "image/png", png],
          ["answer-2.pdf", "application/pdf", pdf],
        ]) as [string, string, Buffer][]) {
      const response = await request.post(`${config.api}/academic/files`, {
        headers: {
          Authorization: `Bearer ${session("parent").tokens.accessToken}`,
        },
        multipart: { file: { name, mimeType, buffer } },
      });
      expect(response.status()).toBe(201);
      uploaded.push((await response.json()).data);
    }
    f.files = uploaded;
    save(f);
    const recipients = items(
      await call(
        "teacher",
        `academic/assignments/${f.assignment.id}/eligible-recipients`,
      ),
    );
    const assignment = await call(
      "teacher",
      `academic/assignments/${f.assignment.id}`,
    );
    const recipient = (assignment.recipients || recipients).find(
      (r: { enrollmentId: string }) => r.enrollmentId === f.enrollment.id,
    );
    expect(recipient, "Published recipient").toBeTruthy();
    f.submission = await call("parent", "academic/submissions", "POST", {
      recipientId: recipient.id,
      fileIds: uploaded.map((file) => file.id),
      answers: f.assignment.questions.map((q: { id: string }, i: number) => ({
        questionId: q.id,
        answer: "",
        fileIds: [uploaded[i].id],
      })),
    });
    save(f);
  }
  if (!f.gradingJob || process.env.E2E_RECHECK_AI === "1") {
    f.gradingJob = await call(
      "teacher",
      `academic/submissions/${f.submission.id}/grade-ai`,
      "POST",
      {},
    );
    save(f);
  }
  let job: {
    status: string;
    result?: {
      scores: unknown[];
      readings?: unknown[];
      manualReviewQuestionIds?: string[];
    };
    errorCode?: string;
  };
  await expect
    .poll(
      async () => {
        job = await call("teacher", `academic/grading-jobs/${f.gradingJob.id}`);
        return job.status;
      },
      { timeout: 120_000, intervals: [1000, 2000, 3000] },
    )
    .toMatch(/SUCCEEDED|FAILED/);
  job = await call("teacher", `academic/grading-jobs/${f.gradingJob.id}`);
  await info.attach("production AI job", {
    body: JSON.stringify(job, null, 2),
    contentType: "application/json",
  });
  expect(job.status, job.errorCode).toBe("SUCCEEDED");
  expect(job.result?.scores).toHaveLength(2);
  expect(job.result?.manualReviewQuestionIds || []).toEqual([]);
  const hidden = await call(
    "parent",
    `academic/me/students/${f.student.id}/grades`,
  );
  if (!f.grade)
    expect(JSON.stringify(hidden)).not.toContain(f.assignment.title);
  await context.addCookies([
    {
      name: "edugrade_access",
      value: session("teacher").tokens.accessToken,
      url: config.web,
      secure: true,
      httpOnly: true,
    },
  ]);
  await page.goto(`/teacher/grading/${f.submission.id}`);
  await expect(page.locator("h1")).toBeVisible();
  await info.attach("real grading UI", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  if (!f.grade) {
    const result = job.result!;
    f.grade = await call(
      "teacher",
      `academic/submissions/${f.submission.id}/grades`,
      "POST",
      {
        scores: result.scores,
        feedback: `${f.prefix}: teacher verified the real AI suggestion.`,
      },
    );
    save(f);
    await call("teacher", `academic/grades/${f.grade.id}/approve`, "POST");
    await call("teacher", `academic/grades/${f.grade.id}/publish`, "POST");
  }
  const published = await call(
    "parent",
    `academic/me/students/${f.student.id}/grades`,
  );
  expect(JSON.stringify(published)).toContain(f.grade.feedback);
});

test("production attendance locked report and exports", async ({
  page,
  context,
  request,
}, info) => {
  const f = read();
  await api.ensure("teacher");
  if (!f.sessionAfterEnrollment) {
    f.session = await call("manager", "academic/sessions", "POST", {
      classId: f.classroom.id,
      lessonId: f.lesson.id,
      teacherId: session("teacher").user.id,
      startsAt: new Date(Date.now() - 60000).toISOString(),
      endsAt: new Date(Date.now() - 30000).toISOString(),
    });
    f.records.push({
      key: "sessionAfterEnrollment",
      kind: "session",
      id: f.session.id,
    });
    f.sessionAfterEnrollment = true;
    save(f);
  }
  await context.addCookies([
    {
      name: "edugrade_access",
      value: session("teacher").tokens.accessToken,
      url: config.web,
      secure: true,
      httpOnly: true,
    },
  ]);
  await page.goto(`/teacher/attendance/${f.session.id}`);
  if (!f.attendanceLocked) {
    await page
      .getByRole("button", {
        name: "Chuẩn bị / cập nhật danh sách học viên",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByText(f.student.fullName, { exact: true }),
  ).toBeVisible();
  const participants = items(
    await call("teacher", `academic/sessions/${f.session.id}/roster`),
  );
  const participant = participants.find(
    (p: { enrollmentId: string }) => p.enrollmentId === f.enrollment.id,
  );
  expect(participant).toBeTruthy();
  if (!f.attendanceLocked) {
    await call(
      "teacher",
      `academic/sessions/${f.session.id}/finalize-attendance`,
      "POST",
      {
        items: [{ participantId: participant.id, status: "PRESENT" }],
        summary: `${f.prefix} synthetic attendance`,
      },
    );
    f.attendanceLocked = true;
    save(f);
  }
  const repeat = await raw(
    "teacher",
    `academic/sessions/${f.session.id}/finalize-attendance`,
    "POST",
    { items: [] },
  );
  expect(repeat.status).toBe(409);
  if (!f.report) {
    f.report = await call("teacher", "academic/reports", "POST", {
      classId: f.classroom.id,
      from: day(),
      to: day(),
      includeAi: true,
    });
    save(f);
  }
  expect(f.report.aiSummary).toBeTruthy();
  for (const format of ["pdf", "xlsx"]) {
    const response = await request.get(
      `${config.api}/academic/reports/${f.report.id}/download?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${session("teacher").tokens.accessToken}`,
        },
      },
    );
    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.subarray(0, format === "pdf" ? 4 : 2).toString()).toBe(
      format === "pdf" ? "%PDF" : "PK",
    );
    await info.attach(`production report ${format}`, {
      body,
      contentType:
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  await info.attach("real AI summary", {
    body: JSON.stringify(f.report, null, 2),
    contentType: "application/json",
  });
});

test("production teacher corrects transcript and publishes grades", async ({
  page,
  context,
}, info) => {
  const f = read();
  if (!f.grade) {
    if (!f.correctedJob) {
      f.correctedJob = await call(
        "teacher",
        `academic/submissions/${f.submission.id}/grade-ai`,
        "POST",
        {
          corrections: [
            {
              questionId: f.assignment.questions[1].id,
              answer: "2x + 3 = 7\n2x = 4\nx = 2",
            },
          ],
        },
      );
      save(f);
    }
    await expect
      .poll(
        async () => {
          const job = await call(
            "teacher",
            `academic/grading-jobs/${f.correctedJob.id}`,
          );
          return job.status;
        },
        { timeout: 120000, intervals: [1000, 2000, 3000] },
      )
      .toMatch(/SUCCEEDED|FAILED/);
    const job = await call(
      "teacher",
      `academic/grading-jobs/${f.correctedJob.id}`,
    );
    expect(job.status).toBe("SUCCEEDED");
    expect(job.result.scores).toHaveLength(2);
    f.grade = await call(
      "teacher",
      `academic/submissions/${f.submission.id}/grades`,
      "POST",
      {
        scores: job.result.scores,
        feedback: `${f.prefix}: teacher verified both original files and corrected the PDF transcript.`,
      },
    );
    save(f);
    await call("teacher", `academic/grades/${f.grade.id}/approve`, "POST");
    await call("teacher", `academic/grades/${f.grade.id}/publish`, "POST");
  }
  const published = await call(
    "parent",
    `academic/me/students/${f.student.id}/grades`,
  );
  expect(JSON.stringify(published)).toContain(f.grade.feedback);
  const auth = await api.ensure("teacher");
  await context.addCookies([
    {
      name: "edugrade_access",
      value: auth.tokens.accessToken,
      url: config.web,
      secure: true,
      httpOnly: true,
    },
  ]);
  await page.goto(`/teacher/grading/${f.submission.id}`);
  await expect(page.locator("h1").first()).toBeVisible();
  await info.attach("teacher verified production grade", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
