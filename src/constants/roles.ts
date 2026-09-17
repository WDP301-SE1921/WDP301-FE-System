export const ROLES = {
  MANAGER: "manager",
  TEACHER: "teacher",
  PARENT: "parent",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Nhãn tiếng Việt của vai trò, dùng khi hiển thị ra UI. */
export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.MANAGER]: "Quản lý",
  [ROLES.TEACHER]: "Giáo viên",
  [ROLES.PARENT]: "Phụ huynh",
}
