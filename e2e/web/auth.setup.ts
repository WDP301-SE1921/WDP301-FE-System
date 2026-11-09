import { expect, test as setup } from "@playwright/test";

import { ROLE_ACCOUNTS, seedPassword, storageStateFor } from "./accounts";

// Đăng nhập qua form thật một lần cho mỗi role, lưu cookie phiên để các spec dùng lại.
for (const account of ROLE_ACCOUNTS) {
  setup(`đăng nhập ${account.role}`, async ({ page }) => {
    await page.goto("/login");
    await page.locator("#login-email").fill(account.email);
    await page.locator("#login-password").fill(seedPassword());
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    // Chờ trang chủ của role trước khi lưu, nếu không redirect sau đăng nhập sẽ đua với lần goto kế tiếp.
    await page.waitForURL((url) => url.pathname.startsWith(account.home), { timeout: 60_000 });
    await expect(page.locator("main")).toBeVisible();
    await page.context().storageState({ path: storageStateFor(account.role) });
  });
}
