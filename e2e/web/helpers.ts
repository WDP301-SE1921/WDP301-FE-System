import type { Browser, BrowserContext, Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import type { WebRole } from "../../src/constants/roles";
import fs from "node:fs";
import path from "node:path";

import { seedPassword, storageStateFor } from "./accounts";

export const WEB_URL = process.env.WEB_URL ?? "http://localhost:3001";
export const BACKEND_URL = (process.env.E2E_BACKEND_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");

/** Hậu tố duy nhất cho dữ liệu tạo mới, để chạy lại không trùng. */
export function suffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
}

/** Ngày `YYYY-MM-DD` theo giờ Việt Nam, lệch `offsetDays` ngày so với hôm nay (không dùng `toISOString`). */
export function vnDate(offsetDays = 0) {
  const base = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
  const [year, month, day] = parts.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return shifted.toISOString().slice(0, 10);
}

export interface RoleSession {
  role: WebRole;
  context: BrowserContext;
  page: Page;
}

/** Một context mới đã đăng nhập sẵn theo role (dùng cookie của `auth.setup.ts`). Đóng bằng `closeSessions`. */
export async function inRole(browser: Browser, role: WebRole): Promise<RoleSession> {
  const context = await browser.newContext({
    baseURL: WEB_URL,
    storageState: storageStateFor(role),
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  return { role, context, page };
}

/**
 * Đóng các context của spec. Nếu BFF đã làm mới token trong lúc chạy thì ghi lại file phiên của role:
 * refresh token cũ đã bị xoay, spec sau mà nạp file cũ sẽ mất phiên.
 */
/** Ghi lại phiên của các context nếu BFF đã làm mới token (refresh token cũ đã bị xoay, file cũ sẽ mất phiên). */
export async function persistSessions(sessions: RoleSession[]) {
  for (const { role, context } of sessions) {
    try {
      const file = storageStateFor(role);
      const cookies = await context.cookies();
      const access = cookies.find((cookie) => cookie.name === "edugrade_access")?.value;
      const old = JSON.parse(fs.readFileSync(file, "utf8")) as { cookies: { name: string; value: string }[] };
      if (access && access !== old.cookies.find((cookie) => cookie.name === "edugrade_access")?.value)
        await context.storageState({ path: file });
    } catch {
      /* không ghi được thì spec sau đăng nhập lại */
    }
  }
}

/** Đóng các context của spec (sau khi ghi lại phiên đã làm mới). */
export async function closeSessions(sessions: RoleSession[]) {
  await persistSessions(sessions);
  for (const { context } of sessions) await context.close().catch(() => {});
}

/** Tuần kế tiếp chưa dùng (đếm tăng dần giữa các lần chạy) để buổi học của giáo viên dùng chung không trùng lần trước. */
let weekOffset: number | undefined;

/**
 * Số ngày dịch (bội của 7) của lượt chạy này: tuần kế tiếp chưa dùng, đếm tăng dần trong `e2e/.auth/week-counter.json`
 * để buổi học của giáo viên dùng chung không trùng lần trước. Gọi lười (lúc test chạy), mỗi tiến trình chỉ đếm một lần.
 * Đổi sang database thử khác thì xóa file này.
 */
export function nextWeekOffset() {
  if (weekOffset !== undefined) return weekOffset;
  const file = path.join(path.dirname(storageStateFor("teacher")), "week-counter.json");
  let next = 1;
  try {
    next = (JSON.parse(fs.readFileSync(file, "utf8")) as { next: number }).next;
  } catch {
    /* lần đầu */
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ next: next + 1 }));
  weekOffset = 7 * next;
  return weekOffset;
}

/** Mở Select (base-ui) rồi chọn một lựa chọn theo chữ hiển thị. */
export async function pickSelect(page: Page, trigger: Locator, option: string | RegExp) {
  await trigger.click();
  await page.getByRole("option", { name: option }).first().click();
}

/** Chọn giờ `HH:mm` trong `TimeInput` (ô Giờ mang `id`, ô Phút nằm cạnh). */
export async function pickTime(page: Page, id: string, time: string) {
  const [hour, minute] = time.split(":");
  const hourTrigger = page.locator(`#${id}`);
  await pickSelect(page, hourTrigger, new RegExp(`^${hour}$`));
  const minuteTrigger = hourTrigger.locator("xpath=..").getByRole("combobox", { name: "Phút" });
  await pickSelect(page, minuteTrigger, new RegExp(`^${minute}$`));
}

const LEGACY_TERMS = [/\bCLO\b/, /Sinh lịch/, /Chuẩn đầu ra/, /bộ CLO/i];

/** Chỉ dòng ghi chú của màn Thiết kế giáo trình được nhắc tên cũ. */
const NOTE_LINE = /trước đây gọi là chuẩn đầu ra \(CLO\)/;

/** Câu chữ Q7: màn đang mở không được còn thuật ngữ cũ. */
export async function expectNoLegacyTerms(page: Page, allow: RegExp[] = [NOTE_LINE]) {
  const text = await page.locator("body").innerText();
  const lines = text.split("\n").filter((line) => !allow.some((pattern) => pattern.test(line)));
  const hit = lines.filter((line) => LEGACY_TERMS.some((pattern) => pattern.test(line)));
  expect(hit, `Thuật ngữ cũ còn trên màn ${page.url()}`).toEqual([]);
}

const tokens = new Map<string, string>();

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Đăng nhập thẳng vào BE (cho tài khoản không có phiên web, vd phụ huynh) và nhớ token trong lượt chạy.
 * BE giới hạn đăng nhập 5 lần/phút theo IP: gặp 429 thì chờ theo `Retry-After` rồi thử lại.
 */
export async function backendToken(browser: Browser, email: string) {
  const cached = tokens.get(email);
  if (cached) return cached;
  const context = await browser.newContext();
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await context.request.post(`${BACKEND_URL}/auth/login`, {
        data: { email, password: seedPassword() },
      });
      if (response.status() === 429) {
        const wait = Number(response.headers()["retry-after"] ?? 30);
        await sleep((Number.isFinite(wait) ? wait : 30) * 1000 + 500);
        continue;
      }
      expect(response.ok(), `đăng nhập BE ${email} -> ${response.status()}`).toBe(true);
      const body = (await response.json()) as { data: { tokens: { accessToken: string } } };
      tokens.set(email, body.data.tokens.accessToken);
      return body.data.tokens.accessToken;
    }
    throw new Error(`BE từ chối đăng nhập ${email} (429) quá nhiều lần`);
  } finally {
    await context.close();
  }
}

