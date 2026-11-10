import fs from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { ROLES, type WebRole } from "../../src/constants/roles";
import { createCourse, createDraftUnit } from "./flows";
import { persistSessions, inRole, suffix, vnDate, closeSessions, nextWeekOffset, type RoleSession } from "./helpers";

/** Xuất giáo trình ra CSV, sửa, nhập lại thay toàn bộ (giáo trình nháp của một khóa tạo mới). */
const sfx = suffix();
const COURSE = `E2E Hóa 8 ${sfx}`;
const UNIT = `Giáo trình CSV ${sfx}`;
const HEADER = "kind,sequence,title,content,monthKey,csvVersion";
const TITLES = [`Bài 1 Nguyên tử ${sfx}`, `Bài 2 Phân tử ${sfx}`, `Bài 3 Phản ứng ${sfx}`];

const state = { unitId: "" };
const opened: RoleSession[] = [];

async function open(browser: Parameters<typeof inRole>[0], role: WebRole) {
  const session = await inRole(browser, role);
  opened.push(session);
  return session.page;
}

function csv(rows: string[]) {
  return [HEADER, ...rows].join("\n");
}
const row = (sequence: number, title: string, version = "") =>
  `LESSON,${sequence},${title},Nội dung ${title},,${version}`;

async function openImport(page: Page) {
  await page.goto(`/manager/curriculum/${state.unitId}`);
  await page.getByRole("button", { name: "Thêm thao tác với giáo trình" }).click();
  await page.getByRole("menuitem", { name: "Nhập bài từ file" }).click();
  const dialog = page.getByRole("dialog", { name: /Nhập bài từ file/ });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function chooseFile(page: Page, content: string, mode: "APPEND" | "REPLACE") {
  const dialog = page.getByRole("dialog", { name: /Nhập bài từ file/ });
  await dialog.locator("#curriculum-csv").setInputFiles({
    name: "giao-trinh.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(content, "utf8"),
  });
  if (mode === "REPLACE") {
    await dialog.getByRole("combobox", { name: "Chế độ nhập CSV" }).click();
    await page.getByRole("option", { name: "Thay toàn bộ bài học" }).click();
  }
  await dialog.getByRole("button", { name: "Kiểm tra file" }).click();
  return dialog;
}

test.describe.serial("Giáo trình: xuất, sửa và nhập lại bằng CSV", () => {
  test.afterEach(async () => {
    await persistSessions(opened);
  });

  test.afterAll(async () => {
    await closeSessions(opened);
  });

  test("Dựng giáo trình nháp và nhập 3 bài từ CSV", async ({ browser }) => {
    const manager = await open(browser, ROLES.CENTER_MANAGER);
    await createCourse(manager, { subject: "Hóa học", grade: 8, name: COURSE });
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    state.unitId = await createDraftUnit(page, {
      course: COURSE,
      title: UNIT,
      from: vnDate(3 + nextWeekOffset()),
      to: vnDate(9 + nextWeekOffset()),
    });
    await openImport(page);
    const dialog = await chooseFile(page, csv(TITLES.map((title, index) => row(index + 1, title))), "APPEND");
    await expect(dialog.getByText("3 dòng hợp lệ")).toBeVisible();
    await dialog.getByRole("button", { name: "Nhập vào bản nháp" }).click();
    await expect(dialog.getByText("Đã nhập 3 bài học.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Bài học (3)" })).toBeVisible();
  });

  test("Xuất file đủ dòng, tiếng Việt không vỡ; sửa 1 tên bài, để trống csvVersion, nhập lại", async ({
    browser,
  }) => {
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    const dialog = await openImport(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      dialog.getByRole("button", { name: "Xuất bài ra file" }).click(),
    ]);
    const path = await download.path();
    const exported = fs.readFileSync(path, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
    expect(exported[0]).toBe(HEADER);
    expect(exported, "1 dòng tiêu đề + 3 bài").toHaveLength(4);
    for (const title of TITLES) expect(exported.join("\n")).toContain(title);
    // Mỗi bài xuất ra có csvVersion = 1 ở cột cuối.
    expect(exported.slice(1).every((line) => line.endsWith(",1"))).toBe(true);

    const renamed = `${TITLES[1]} (đã sửa)`;
    const edited = [
      HEADER,
      ...exported.slice(1).map((line) => line.replace(TITLES[1], renamed).replace(/,1$/, ",")),
    ].join("\n");
    const form = await chooseFile(page, edited, "REPLACE");
    await expect(form.getByText("3 dòng hợp lệ")).toBeVisible();
    await form.getByRole("button", { name: "Nhập vào bản nháp" }).click();
    const confirm = page.getByRole("dialog", { name: "Thay toàn bộ nội dung?" });
    await expect(confirm).toContainText("Mục tiêu đã gắn cho các bài này sẽ bị gỡ");
    await confirm.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(form.getByText("Đã nhập 3 bài học.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Bài học (3)" })).toBeVisible();
    await expect(page.getByRole("button", { name: renamed, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: TITLES[1], exact: true })).toHaveCount(0);
  });

  test("File có dòng sai: báo số dòng lỗi, không ghi gì, số bài giữ nguyên", async ({ browser }) => {
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    await openImport(page);
    const bad = csv([row(1, TITLES[0]), "LESSON,2,,Thiếu tên bài,,", row(3, TITLES[2])]);
    const dialog = await chooseFile(page, bad, "REPLACE");
    await expect(dialog.getByText(/1 dòng lỗi/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Nhập vào bản nháp" })).toBeDisabled();
    // Tải lại trang: dữ liệu trong BE phải còn nguyên 3 bài, không bài nào bị ghi nửa chừng.
    await page.goto(`/manager/curriculum/${state.unitId}`);
    await expect(page.getByRole("heading", { name: "Bài học (3)" })).toBeVisible();
  });
});
