import { expect, test, type Page } from "@playwright/test";

import { ROLES, type WebRole } from "../../src/constants/roles";
import { bff, createCourse, createDraftUnit } from "./flows";
import { persistSessions, chooseCard, expectNoLegacyTerms, inRole, pickSelect, suffix, vnDate, closeSessions, nextWeekOffset, type RoleSession } from "./helpers";

/**
 * Luồng chuẩn bị một khóa học: Quản lý tạo khóa và lớp, Thiết kế giáo trình soạn mục tiêu và giáo trình,
 * giáo viên duyệt nội dung (kèm bộ mục tiêu, từ BE PR #12 là duyệt cuối của bộ), Quản lý duyệt áp dụng giáo
 * trình rồi tạo lịch học. Các bước phụ thuộc nhau nên chạy tuần tự.
 */
const sfx = suffix();
const COURSE = `E2E Sinh 6 ${sfx}`;
const CLASS_NAME = `Lớp E2E ${sfx}`;
const UNIT_TITLE = `Giáo trình E2E ${sfx}`;
const OUTCOME = `Nhận biết tế bào E2E ${sfx}`;
// Giáo viên teacher@ dùng chung cho mọi lần chạy: mỗi lần chọn tuần kế tiếp chưa dùng (đếm trong e2e/.auth) để buổi học không trùng
// với buổi của lần chạy trước (BE báo xung đột lịch giáo viên).
// Gọi lười: lấy tuần lúc test chạy, không phải lúc nạp tệp.
const fromDate = () => vnDate(3 + nextWeekOffset());
const toDate = () => vnDate(9 + nextWeekOffset());
const LESSONS = [`Bài 1 E2E ${sfx}`, `Bài 2 E2E ${sfx}`];

const state: { programId: string; classId: string; unitId: string } = {
  programId: "",
  classId: "",
  unitId: "",
};
const opened: RoleSession[] = [];

async function open(browser: Parameters<typeof inRole>[0], role: WebRole) {
  const session = await inRole(browser, role);
  opened.push(session);
  return session.page;
}