export interface ParentNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  context?: { classId?: string };
}

/** Thông báo của một phụ huynh (lọc theo loại và lớp). */
export async function parentNotifications(
  browser: Browser,
  email: string,
  filter: { type?: string; classId?: string } = {},
) {
  const token = await backendToken(browser, email);
  const context = await browser.newContext();
  try {
    const all: ParentNotification[] = [];
    // BE phân trang (mặc định ít dòng): đọc hết các trang để đếm đúng khi phụ huynh đã có nhiều thông báo.
    for (let page = 1; page <= 50; page += 1) {
      const response = await context.request.get(`${BACKEND_URL}/notifications?limit=50&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.ok(), `GET notifications ${email} -> ${response.status()}`).toBe(true);
      const body = (await response.json()) as { data: { items: ParentNotification[]; total: number } };
      all.push(...body.data.items);
      if (!body.data.items.length || all.length >= body.data.total) break;
    }
    return all.filter(
      (item) =>
        (!filter.type || item.type === filter.type) &&
        (!filter.classId || item.context?.classId === filter.classId),
    );
  } finally {
    await context.close();
  }
}

/** Chọn một thẻ ChoiceCards: radio bị ẩn (sr-only) nên bấm vào nhãn bao quanh nó. */
export async function chooseCard(scope: Page | Locator, name: string | RegExp) {
  // Nhấp nhãn như người dùng. Nhấp đầu tiên trong khoảng <1 giây sau khi hộp thoại mở bị bỏ qua
  // (đã thử: sau 1 giây thì nhận ngay), nên thử lại tới khi radio đã chọn.
  const label = scope.locator("label", { hasText: name }).first();
  await expect(async () => {
    await label.click();
    await expect(label.getByRole("radio")).toBeChecked({ timeout: 1_000 });
  }).toPass();
}
