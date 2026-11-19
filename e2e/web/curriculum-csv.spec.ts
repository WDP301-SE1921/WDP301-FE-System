import fs from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { ROLES, type WebRole } from "../../src/constants/roles";

import { createCourse, createDraftUnit, createOutcomeSet, openUnitSetup } from "./flows";
import { pickSelect, persistSessions, inRole, suffix, vnDate, closeSessions, nextWeekOffset, type RoleSession } from "./helpers";

/** Xuất giáo trình ra CSV, sửa, nhập lại thay toàn bộ (giáo trình nháp của một khóa tạo mới). */
const sfx = suffix();
const COURSE = `E2E Hóa 8 ${sfx}`;
const UNIT = `Giáo trình CSV ${sfx}`;
// File cũ không có cột Mã mục tiêu vẫn phải nhập được; file xuất ra có thêm cột outcomeCodes.
const HEADER = "kind,sequence,title,content,monthKey,csvVersion";
const EXPORT_HEADER = "kind,sequence,title,content,outcomeCodes,monthKey,csvVersion";
const CODES_HEADER = "kind,sequence,title,content,Mã mục tiêu,monthKey,csvVersion";
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
  await openUnitSetup(page, state.unitId);
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

/** Mã mục tiêu của mục tiêu vừa tạo: đọc từ trang bộ mục tiêu (dòng "<mã> · <tên>"). */
async function outcomeCodeOf(page: Page, title: string) {
  await page.goto("/manager/curriculum?tab=outcomes");
  await pickSelect(page, page.getByRole("combobox", { name: "Khóa học" }), new RegExp(COURSE));
  // Bảng mục tiêu hiện mỗi dòng dạng "<mã> · <tên mục tiêu>".
  const line = await page.getByText(" · " + title).first().innerText();
  const code = line.split(" · ")[0].trim();
  expect(code, "mã mục tiêu đứng trước dấu · cạnh tên mục tiêu").toBeTruthy();
  return code!;
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
    // L1: khóa phải có bộ mục tiêu (≥1 mục tiêu) trước khi tạo được giáo trình.
    await createOutcomeSet(page, { course: COURSE, outcome: `Mục tiêu CSV ${sfx}` });
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
    expect(exported[0]).toBe(EXPORT_HEADER);
    expect(exported, "1 dòng tiêu đề + 3 bài").toHaveLength(4);
    for (const title of TITLES) expect(exported.join("\n")).toContain(title);
    // Mỗi bài xuất ra có csvVersion = 1 ở cột cuối.
    expect(exported.slice(1).every((line) => line.endsWith(",1"))).toBe(true);

    const renamed = `${TITLES[1]} (đã sửa)`;
    const edited = [
      EXPORT_HEADER,
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
    await openUnitSetup(page, state.unitId);
    await expect(page.getByRole("heading", { name: "Bài học (3)" })).toBeVisible();
  });
  test("Cột Mã mục tiêu: mã lạ báo lỗi rõ, mã đúng hiện ở bảng xem trước và nhập được", async ({ browser }) => {
    const page = await open(browser, ROLES.CURRICULUM_DESIGNER);
    const code = await outcomeCodeOf(page, `Mục tiêu CSV ${sfx}`);
    await openImport(page);
    const withCodes = (first: string) =>
      [
        CODES_HEADER,
        `LESSON,1,${TITLES[0]},Nội dung ${TITLES[0]},"${first}",,`,
        `LESSON,2,${TITLES[1]},Nội dung ${TITLES[1]},,,`,
      ].join("\n");
    // Mã không có trong khóa: dòng lỗi, nút nhập bị khóa.
    let dialog = await chooseFile(page, withCodes(`${code}, ZZ-999`), "REPLACE");
    await expect(dialog.getByText("Mã mục tiêu không có trong khóa: ZZ-999")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Nhập vào bản nháp" })).toBeDisabled();
    // Mã đúng: bảng có cột Mục tiêu hiện mã, nhập thành công.
    dialog = await chooseFile(page, withCodes(code), "REPLACE");
    await expect(dialog.getByRole("columnheader", { name: "Mục tiêu" })).toBeVisible();
    await expect(dialog.getByRole("cell", { name: code, exact: true })).toBeVisible();
    await expect(dialog.getByText("2 dòng hợp lệ")).toBeVisible();
    await dialog.getByRole("button", { name: "Nhập vào bản nháp" }).click();
    await page
      .getByRole("dialog", { name: "Thay toàn bộ nội dung?" })
      .getByRole("button", { name: "Xác nhận", exact: true })
      .click();
    await expect(dialog.getByText("Đã nhập 2 bài học.")).toBeVisible();
    // Dữ liệu giáo trình tải lại sau khi nhập: thử xuất lại tới khi dòng bài 1 có mã.
    await expect
      .poll(async () => {
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          dialog.getByRole("button", { name: "Xuất bài ra file" }).click(),
        ]);
        const text = fs.readFileSync(await download.path(), "utf8");
        const lines = text.split(/\r?\n/);
        const first = lines.find((line) => line.includes(TITLES[0])) ?? "";
        const second = lines.find((line) => line.includes(TITLES[1])) ?? "";
        return first.includes(code) && !second.includes(code);
      })
      .toBe(true);
  });
});
