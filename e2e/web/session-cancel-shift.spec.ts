import { randomUUID } from "node:crypto";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { ROLES, type WebRole } from "../../src/constants/roles";
import { bff } from "./flows";
import { BACKEND_URL, backendToken, chooseCard, inRole, parentNotifications, pickSelect, suffix, vnDate, closeSessions, type RoleSession } from "./helpers";

/**
 * Hủy buổi lẻ trên lớp seed `Toán 9A` (GV teacher@, phụ huynh parent.3@), các buổi gần nhất còn lại.
 * Mỗi lần chạy dùng khoảng 4 buổi của lớp (seed không tự bù): hết buổi thì reseed database thử.
 * Seed dùng chung nên mọi so sánh là tương đối (đọc chuỗi bài trước rồi so sau), không hard-code số bài.
 */
const CLASS_ID = "seed_demo_v1_class_math-9-a";
// Đơn nghỉ cần học sinh đang học: Vật lý 8A có ghi danh ACTIVE (test này không hủy buổi nào nên không tốn buổi).
const LEAVE_CLASS_ID = "seed_demo_v1_class_physics-8-a";
const PARENT = "parent.3@edugrade.local";
const STAFF = "staff@edugrade.local";
const sfx = suffix();

interface Session {
  id: string;
  startsAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  cancelReason?: string | null;
  revision?: number;
  lesson: { id: string; title: string; kind: string; unitId?: string | null; sequence?: number } | null;
}

const opened: RoleSession[] = [];
let manager: Page;
let managerContext: BrowserContext;

async function open(browser: Parameters<typeof inRole>[0], role: WebRole) {
  const session = await inRole(browser, role);
  opened.push(session);
  return session;
}

