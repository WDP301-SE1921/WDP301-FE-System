import { isWebRole, type WebRole } from "@/constants/roles"
import { STORAGE_KEYS } from "@/constants/storage-keys"
import type { AuthUser } from "@/types/auth"

/**
 * Phiên đăng nhập giả lập cho giai đoạn MOCK-ONLY: role nằm trong cookie (`proxy.ts` đọc
 * để chặn route), hồ sơ người dùng nằm trong localStorage/sessionStorage. Chỉ chạy ở client.
 * Khi nối backend thật, thay file này bằng session thật — nơi gọi không phải đổi.
 */

/** Số ngày giữ phiên khi người dùng tick "Ghi nhớ đăng nhập". */
const REMEMBER_ME_DAYS = 30

export function persistSession(user: AuthUser, rememberMe: boolean) {
  const maxAge = rememberMe ? REMEMBER_ME_DAYS * 24 * 60 * 60 : undefined

  document.cookie = [
    `${STORAGE_KEYS.ROLE_COOKIE}=${user.role}`,
    "path=/",
    "samesite=lax",
    maxAge ? `max-age=${maxAge}` : "",
  ]
    .filter(Boolean)
    .join("; ")

  window.localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  window.sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user))
}

export function clearSession() {
  document.cookie = `${STORAGE_KEYS.ROLE_COOKIE}=; path=/; max-age=0`
  window.localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  window.sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
}

/** Role hiện tại từ cookie; `null` khi chưa đăng nhập hoặc giá trị không hợp lệ. */
export function readRoleCookie(): WebRole | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${STORAGE_KEYS.ROLE_COOKIE}=`))

  const value = match?.split("=")[1]
  return isWebRole(value) ? value : null
}

/** JSON thô của hồ sơ đã lưu — giữ dạng chuỗi để `useSyncExternalStore` có snapshot ổn định. */
export function readStoredUserRaw(): string | null {
  return (
    window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE) ??
    window.sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE)
  )
}

export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}
