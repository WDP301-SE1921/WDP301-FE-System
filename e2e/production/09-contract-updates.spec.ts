import fs from "node:fs";
import { test, expect } from "@playwright/test";
import api from "./api.cjs";

const fixture = () =>
  JSON.parse(fs.readFileSync(`${api.runtime}/fixture.json`, "utf8"));

test("production latest: class capacity follows its owned room; a room is required", async () => {
  const f = fixture();
  const room = api
    .items(
      await api.call(
        "manager",
        `rooms?search=${encodeURIComponent(f.room.name)}&limit=100`,
      ),
    )
    .find((row: { id: string }) => row.id === f.room.id);
  expect(room, "Synthetic fixture room").toBeTruthy();
  const classroom = await api.call("manager", `classes/${f.classroom.id}`);
  expect(classroom.roomId).toBe(f.room.id);
  expect(classroom.capacity).toBe(room.capacity);
  const missing = await api.raw("manager", "classes", "POST", {
    programId: f.program.id,
    name: `${f.prefix} missing room`,
    monthlyFee: 0,
  });
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({
    error: { code: "ROOM_REQUIRED" },
  });
});

test("production latest: removed cancel and center-closure endpoints stay unavailable", async () => {
  const f = fixture();
  for (const route of [
    `academic/sessions/${f.session.id}/cancel`,
    `academic/sessions/${f.session.id}/cancel-preview`,
    "academic/sessions/bulk-cancel",
    "academic/sessions/bulk-cancel-preview",
    "academic/center-closures",
  ]) {
    // Use only this run's synthetic IDs, even for a route expected to be absent.
    const response = await api.raw("manager", route, "POST", {
      sessionIds: [f.session.id],
      reason: `${f.prefix} removed endpoint check`,
    });
    expect(response.status, route).toBe(404);
  }
  const cancelledHistory = await api.raw(
    "manager",
    "academic/scheduled-sessions?status=CANCELLED&limit=1",
  );
  expect(cancelledHistory.status).toBe(200);
});

test("production latest: assignment-level CLOs reach the owning parent without per-question CLOs", async () => {
  const f = fixture();
  const assignment = await api.call("teacher", "academic/assignments", "POST", {
    classId: f.classroom.id,
    title: `${f.prefix} assignment CLO`,
    instructions: "Bài kiểm thử tổng hợp, gắn CLO ở cấp bài.",
    outcomeIds: [f.outcome.id],
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    maxAttempts: 1,
    questions: [
      {
        kind: "ESSAY",
        prompt: "Giải 2x + 3 = 7",
        rubric: "Nghiệm x = 2",
        maxScore: 10,
      },
    ],
  });
  await api.call(
    "teacher",
    `academic/assignments/${assignment.id}/publish`,
    "POST",
    { enrollmentIds: [f.enrollment.id] },
  );
  const parent = await api.call(
    "parent",
    `academic/assignments/${assignment.id}`,
  );
  expect(parent.outcomes).toEqual([
    expect.objectContaining({
      id: f.outcome.id,
      code: f.outcome.code,
      required: true,
    }),
  ]);
  expect(
    parent.questions.every(
      (question: { outcomeId?: string | null }) => !question.outcomeId,
    ),
  ).toBe(true);
});