/** Buổi của lớp từ ngày mai tới 14 tuần sau, theo thứ tự thời gian. */
async function sessionsOf(status?: Session["status"], classId = CLASS_ID) {
  const query = new URLSearchParams({
    classId,
    fromDate: vnDate(1),
    toDate: vnDate(100),
    page: "1",
    limit: "100",
  });
  const result = await bff<Session[]>(managerContext, `academic/scheduled-sessions?${query}`);
  expect(result.status).toBe(200);
  return result.body
    .filter((item) => !status || item.status === status)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

// So sánh theo id bài (tên bài có thể trùng giữa các tháng).
/** BE chỉ dời bài LESSON trong cùng giáo trình: bỏ bài kiểm tra và buổi của giáo trình khác ở cuối chuỗi. */
function lessonChain(rows: Session[]) {
  const unit = rows.find((row) => row.lesson?.kind === "LESSON")?.lesson?.unitId;
  return rows.filter((row) => row.lesson?.kind === "LESSON" && row.lesson.unitId === unit);
}

const titles = (rows: Session[]) => rows.map((row) => row.lesson?.id ?? "(không có bài)");

async function openCancel(session: Session, classId = CLASS_ID) {
  const date = new Date(Date.parse(session.startsAt) + 7 * 3_600_000).toISOString().slice(0, 10);
  await manager.goto(
    `/manager/schedule?classId=${classId}&view=list&date=${date}&session=${session.id}&sessionTab=cancel`,
  );
  await expect(manager.getByText("Buổi này xử lý thế nào?")).toBeVisible();
}

async function pickReason(reason: string) {
  await pickSelect(manager, manager.locator("#cancel-reason"), reason);
}

test.describe.serial("Hủy buổi: đổi ngày, hủy dời bài, hủy bỏ bài", () => {
  let cancelledBefore = 0;

  test.beforeAll(async ({ browser }) => {
    const session = await open(browser, ROLES.CENTER_MANAGER);
    manager = session.page;
    managerContext = session.context;
    expect(
      (await sessionsOf("SCHEDULED")).length,
      "Seed đã dùng hết buổi của lớp Toán 9A: dựng database thử MỚI (migrate + seed) rồi chạy lại",
    ).toBeGreaterThanOrEqual(10);
    // Dọn đơn nghỉ `e2e-` còn sót từ lần chạy trước (kẻo chặn việc hủy buổi).
    const staff = await open(browser, ROLES.STAFF);
    const old = await bff<{ items?: { id: string; reason: string; status: string }[] } | { id: string; reason: string; status: string }[]>(
      staff.context,
      "academic/leaves?page=1&limit=100",
    );
    const rows = Array.isArray(old.body) ? old.body : (old.body?.items ?? []);
    for (const leave of rows)
      if (leave.reason?.startsWith("e2e-") && ["PENDING", "APPROVED"].includes(leave.status))
        await bff(staff.context, `academic/leaves/${leave.id}/cancel`, { method: "POST" });
    cancelledBefore = (await parentNotifications(browser, PARENT, { type: "SESSION_CANCELLED", classId: CLASS_ID })).length;
  });

  test.afterAll(async () => {
    await closeSessions(opened);
  });

  test("Ba cách xử lý theo thứ tự, mặc định Đổi sang ngày khác", async () => {
    const [, target] = lessonChain(await sessionsOf("SCHEDULED"));
    await openCancel(target);
    const options = manager.getByRole("radio");
    await expect(options.nth(0)).toBeChecked();
    await expect(manager.locator("label").nth(0)).toBeVisible();
    const labels = await manager.locator("fieldset label").allInnerTexts();
    expect(labels[0]).toContain("Đổi sang ngày khác (khuyên dùng)");
    expect(labels[1]).toContain("Hủy và dời bài sang buổi sau");
    expect(labels[2]).toContain("Hủy, bỏ bài này");
    await expect(manager.getByRole("button", { name: "Chọn ngày giờ mới" })).toBeVisible();
    await expect(manager.getByRole("button", { name: "Xác nhận hủy buổi" })).toHaveCount(0);
  });

  test("Hủy và dời bài: buổi sau lấy bài sớm hơn một bài, không lặp, không mất", async () => {
    const before = lessonChain(await sessionsOf("SCHEDULED"));
    const cancelled = before[1];
    const after = before.slice(2, 6);
    await openCancel(cancelled);
    await chooseCard(manager, "Hủy và dời bài sang buổi sau");
    await expect(manager.getByText(/Bài học của \d+ buổi sau sẽ đổi/)).toBeVisible();
    await pickReason("Giáo viên bận đột xuất");
    await manager.getByRole("button", { name: "Xác nhận hủy buổi" }).click();

    await expect
      .poll(async () => (await sessionsOf()).find((item) => item.id === cancelled.id)?.status)
      .toBe("CANCELLED");
    const now = lessonChain(await sessionsOf("SCHEDULED"));
    // Buổi bị hủy rời khỏi chuỗi, bài của nó sang buổi liền sau; các buổi sau lấy bài của buổi trước nó.
    const expected = titles([before[1], ...after.slice(0, 3)]);
    expect(titles(now.slice(1, 5))).toEqual(expected);
    expect(now.map((item) => item.id)).not.toContain(cancelled.id);
    expect(new Set(titles(now.slice(0, 8))).size, "không bài nào lặp trong 8 buổi đầu").toBe(
      titles(now.slice(0, 8)).length,
    );
  });

  test("Hủy, bỏ bài: bài không xếp lại, các buổi sau giữ nguyên bài", async () => {
    const before = lessonChain(await sessionsOf("SCHEDULED"));
    const dropped = before[3];
    const after = before.slice(4, 8);
    await openCancel(dropped);
    await chooseCard(manager, "Hủy, bỏ bài này");
    await expect(manager.getByText(/sẽ không được\s+xếp lại/)).toBeVisible();
    await pickReason("Nghỉ lễ");
    await manager.getByRole("button", { name: "Xác nhận hủy buổi" }).click();

    await expect
      .poll(async () => (await sessionsOf()).find((item) => item.id === dropped.id)?.status)
      .toBe("CANCELLED");
    const now = lessonChain(await sessionsOf("SCHEDULED"));
    expect(titles(now.slice(3, 7))).toEqual(titles(after));
    const lessonsLeft = new Set(titles(now));
    expect(lessonsLeft.has(dropped.lesson?.id ?? "")).toBe(false);
  });

  test("Đơn nghỉ đang chờ chặn việc hủy buổi (LEAVE_EXISTS)", async ({ browser }) => {
    const staff = await open(browser, ROLES.STAFF);
    const klass = await bff<{ enrollments?: { items?: { id: string; status: string; startDate: string; endDate: string }[] } }>(
      staff.context,
      `classes/${LEAVE_CLASS_ID}`,
    );
    const enrollment = klass.body.enrollments?.items?.find((item) => item.status === "ACTIVE");
    const enrollmentId = enrollment?.id;
    // Đơn nghỉ phải nằm trong kỳ ghi danh đang học (OUTSIDE_ENROLLMENT): lấy buổi gần nhất trong kỳ đó.
    const blocked = (await sessionsOf("SCHEDULED", LEAVE_CLASS_ID)).find((item) => {
      const date = new Date(Date.parse(item.startsAt) + 7 * 3_600_000).toISOString().slice(0, 10);
      return !!enrollment && date >= enrollment.startDate.slice(0, 10) && date <= enrollment.endDate.slice(0, 10);
    });
    expect(blocked, "không còn buổi nào trong kỳ ghi danh để thử đơn nghỉ").toBeTruthy();
    if (!blocked) return;
    expect(enrollmentId, "lớp seed phải có học sinh ghi danh").toBeTruthy();
    const day = vnDate(0);
    const leaveDay = new Date(Date.parse(blocked.startsAt) + 7 * 3_600_000).toISOString().slice(0, 10);
    expect(leaveDay >= day).toBe(true);
    const leave = await bff<{ id: string }>(staff.context, "academic/leaves", {
      method: "POST",
      data: {
        enrollmentId,
        kind: "SINGLE_ABSENCE",
        sessionId: blocked.id,
        fromDate: leaveDay,
        toDate: leaveDay,
        reason: `e2e-${sfx}`,
      },
    });
    expect(leave.status, JSON.stringify(leave.body)).toBeLessThan(300);
    try {
      await openCancel(blocked, LEAVE_CLASS_ID);
      await chooseCard(manager, "Hủy, bỏ bài này");
      await expect(manager.getByRole("alert")).toContainText("Buổi có đơn xin nghỉ đang chờ hoặc đã duyệt.");
      await expect(manager.getByRole("button", { name: "Xác nhận hủy buổi" })).toBeDisabled();
      const still = (await sessionsOf(undefined, LEAVE_CLASS_ID)).find((item) => item.id === blocked.id);
      expect(still?.status).toBe("SCHEDULED");
    } finally {
      await bff(staff.context, `academic/leaves/${leave.body.id}/cancel`, { method: "POST" });
    }
  });

  test("Nhân viên không hủy được buổi: không có tab thao tác và API trả 403 FORBIDDEN", async ({ browser }) => {
    const [target] = lessonChain(await sessionsOf("SCHEDULED"));
    const staff = await open(browser, ROLES.STAFF);
    await staff.page.goto(`/manager/schedule?classId=${CLASS_ID}&view=list&session=${target.id}&sessionTab=cancel`);
    await expect(staff.page.getByRole("tab", { name: "Hủy buổi" })).toHaveCount(0);

    const token = await backendToken(browser, STAFF);
    const context = await browser.newContext();
    try {
      const response = await context.request.post(`${BACKEND_URL}/academic/sessions/${target.id}/cancel`, {
        headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": randomUUID() },
        data: { reason: "e2e", expectedRevision: 1 },
      });
      expect(response.status()).toBe(403);
      const body = (await response.json()) as { error?: { code?: string }; code?: string };
      expect(body.error?.code ?? body.code).toBe("FORBIDDEN");
    } finally {
      await context.close();
    }
  });

  test("Phụ huynh nhận 1 thông báo hủy cho mỗi buổi đã hủy (2 buổi)", async ({ browser }) => {
    await expect
      .poll(
        async () =>
          (await parentNotifications(browser, PARENT, { type: "SESSION_CANCELLED", classId: CLASS_ID })).length -
          cancelledBefore,
        { timeout: 30_000 },
      )
      .toBe(2);
  });
});
