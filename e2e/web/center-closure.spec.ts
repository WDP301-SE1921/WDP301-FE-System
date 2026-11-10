import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { ROLES } from "../../src/constants/roles";
import { bff } from "./flows";
import { closeSessions, inRole, parentNotifications, pickSelect, suffix, vnDate, type RoleSession } from "./helpers";

/**
 * Ngày nghỉ trung tâm trên lớp seed `Toán 8B` (phụ huynh parent.3@), từ hôm nay + 35 ngày.
 * Ngày nghỉ áp cho cả trung tâm nên mọi assert theo từng lớp / từng buổi, không theo tổng toàn trung tâm.
 */
const CLASS_ID = "seed_demo_v1_class_math-8-b";
const PARENT = "parent.3@edugrade.local";
const sfx = suffix();
const REASON = `e2e-${sfx}`;

interface Session {
  id: string;
  classId?: string;
  startsAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  cancelReason?: string | null;
}
interface Closure {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

const day = (value: string) => value.slice(0, 10);
const vnDay = (iso: string) => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 10);

let session: RoleSession;
let context: BrowserContext;
let page: Page;
let from = "";
let to = "";
let notificationsBefore = 0;
let affectedTotal = 0;

async function closures() {
  const result = await bff<Closure[]>(context, "academic/center-closures?page=1&limit=100");
  expect(result.status).toBe(200);
  return result.body;
}

