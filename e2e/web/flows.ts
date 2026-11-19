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

/**
 * Thiết kế giáo trình tạo bộ Mục tiêu khóa học (nháp) có 1 mục tiêu cho khóa. BE chỉ cho tạo giáo trình khi khóa
 * đã có bộ mục tiêu với ít nhất 1 mục tiêu (OUTCOMES_REQUIRED), nên mọi luồng dựng giáo trình gọi hàm này trước.
 */
export async function createOutcomeSet(page: Page, input: { course: string; outcome: string }) {
  await page.goto("/manager/curriculum?tab=outcomes");
  await pickSelect(page, page.getByRole("combobox", { name: "Khóa học" }), new RegExp(input.course));
  await page.getByRole("button", { name: "Tạo bộ mục tiêu" }).first().click();
  const create = page.getByRole("dialog", { name: "Tạo bộ mục tiêu" });
  await expect(create).toBeVisible();
  await create.getByRole("button", { name: "Tạo bộ mục tiêu" }).click();
  await expect(create).toBeHidden();
  await page.getByRole("button", { name: "Thêm mục tiêu" }).first().click();
  const add = page.getByRole("dialog", { name: /mục tiêu/i });
  await expect(add).toBeVisible();
  await add.getByLabel("Mục tiêu (phụ huynh sẽ đọc)").fill(input.outcome);
  await add.getByRole("button", { name: "Thêm mục tiêu" }).click();
  await expect(add).toBeHidden();
  await expect(page.getByText(input.outcome).first()).toBeVisible();
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
  await page.waitForURL((url) => unitIdFromUrl(url) !== "");
  return unitIdFromUrl(new URL(page.url()));
}

/** Id giáo trình từ `/manager/curriculum/<id>` (đường cũ) hoặc `/manager/curriculum/setup?unitId=<id>`. */
export function unitIdFromUrl(url: URL) {
  const fromQuery = url.searchParams.get("unitId");
  if (fromQuery) return fromQuery;
  const match = /^\/manager\/curriculum\/([^/?]+)$/.exec(url.pathname);
  return match && !["setup", "overview", "feedback"].includes(match[1]) ? match[1] : "";
}

/** Mở giáo trình bằng đường cũ `/manager/curriculum/<id>` và chờ chuyển sang trang giáo trình một trang. */
export async function openUnitSetup(page: Page, unitId: string, query = "") {
  await page.goto(`/manager/curriculum/${unitId}${query}`);
  await page.waitForURL(/\/manager\/curriculum\/setup\?/);
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

/** Chọn một dòng trong ô chọn có tìm (`SearchableSelect`): mở ô, gõ tìm, bấm dòng khớp. */
export async function pickSearchable(page: Page, name: string, search: string, option: string | RegExp) {
  await page.getByRole("combobox", { name, exact: true }).click();
  await page.getByRole("combobox", { name: new RegExp(`^${name}: `) }).fill(search);
  await page.getByRole("option", { name: option }).first().click();
}
