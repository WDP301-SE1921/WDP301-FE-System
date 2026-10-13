import type { WebRole } from "@/constants/roles";

/** Người dùng web đã đăng nhập: admin, quản lý trung tâm, thiết kế giáo trình, nhân viên hoặc giáo viên. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: WebRole;
  avatarUrl?: string;
  emailVerifiedAt?: string | null;
  status?: "ACTIVE" | "DISABLED";
}

export interface LoginResult {
  user: AuthUser;
  /** Đường dẫn trang chủ theo role, dùng để điều hướng sau khi đăng nhập. */
  redirectTo: string;
}
