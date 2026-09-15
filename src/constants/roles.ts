export const ROLES = {
  MANAGER: "manager",
  TEACHER: "teacher",
  PARENT: "parent",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
