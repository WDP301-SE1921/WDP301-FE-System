import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

import { ROLES, type WebRole } from "../../src/constants/roles";

export interface RoleAccount {
  role: WebRole;
  email: string;
  /** Trang role được đưa tới ngay sau khi đăng nhập. */
  home: string;
}

/** Tài khoản seed của BE (`*@edugrade.local`). Không có tài khoản admin trong seed. */
export const ROLE_ACCOUNTS: readonly RoleAccount[] = [
  { role: ROLES.CENTER_MANAGER, email: "manager@edugrade.local", home: "/manager/dashboard" },
  { role: ROLES.STAFF, email: "staff@edugrade.local", home: "/staff/dashboard" },
  { role: ROLES.TEACHER, email: "teacher@edugrade.local", home: "/teacher/dashboard" },
  {
    role: ROLES.CURRICULUM_DESIGNER,
    email: "designer@edugrade.local",
    home: "/manager/curriculum/overview",
  },
];

export function storageStateFor(role: WebRole) {
  return path.join(__dirname, "..", ".auth", `${role}.json`);
}

/** `E2E_PASSWORD`, nếu không có thì lấy `SEED_DEFAULT_PASSWORD` trong `../WDP301-BE-System/.env`. */
export function seedPassword() {
  if (process.env.E2E_PASSWORD) return process.env.E2E_PASSWORD;
  const envFile = path.resolve(__dirname, "..", "..", "..", "WDP301-BE-System", ".env");
  const value = fs.existsSync(envFile)
    ? parseEnv(fs.readFileSync(envFile, "utf8")).SEED_DEFAULT_PASSWORD
    : undefined;
  if (!value) throw new Error(`Đặt E2E_PASSWORD (không thấy SEED_DEFAULT_PASSWORD trong ${envFile})`);
  return value;
}
