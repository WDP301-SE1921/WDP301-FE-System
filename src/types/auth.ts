import type { Role } from "@/constants/roles"

/** Người dùng web đã đăng nhập. Web chỉ có Quản lý và Giáo viên. */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl?: string
}

export interface LoginResult {
  user: AuthUser
  /** Đường dẫn trang chủ theo role, dùng để điều hướng sau khi đăng nhập. */
  redirectTo: string
}

/** Lời mời tham gia hệ thống, giải mã từ token trên URL kích hoạt. */
export interface Invitation {
  id: string
  email: string
  role: Role
  /** Tên gợi ý sẵn do Quản trị viên nhập khi gửi lời mời. */
  suggestedName?: string
  expiresAt: string
  usedAt?: string
}