async function sessionsIn(classId: string | null, fromDate: string, toDate: string) {
  const query = new URLSearchParams({ fromDate, toDate, page: "1", limit: "100" });
  if (classId) query.set("classId", classId);
  const result = await bff<Session[]>(context, `academic/scheduled-sessions?${query}`);
  expect(result.status).toBe(200);
  return result.body.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Xóa ngày nghỉ `e2e-` còn sót từ lần chạy trước (hoặc của chính lần này). */
async function removeE2eClosures() {
  for (const closure of await closures()) {
    if (!closure.reason.startsWith("e2e-")) continue;
    const result = await bff(context, `academic/center-closures/${closure.id}`, { method: "DELETE" });
    expect(result.status, `xóa ngày nghỉ ${closure.id}`).toBeLessThan(300);
  }
}

async function openSheet() {
  await page.goto("/manager/schedule");
  await page.getByRole("button", { name: "Ngày nghỉ trung tâm" }).click();
  await expect(page.getByRole("dialog").first()).toBeVisible();
}

async function addClosure(fromDate: string, toDate: string, reason: string) {
  const sheet = page.getByRole("dialog").first();
  await sheet.getByRole("button", { name: /Thêm ngày nghỉ/ }).first().click();
  await sheet.locator("#closure-from").fill(fromDate);
  await sheet.locator("#closure-to").fill(toDate);
  await pickSelect(page, sheet.locator("#closure-reason"), "Khác…");
  await sheet.locator("#closure-reason-other").fill(reason);
  await sheet.getByRole("button", { name: "Lưu", exact: true }).click();
  return sheet;
}

test.describe.serial("Ngày nghỉ trung tâm: thêm, xem buổi bị ảnh hưởng, hủy theo lô", () => {
  test.beforeAll(async ({ browser }) => {
    session = await inRole(browser, ROLES.CENTER_MANAGER);
    context = session.context;
    page = session.page;
    await removeE2eClosures();
    // Chọn 2 buổi liên tiếp của 8B từ hôm nay + 45 ngày (xa các buổi spec hủy buổi lẻ dùng, vì ngày nghỉ áp cho cả trung tâm; kỳ ghi danh seed của 8B kết thúc 12/01/2027 nên không đi xa hơn được) mà khoảng đó chưa nằm trong ngày nghỉ nào.
    const existing = await closures();
    // Chỉ lấy buổi trong kỳ ghi danh của học sinh: ngoài kỳ thì buổi không có học sinh nên phụ huynh không nhận thông báo.
    const klass = await bff<{ enrollments?: { items?: { status: string; endDate: string }[] } }>(context, `classes/${CLASS_ID}`);
    const lastDay = klass.body.enrollments?.items?.find((item) => item.status === "ACTIVE")?.endDate.slice(0, 10) ?? "9999-12-31";
    const upcoming = (await sessionsIn(CLASS_ID, vnDate(45), vnDate(160))).filter(
      (item) => item.status === "SCHEDULED" && vnDay(item.startsAt) <= lastDay,
    );
    for (let index = 0; index + 1 < upcoming.length; index += 1) {
      const a = vnDay(upcoming[index].startsAt);
      const b = vnDay(upcoming[index + 1].startsAt);
      if (!existing.some((item) => day(item.fromDate) <= b && day(item.toDate) >= a)) {
        from = a;
        to = b;
        break;
      }
    }
    expect(from, "không có 2 buổi 8B liên tiếp trong kỳ ghi danh và ngoài ngày nghỉ: dựng database thử MỚI (migrate + seed) rồi chạy lại").not.toBe("");
    notificationsBefore = (await parentNotifications(browser, PARENT, { type: "SESSION_CANCELLED", classId: CLASS_ID })).length;
  });

  test.afterAll(async () => {
    await removeE2eClosures().catch(() => {});
    await closeSessions([session]);
  });

  test("Thêm ngày nghỉ không tự hủy buổi nào; hủy và dời bài theo lô thì mọi buổi 8B trong khoảng đã hủy kèm lý do", async ({ browser }) => {
    await openSheet();
    const sheet = await addClosure(from, to, REASON);
    await expect(sheet.getByText(/Đã lưu ngày nghỉ.*Thêm ngày nghỉ không tự hủy buổi đã có/)).toBeVisible();
    const shown = await sheet.getByText(/Có \d+ buổi đang nằm trong ngày nghỉ\./).innerText();
    affectedTotal = Number(/Có (\d+) buổi/.exec(shown)?.[1]);

    // Buổi 8B trong khoảng (kể cả ngày đầu và ngày cuối, giờ Việt Nam) vẫn chưa bị hủy.
    const mine = (await sessionsIn(CLASS_ID, from, to)).filter((item) => vnDay(item.startsAt) >= from && vnDay(item.startsAt) <= to);
    expect(mine.length).toBeGreaterThanOrEqual(2);
    expect(mine.every((item) => item.status === "SCHEDULED")).toBe(true);
    // Số buổi báo khớp số buổi chưa hủy toàn trung tâm trong khoảng (khi không bị cắt trang 100 dòng).
    const all = (await sessionsIn(null, from, to)).filter((item) => vnDay(item.startsAt) >= from && vnDay(item.startsAt) <= to);
    if (all.length < 100) expect(affectedTotal).toBe(all.filter((item) => item.status === "SCHEDULED").length);
    expect(affectedTotal).toBeGreaterThanOrEqual(mine.length);
    // Thêm ngày nghỉ không gửi thông báo cho phụ huynh.
    await page.waitForTimeout(3_000);
    expect((await parentNotifications(browser, PARENT, { type: "SESSION_CANCELLED", classId: CLASS_ID })).length).toBe(
      notificationsBefore,
    );

    // Hủy và dời bài theo lô ngay từ bảng kết quả vừa lưu.
    const beforeAll = (await sessionsIn(CLASS_ID, vnDate(45), vnDate(160))).filter((item) => item.status === "SCHEDULED");
    const outside = beforeAll.filter((item) => vnDay(item.startsAt) > to);
    await sheet.getByRole("button", { name: "Hủy và dời bài", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: /Hủy và dời bài các buổi trong ngày nghỉ/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Phụ huynh sẽ nhận thông báo kèm lý do/)).toBeVisible();
    await dialog.getByRole("button", { name: "Xác nhận hủy" }).click();
    const done = dialog.getByRole("button", { name: "Xong" });
    const blocked = dialog.getByRole("alert");
    await expect(done.or(blocked)).toBeVisible({ timeout: 60_000 });
    // Bị chặn (BULK_CANCEL_BLOCKED, vd có đơn nghỉ hoặc học bù trong khoảng): nêu rõ lý do thay vì chờ tới hết giờ.
    expect(await blocked.count(), `Hủy theo lô bị chặn: ${await blocked.allInnerTexts()}`).toBe(0);

    const after = await sessionsIn(CLASS_ID, from, to);
    const inRange = after.filter((item) => vnDay(item.startsAt) >= from && vnDay(item.startsAt) <= to);
    expect(inRange.length).toBeGreaterThanOrEqual(2);
    expect(inRange.every((item) => item.status === "CANCELLED")).toBe(true);
    expect(inRange.every((item) => (item.cancelReason ?? "").includes(REASON))).toBe(true);
    // Hủy dời bài: các buổi sau khoảng vẫn còn lịch (bài lùi chứ buổi không bị hủy).
    const later = (await sessionsIn(CLASS_ID, vnDay(outside[0].startsAt), vnDate(120))).filter((item) => item.status === "SCHEDULED");
    expect(later.length).toBeGreaterThan(0);

    // Phụ huynh nhận đúng 1 thông báo cho cả lô của lớp 8B (không phải 1 cho mỗi buổi).
    await expect
      .poll(
        async () =>
          (await parentNotifications(browser, PARENT, { type: "SESSION_CANCELLED", classId: CLASS_ID })).length -
          notificationsBefore,
        { timeout: 30_000 },
      )
      .toBe(1);
  });

  test("Ngày nghỉ chồng lên ngày nghỉ khác bị báo, quá 92 ngày bị báo", async () => {
    await openSheet();
    let sheet = await addClosure(from, from, `e2e-chong-${sfx}`);
    await expect(
      sheet.getByText("Khoảng ngày này trùng với một ngày nghỉ đã có. Sửa ngày nghỉ cũ thay vì thêm mới."),
    ).toBeVisible();
    await sheet.getByRole("button", { name: "Bỏ qua" }).click();

    sheet = await addClosure(vnDate(130), vnDate(130 + 95), `e2e-dai-${sfx}`);
    // Một câu duy nhất, dù web chặn trước khi gửi hay BE trả CLOSURE_TOO_LONG.
    await expect(sheet.getByText("Mỗi lần nghỉ tối đa 92 ngày. Chia thành hai lần.")).toBeVisible();
    expect((await closures()).filter((item) => item.reason.startsWith("e2e-")).map((item) => item.reason)).toEqual([REASON]);
  });

});
