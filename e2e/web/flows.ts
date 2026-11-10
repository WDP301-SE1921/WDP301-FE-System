import { expect, type BrowserContext, type Page } from "@playwright/test";

import { WEB_URL, chooseCard, pickSelect } from "./helpers";

/** Quản lý tạo một khóa học (môn + khối) rồi tìm lại nó trong danh sách. Trả về id khóa (từ `?program=`). */
export async function createCourse(page: Page, input: { subject: string; grade: number; name: string }) {
  await page.goto("/manager/curriculum");
  await page.getByRole("button", { name: "Tạo khóa học" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Tạo khóa học" });
  await expect(dialog).toBeVisible();
  await chooseCard(dialog, input.subject);
  await chooseCard(dialog, `Khối ${input.grade}`);
  await dialog.getByLabel("Tên khóa học").fill(input.name);
  await dialog.getByRole("button", { name: "Tạo khóa học" }).click();
  await expect(dialog).toBeHidden();
  await page.getByPlaceholder("Tìm khóa học…").fill(input.name);
  await page.getByRole("button", { name: `Xem khóa ${input.name}` }).click();
  await page.waitForURL(/[?&]program=/);
  return new URL(page.url()).searchParams.get("program") ?? "";
}

/** Thiết kế giáo trình tạo giáo trình nháp cho một khóa; trả về id giáo trình. */
export async function createDraftUnit(
  page: Page,
  input: { course: string; title: string; from: string; to: string },
) {
  await page.goto("/manager/curriculum?tab=curriculum");
  await page.getByRole("button", { name: "Tạo giáo trình" }).first().click();
  await pickSelect(page, page.locator("#unit-program"), new RegExp(input.course));
  await page.locator("#unit-title").fill(input.title);
  await page.locator("#unit-from").fill(input.from);
  await page.locator("#unit-to").fill(input.to);
  await page.getByRole("button", { name: "Tạo giáo trình nháp" }).click();
  await page.waitForURL(/\/manager\/curriculum\/[^/?]+/);
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

/** Gọi BFF (`/api/backend/...`) bằng phiên của context; bỏ vỏ `{ success, data }` nếu có. */
export async function bff<T>(
  context: BrowserContext,
  path: string,
  init: { method?: "GET" | "POST" | "DELETE" | "PATCH"; data?: unknown; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: T }> {
  const response = await context.request.fetch(`/api/backend/${path}`, {
    method: init.method ?? "GET",
    data: init.data,
    // BFF chỉ nhận thao tác ghi có Origin của chính web (chống CSRF).
    headers: { Origin: WEB_URL, ...init.headers },
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  const body =
    parsed && typeof parsed === "object" && "data" in (parsed as object) ? (parsed as { data: T }).data : parsed;
  return { status: response.status(), body: body as T };
}
