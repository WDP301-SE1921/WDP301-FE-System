export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: "edugrade_sidebar_collapsed",
  AUTH_TOKEN: "edugrade_auth_token",
  USER_PROFILE: "edugrade_user_profile",
  /** Cookie vai trò — `src/proxy.ts` đọc key này để chặn route theo role. */
  ROLE_COOKIE: "edugrade_role",
} as const
