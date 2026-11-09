import { expect, test, type Page } from "@playwright/test";

import { canAccessPath } from "../../src/constants/role-access";
import type { WebRole } from "../../src/constants/roles";
import { ROLE_ACCOUNTS } from "./accounts";

/** Mọi trang tĩnh của web (không gồm trang `[id]`), lấy từ `src/app`. */
const PAGES = [
  "/manager/dashboard",
  "/manager/students",
  "/manager/parents",
  "/manager/classes",
  "/manager/classes/new",
  "/manager/schedule",
  "/manager/sessions",
  "/manager/absences/makeup",
  "/manager/absences/swap",
  "/manager/absences/change-class",
  "/manager/absences/long-leave",
  "/manager/absences/withdraw",
  "/manager/teachers",
  "/manager/teachers/invitations",
  "/manager/teachers/substitutes",
  "/manager/catalog",
  "/manager/rooms",
  "/manager/curriculum",
  "/manager/curriculum/overview",
  "/manager/curriculum/feedback",
  "/manager/notifications",
  "/manager/notifications/emails",
  "/manager/notifications/send",
  "/manager/people",
  "/manager/system/staff",
  "/manager/system/managers",
  "/manager/system/audit-logs",
  "/manager/profile",
  "/staff/dashboard",
  "/staff/enrollments/new",
  "/staff/payments",
  "/staff/parents",
  "/staff/students",
  "/staff/classes",
  "/staff/schedule",
  "/staff/profile",
  "/staff/absences/makeup",
  "/staff/absences/swap",
  "/staff/absences/change-class",
  "/staff/absences/long-leave",
  "/staff/absences/withdraw",
  "/teacher/dashboard",
  "/teacher/schedule",
  "/teacher/classes",
  "/teacher/attendance",
  "/teacher/assignments",
  "/teacher/assignments/new",
  "/teacher/submissions",
  "/teacher/grading",
  "/teacher/feedback",
  "/teacher/reports",
  "/teacher/curriculum",
  "/teacher/profile",
];

/** Lỗi trang và API 5xx xuất hiện trong lúc mở trang. 4xx có thể hợp lệ (dữ liệu trống). */
function collectProblems(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message.slice(0, 200)}`));
  page.on("response", (response) => {
    if (response.status() >= 500 && response.url().includes("/api/"))
      problems.push(`${response.request().method()} ${new URL(response.url()).pathname} -> ${response.status()}`);
  });
  return problems;
}

test.describe("Phân quyền và hiển thị trang theo role", () => {
  for (const path of PAGES) {
    test(path, async ({ page }, testInfo) => {
      const currentRole = testInfo.project.metadata.role as WebRole;
      const account = ROLE_ACCOUNTS.find((item) => item.role === currentRole);
      expect(account, `chưa khai báo tài khoản cho ${currentRole}`).toBeDefined();

      const problems = collectProblems(page);
      const response = await page.goto(path);
      expect(response, "không nhận được response").not.toBeNull();

      if (!canAccessPath(currentRole, path)) {
        // `src/proxy.ts` phải chặn ở server, không chỉ ẩn menu.
        expect(response!.status(), `${currentRole} không được vào ${path}`).toBe(403);
        await expect(page.getByRole("heading", { name: "Không có quyền truy cập" })).toBeVisible();
        return;
      }

      expect(response!.status(), `${currentRole} phải mở được ${path}`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${path}(\\?|$)`));
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
      await expect(page.getByText(/^500 — Đã có lỗi xảy ra$|^Lỗi phân hệ Quản lý$/)).toHaveCount(0);
      expect(problems, "lỗi khi mở trang").toEqual([]);
    });
  }
});
