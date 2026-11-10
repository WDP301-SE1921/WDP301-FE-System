import fs from "node:fs";

import { expect, test as setup } from "@playwright/test";

import { ROLE_ACCOUNTS, seedPassword, storageStateFor } from "./accounts";

/** Giây còn lại của access token trong file phiên; `0` nếu không đọc được. */
export function accessSecondsLeft(file: string) {
  try {
    const state = JSON.parse(fs.readFileSync(file, "utf8")) as { cookies?: { name: string; value: string }[] };
    const token = state.cookies?.find((cookie) => cookie.name === "edugrade_access")?.value;
    if (!token) return 0;
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    return payload.exp ? payload.exp - Date.now() / 1000 : 0;
  } catch {
    return 0;
  }
}

// Đăng nhập qua form thật một lần cho mỗi role, lưu cookie phiên để các spec dùng lại.
// BE giới hạn đăng nhập 5 lần/phút theo IP, nên dùng lại file khi access token còn trên 10 phút
// (token sống 15 phút; hết hạn thì BFF xoay refresh token và file cũ mất phiên).
for (const account of ROLE_ACCOUNTS) {
  setup(`đăng nhập ${account.role}`, async ({ page }) => {
    if (accessSecondsLeft(storageStateFor(account.role)) > 10 * 60) return;
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