/** Toast chỉ là tín hiệu phụ: kiểm trạng thái trên trang là chính. */
async function dialogOf(page: Page, name: string | RegExp) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe.serial("Chuẩn bị khóa: từ tạo khóa đến tạo lịch học", () => {
  test.afterEach(async () => {
    await persistSessions(opened);
  });

  test.afterAll(async () => {
    await closeSessions(opened);
  });

  test("Quản lý tạo khóa học, checklist Chuẩn bị khóa chưa xong", async ({ browser }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    await page.goto("/manager/curriculum");
    await expect(page.getByRole("heading", { name: "Khóa học & giáo trình" })).toBeVisible();
    await expectNoLegacyTerms(page);

    await page.getByRole("button", { name: "Tạo khóa học" }).first().click();
    const dialog = await dialogOf(page, "Tạo khóa học");
    await chooseCard(dialog, "Sinh học");
    await chooseCard(dialog, "Khối 6");
    await expect(dialog.getByText("2 buổi/tuần")).toBeVisible();
    await dialog.getByLabel("Tên khóa học").fill(COURSE);
    await dialog.getByRole("button", { name: "Tạo khóa học" }).click();
    await expect(dialog).toBeHidden();

    // Danh sách dài dần theo số lần chạy: tìm đúng khóa vừa tạo.
    await page.getByPlaceholder("Tìm khóa học…").fill(COURSE);
    await page.getByRole("button", { name: `Xem khóa ${COURSE}` }).click();
    await page.waitForURL(/[?&]program=/);
    state.programId = new URL(page.url()).searchParams.get("program") ?? "";
    expect(state.programId).not.toBe("");
    const checklist = page.getByRole("list", { name: "Chuẩn bị khóa" });
    await expect(checklist).toBeVisible();
    await expect(checklist.getByText("Chưa có lớp nào")).toBeVisible();
    await expect(checklist.getByText("2 buổi mỗi tuần")).toBeVisible();
    await expectNoLegacyTerms(page);
  });

  test("Quản lý tạo lớp và lịch tuần, khóa chưa có buổi học nào", async ({ browser }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    await page.goto(`/manager/classes/new?programId=${state.programId}`);
    await page.getByLabel("Tên lớp").fill(CLASS_NAME);
    await page.locator("#wizard-fee").fill("500000");
    await page.getByRole("button", { name: "Tiếp: lịch học" }).click();
    // Khóa 2 buổi/tuần nên có sẵn 2 dòng lịch; đổi giờ sang buổi sớm để khỏi trùng lớp trong seed.
    for (const index of [0, 1]) {
      const slot = page.getByRole("group", { name: `Buổi ${index + 1}`, exact: true });
      await slot.getByRole("button", { name: "Khác…" }).click();
      await page.locator(`#wizard-start-${index}`).fill("05:30");
      await page.locator(`#wizard-end-${index}`).fill("06:30");
    }
    await page.getByRole("button", { name: "Tiếp: giáo viên và phòng" }).click();
    // teacher@ (Nguyễn Minh Đức) là tài khoản giáo viên có phiên web; lớp ở giờ sớm nên không trùng lớp Toán của thầy.
    await chooseCard(page, /Nguyễn Minh Đức/);
    await page.getByRole("button", { name: "Tạo lớp", exact: true }).click();
    await page.getByRole("button", { name: "Xem lớp" }).click();
    await page.waitForURL(/\/manager\/classes\/[^/?]+$/);
    state.classId = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(state.classId).not.toBe("");

    await page.goto(`/manager/curriculum?program=${state.programId}`);
    const checklist = page.getByRole("list", { name: "Chuẩn bị khóa" });
    await expect(checklist.getByText("1 lớp đang hoạt động")).toBeVisible();
  });

  test("Thiết kế giáo trình soạn Mục tiêu khóa học khi chưa có giáo trình", async ({ browser }) => {
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    await page.goto("/manager/curriculum?tab=outcomes");
    await pickSelect(page, page.getByRole("combobox", { name: "Khóa học" }), new RegExp(COURSE));
    await expect(page.getByText("Khóa học chưa có bộ mục tiêu")).toBeVisible();

    await page.getByRole("button", { name: "Tạo bộ mục tiêu" }).first().click();
    const create = await dialogOf(page, "Tạo bộ mục tiêu");
    await create.getByRole("button", { name: "Tạo bộ mục tiêu" }).click();
    await expect(create).toBeHidden();
    await expect(page.getByText("Bộ chưa có mục tiêu nào.")).toBeVisible();

    await page.getByRole("button", { name: "Thêm mục tiêu" }).first().click();
    const add = await dialogOf(page, /mục tiêu/i);
    await add.getByLabel("Mục tiêu (phụ huynh sẽ đọc)").fill(OUTCOME);
    // Nguồn căn cứ để trống: không bắt buộc.
    await add.getByRole("button", { name: "Thêm mục tiêu" }).click();
    await expect(add).toBeHidden();
    await expect(page.getByText(OUTCOME).first()).toBeVisible();
    await expectNoLegacyTerms(page);
  });

  test("Thiết kế giáo trình soạn giáo trình, gắn mục tiêu và gửi duyệt", async ({ browser }) => {
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    await page.goto("/manager/curriculum?tab=curriculum");
    await page.getByRole("button", { name: "Tạo giáo trình" }).first().click();
    await pickSelect(page, page.locator("#unit-program"), new RegExp(COURSE));
    await page.locator("#unit-title").fill(UNIT_TITLE);
    // Kỳ dài đúng 1 tuần, bắt đầu sau hôm nay: 2 buổi/tuần nên vừa đủ 2 bài.
    await page.locator("#unit-from").fill(fromDate());
    await page.locator("#unit-to").fill(toDate());
    await page.getByRole("button", { name: "Tạo giáo trình nháp" }).click();
    await page.waitForURL(/\/manager\/curriculum\/[^/?]+/);
    state.unitId = new URL(page.url()).pathname.split("/").pop() ?? "";
    await expect(page.getByRole("heading", { name: UNIT_TITLE })).toBeVisible();

    for (const title of LESSONS) {
      await page.getByRole("button", { name: "Thêm bài học" }).click();
      const sheet = await dialogOf(page, /bài học/i);
      await sheet.getByLabel("Tên bài học").fill(title);
      await sheet.getByLabel("Nội dung bài học").fill(`Nội dung ${title}`);
      await sheet.getByRole("button", { name: "Lưu bài học" }).click();
      await expect(sheet).toBeHidden();
      await expect(page.getByRole("button", { name: title, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Bài học (2)" })).toBeVisible();

    // Gắn mục tiêu cho bài 1 (ma trận), rồi mở lại để thấy liên kết còn đó.
    await page.getByText("Gắn mục tiêu", { exact: true }).first().click();
    await page.waitForURL(/outcomeMatrix=/);
    const box = page.getByRole("checkbox", { name: /^Gắn .* cho / }).first();
    await box.check();
    await page.getByRole("button", { name: "Lưu 1 bài" }).click();
    await expect(page.getByRole("button", { name: "Chưa có thay đổi" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: /^Gắn .* cho / }).first()).toBeChecked();

    await page.goto(`/manager/curriculum/${state.unitId}`);
    await page.getByRole("button", { name: "Gửi duyệt" }).first().click();
    const submit = await dialogOf(page, /gửi duyệt|duyệt/i);
    await pickSelect(page, submit.getByLabel("Giáo viên duyệt nội dung"), /teacher@edugrade\.local/);
    await submit.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(submit).toBeHidden();
    await expect(page.getByText(/Chờ giáo viên duyệt/i).first()).toBeVisible();
    await expectNoLegacyTerms(page);
  });

  test("Giáo viên Đồng ý nội dung, không có nút Duyệt áp dụng", async ({ browser }) => {
    const page = await open(browser, ROLES.TEACHER);
    await page.goto(`/teacher/curriculum/${state.unitId}`);
    await expect(page.getByRole("button", { name: "Duyệt áp dụng" })).toHaveCount(0);
    await page.getByRole("button", { name: "Duyệt nội dung" }).first().click();
    const decision = page.locator("#curriculum-decision");
    await expect(decision.getByText("Đồng ý nội dung")).toBeVisible();
    await expect(decision.getByText(/Mục tiêu khóa học đi cùng được duyệt luôn/)).toBeVisible();
    await decision.getByRole("button", { name: "Duyệt nội dung" }).click();
    await expect(page.getByText(/Chờ Quản lý duyệt/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Duyệt áp dụng" })).toHaveCount(0);
  });

  test("Quản lý Duyệt áp dụng giáo trình, bộ mục tiêu đã do giáo viên duyệt", async ({ browser }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    await page.goto(`/manager/curriculum/${state.unitId}`);
    await page.getByRole("button", { name: "Duyệt áp dụng", exact: true }).click();
    const confirm = page.getByRole("dialog").filter({ hasText: "Duyệt áp dụng giáo trình?" });
    // Quản lý không duyệt bộ mục tiêu nữa: hộp xác nhận không nhắc tới bộ đã duyệt.
    await expect(confirm).not.toContainText("Mục tiêu khóa học đi cùng");
    await confirm.getByRole("button", { name: "Duyệt áp dụng" }).click();
    await expect(page.getByText("Đã duyệt áp dụng giáo trình.")).toBeVisible();

    await page.goto(`/manager/curriculum?program=${state.programId}`);
    const checklist = page.getByRole("list", { name: "Chuẩn bị khóa" });
    await expect(checklist.getByText(/Bản 1 đã duyệt/)).toBeVisible();
    await expect(checklist.getByRole("button", { name: "Tạo lịch học cho 1 lớp" })).toBeVisible();
    await expectNoLegacyTerms(page);
  });

  test("Quản lý tạo lịch học: bài 1 rồi bài 2, sau đó không còn lớp cần tạo", async ({ browser }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    await page.goto(
      `/manager/sessions?programId=${state.programId}&classIds=${state.classId}&unitId=${state.unitId}`,
    );
    const preview = page.getByRole("button", { name: /^Xem trước 1 lớp$/ });
    const region = page.getByRole("region", { name: "Xem trước theo lớp" });
    const table = region.getByRole("table");
    // Mở từ checklist thì bản xem trước có thể đã chạy sẵn; nếu chưa thì bấm "Xem trước 1 lớp".
    await expect(preview.or(table)).toBeVisible({ timeout: 30_000 });
    if ((await table.count()) === 0) await preview.click();
    await expect(table).toBeVisible();
    const rows = table.getByRole("row");
    // Hàng 0 là tiêu đề; 2 buổi trong kỳ 1 tuần, bài theo đúng thứ tự.
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(1)).toContainText(LESSONS[0]);
    await expect(rows.nth(2)).toContainText(LESSONS[1]);

    await page.getByRole("button", { name: "Tạo lịch học cho 1 lớp" }).click();
    await expect(page.getByText(/Đã tạo 2 buổi/)).toBeVisible();

    // Dữ liệu đã lưu ở BE: đúng 2 buổi trong kỳ, buổi 1 là bài 1, buổi 2 là bài 2.
    const query = new URLSearchParams({ classId: state.classId, fromDate: fromDate(), toDate: toDate(), page: "1", limit: "100" });
    const saved = await bff<{ startsAt: string; status: string; lesson: { title: string } | null }[]>(
      page.context(),
      `academic/scheduled-sessions?${query}`,
    );
    expect(saved.status).toBe(200);
    const sessions = saved.body.filter((item) => item.status === "SCHEDULED").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    expect(sessions.map((item) => item.lesson?.title)).toEqual(LESSONS);

    await page.goto(`/manager/curriculum?program=${state.programId}`);
    const checklist = page.getByRole("list", { name: "Chuẩn bị khóa" });
    await expect(checklist.getByText("Mọi lớp đã có buổi học tới hết kỳ")).toBeVisible();
    await expect(checklist.getByRole("button", { name: /Tạo lịch học cho/ })).toHaveCount(0);
    await expectNoLegacyTerms(page);
  });

  test("Tạo lịch học lần 2 trùng khoảng đã có buổi bị báo bằng tiếng Việt", async ({ browser }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    await page.goto(
      `/manager/sessions?programId=${state.programId}&classIds=${state.classId}&unitId=${state.unitId}`,
    );
    await page.getByLabel("Từ ngày").fill(fromDate());
    await page.getByLabel("Đến ngày").fill(toDate());
    await page.getByRole("button", { name: /^Xem trước 1 lớp$/ }).click();
    await expect(
      page.getByText(/Lớp đã có lịch học đến ngày \d{2}\/\d{2}\/\d{4}\. Chọn ngày bắt đầu sau ngày đó\./),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo lịch học cho 0 lớp" })).toBeDisabled();
  });

  test("Nhân viên không có nút duyệt hay tạo lịch học", async ({ browser }) => {
    const page = await open(browser, ROLES.STAFF);
    await page.goto("/manager/sessions");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("button", { name: /Tạo lịch học cho/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Duyệt áp dụng/ })).toHaveCount(0);
    const blocked = await page.goto(`/manager/curriculum/${state.unitId}`);
    expect(blocked?.status()).toBe(403);
  });

  test("Hủy và dời bài buổi đầu của lớp mới: bài cuối bị đẩy ra khỏi lịch, buổi còn lại mang bài 1", async ({
    browser,
  }) => {
    const page = await open(browser, ROLES.CENTER_MANAGER);
    const query = new URLSearchParams({ classId: state.classId, fromDate: fromDate(), toDate: toDate(), page: "1", limit: "100" });
    const listed = async () => {
      const result = await bff<{ id: string; startsAt: string; status: string; lesson: { title: string } | null }[]>(
        page.context(),
        `academic/scheduled-sessions?${query}`,
      );
      return result.body.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    };
    const [first, second] = await listed();
    expect(first.lesson?.title).toBe(LESSONS[0]);
    expect(second.lesson?.title).toBe(LESSONS[1]);

    const date = new Date(Date.parse(first.startsAt) + 7 * 3_600_000).toISOString().slice(0, 10);
    await page.goto(
      `/manager/schedule?classId=${state.classId}&view=list&date=${date}&session=${first.id}&sessionTab=cancel`,
    );
    await chooseCard(page, "Hủy và dời bài sang buổi sau");
    // Giáo trình chỉ có 2 bài cho 2 buổi: bài 2 không còn buổi nào để nhận, phải được báo trước khi xác nhận.
    await expect(
      page.getByText(
        new RegExp(`Bài "${LESSONS[1]}" (bị đẩy ra khỏi lịch hiện tại và sẽ vào lần tạo lịch sau|chưa có buổi trong kỳ này)\\.\\s+Lớp chậm một bài\\.`),
      ),
    ).toBeVisible();
    await pickSelect(page, page.locator("#cancel-reason"), "Giáo viên bận đột xuất");
    await page.getByRole("button", { name: "Xác nhận hủy buổi" }).click();

    await expect
      .poll(async () => (await listed()).filter((item) => item.status === "SCHEDULED").map((item) => item.lesson?.title))
      .toEqual([LESSONS[0]]);
    const after = await listed();
    expect(after.find((item) => item.id === first.id)?.status).toBe("CANCELLED");
  });
});

/**
 * Ca biên C28: giáo trình có mục tiêu chưa gắn bài vẫn gửi và duyệt nội dung được, nhưng bộ mục tiêu
 * giữ bản nháp. Dùng khóa Toán khối 6 riêng (giáo viên dạy cùng môn gồm teacher@ nên chọn được người duyệt).
 */
test.describe.serial("Mục tiêu chưa gắn bài không chặn duyệt giáo trình", () => {
  const course = `E2E Toán 6 ${sfx}`;
  const unit = `Giáo trình biên ${sfx}`;
  const linked = `Mục tiêu đã gắn ${sfx}`;
  const lone = `Mục tiêu chưa gắn ${sfx}`;
  const ids = { unitId: "" };

  test.afterEach(async () => {
    await persistSessions(opened);
  });

  test.afterAll(async () => {
    await closeSessions(opened);
  });

  test("Soạn bộ mục tiêu 1 mục tiêu, giáo trình 1 bài, không gắn; vẫn gửi duyệt được", async ({ browser }) => {
    const manager = await open(browser, ROLES.CENTER_MANAGER);
    await createCourse(manager, { subject: "Toán", grade: 6, name: course });

    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    await page.goto("/manager/curriculum?tab=outcomes");
    await pickSelect(page, page.getByRole("combobox", { name: "Khóa học" }), new RegExp(course));
    await page.getByRole("button", { name: "Tạo bộ mục tiêu" }).first().click();
    const create = await dialogOf(page, "Tạo bộ mục tiêu");
    await create.getByRole("button", { name: "Tạo bộ mục tiêu" }).click();
    await expect(create).toBeHidden();
    await page.getByRole("button", { name: "Thêm mục tiêu" }).first().click();
    const add = await dialogOf(page, /mục tiêu/i);
    await add.getByLabel("Mục tiêu (phụ huynh sẽ đọc)").fill(linked);
    await add.getByRole("button", { name: "Thêm mục tiêu" }).click();
    await expect(add).toBeHidden();
    await page.getByRole("button", { name: "Thêm mục tiêu" }).first().click();
    const addLone = await dialogOf(page, /mục tiêu/i);
    await addLone.getByLabel("Mục tiêu (phụ huynh sẽ đọc)").fill(lone);
    await addLone.getByRole("button", { name: "Thêm mục tiêu" }).click();
    await expect(addLone).toBeHidden();
    await expect(page.getByText(lone).first()).toBeVisible();

    ids.unitId = await createDraftUnit(page, { course, title: unit, from: fromDate(), to: toDate() });
    await page.getByRole("button", { name: "Thêm bài học" }).click();
    const sheet = await dialogOf(page, /bài học/i);
    await sheet.getByLabel("Tên bài học").fill(`Bài duy nhất ${sfx}`);
    await sheet.getByLabel("Nội dung bài học").fill("Nội dung bài duy nhất");
    await sheet.getByRole("button", { name: "Lưu bài học" }).click();
    await expect(sheet).toBeHidden();
    // Chỉ gắn mục tiêu đầu cho bài; mục tiêu thứ hai để trống. Bộ chỉ "đi cùng" giáo trình khi có mục tiêu gắn vào bài của nó.
    await page.getByText("Gắn mục tiêu", { exact: true }).first().click();
    await page.waitForURL(/outcomeMatrix=/);
    await page.getByRole("checkbox", { name: /^Gắn .* cho / }).first().check();
    await page.getByRole("button", { name: "Lưu 1 bài" }).click();
    await expect(page.getByRole("button", { name: "Chưa có thay đổi" })).toBeVisible();
    await page.goto(`/manager/curriculum/${ids.unitId}`);

    // Cảnh báo báo trước, không chặn nút gửi.
    await expect(page.getByText(/Còn 1 mục tiêu chưa gắn bài/).first()).toBeVisible();
    await page.getByRole("button", { name: "Gửi duyệt" }).first().click();
    const submit = await dialogOf(page, /gửi duyệt|duyệt/i);
    await pickSelect(page, submit.getByLabel("Giáo viên duyệt nội dung"), /teacher@edugrade\.local/);
    await submit.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(submit).toBeHidden();
  });

  test("Giáo viên Đồng ý nội dung: giáo trình qua, mục tiêu chưa gắn được báo và bộ vẫn là bản nháp", async ({
    browser,
  }) => {
    const page = await open(browser, ROLES.TEACHER);
    await page.goto(`/teacher/curriculum/${ids.unitId}`);
    await page.getByRole("button", { name: "Duyệt nội dung" }).first().click();
    const decision = page.locator("#curriculum-decision");
    await expect(
      decision.getByText(/Mục tiêu khóa học chưa duyệt được vì còn mục tiêu chưa gắn bài/),
    ).toBeVisible();
    await expect(decision.getByText(/Giáo trình vẫn được duyệt/)).toBeVisible();
    await decision.getByRole("button", { name: "Duyệt nội dung" }).click();
    await expect(page.getByText(/Chờ Quản lý duyệt/i).first()).toBeVisible();

    const designer = await open(browser, ROLES.CURRICULUM_DESIGNER);
    await designer.goto("/manager/curriculum?tab=outcomes");
    await pickSelect(designer, designer.getByRole("combobox", { name: "Khóa học" }), new RegExp(course));
    await expect(designer.getByText("Bản nháp").first()).toBeVisible();
    await expect(designer.getByText(lone).first()).toBeVisible();
  });
});
