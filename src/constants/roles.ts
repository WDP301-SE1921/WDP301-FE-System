export const ROLES = {
  ADMIN: "admin",
  CENTER_MANAGER: "center_manager",
  CURRICULUM_DESIGNER: "curriculum_designer",
  STAFF: "staff",
  TEACHER: "teacher",
  PARENT: "parent",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** 4 role dùng chung khu back-office `/manager/*`. */
export const BACK_OFFICE_ROLES = [
  ROLES.ADMIN,
  ROLES.CENTER_MANAGER,
  ROLES.CURRICULUM_DESIGNER,
  ROLES.STAFF,
] as const

export type BackOfficeRole = (typeof BACK_OFFICE_ROLES)[number]

/** Mọi role có giao diện web (phụ huynh chỉ dùng mobile). */
export const WEB_ROLES = [...BACK_OFFICE_ROLES, ROLES.TEACHER] as const

export type WebRole = (typeof WEB_ROLES)[number]

export function isWebRole(value: unknown): value is WebRole {
  return typeof value === "string" && (WEB_ROLES as readonly string[]).includes(value)
}

export function isBackOfficeRole(value: unknown): value is BackOfficeRole {
  return typeof value === "string" && (BACK_OFFICE_ROLES as readonly string[]).includes(value)
}

/** Nhãn tiếng Việt của vai trò, dùng khi hiển thị ra UI. */
export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.CENTER_MANAGER]: "Quản lý trung tâm",
  [ROLES.CURRICULUM_DESIGNER]: "Thiết kế giáo trình",
  [ROLES.STAFF]: "Nhân viên",
  [ROLES.TEACHER]: "Giáo viên",
  [ROLES.PARENT]: "Phụ huynh",
}
