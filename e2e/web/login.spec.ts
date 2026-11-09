import { expect, test } from "@playwright/test";

import { ROLE_ACCOUNTS } from "./accounts";

test.describe("Đăng nhập (chưa có phiên)", () => {
  test("trang back-office chuyển về /login khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/manager/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("báo lỗi validate khi để trống form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByText("Trường này là bắt buộc").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("báo lỗi khi email sai định dạng", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill("khong-phai-email");
    await page.locator("#login-password").fill("bat-ky-123");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByText("Email không hợp lệ")).toBeVisible();
  });

  test("báo lỗi khi sai mật khẩu và vẫn ở /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill(ROLE_ACCOUNTS[0].email);
    await page.locator("#login-password").fill("sai-mat-khau-e2e");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
