import { isWebRole, type WebRole } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { AuthUser } from "@/types/auth";

export const SESSION_CHANGED_EVENT = "edugrade:session-changed";

export function persistSession(user: AuthUser, rememberMe: boolean) {
  window.localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  window.sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

/** Refresh the saved profile (e.g. a new display name) in whichever storage holds it. */
export function updateStoredUser(user: AuthUser) {
  persistSession(
    user,
    window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE) !== null,
  );
}

export function clearSession() {
  document.cookie = `${STORAGE_KEYS.ROLE_COOKIE}=; path=/; max-age=0`;
  window.localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  window.sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  window.localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  window.sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

/** Display role from the saved profile. Protected routes use the server-validated role. */
export function readRoleCookie(): WebRole | null {
  return parseStoredUser(readStoredUserRaw())?.role ?? null;
}

/** JSON thô của hồ sơ đã lưu — giữ dạng chuỗi để `useSyncExternalStore` có snapshot ổn định. */
export function readStoredUserRaw(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE) ??
    window.sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE)
  );
}

export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as AuthUser;
    return isWebRole(user.role) &&
      typeof user.id === "string" &&
      typeof user.email === "string"
      ? user
      : null;
  } catch {
    return null;
  }
}
