export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: "edugrade_sidebar_collapsed",
  AUTH_TOKEN: "edugrade_auth_token",
  USER_PROFILE: "edugrade_user_profile",
  /** Legacy mock cookie; cleaned up on logout, never used to grant access. */
  ROLE_COOKIE: "edugrade_role",
} as const
