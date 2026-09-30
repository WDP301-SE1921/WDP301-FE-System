import type { BackOfficeRole } from "@/constants/roles"

/**
 * Tài khoản nhân sự trung tâm (đăng nhập web back-office) và lịch sử thay đổi toàn hệ thống.
 * Tên field bám theo `.claude/rules/data-contracts.md` — `status`/`role` là string union,
 * không dùng numeric enum.
 */
export type StaffAccountStatus = "active" | "pending" | "disabled"

export interface StaffAccount {
  id: string
  name: string
  email: string
  phone?: string
  /** admin | center_manager | curriculum_designer | staff — quyết định màn hình vào được (`role-access.ts`). */
  role: BackOfficeRole
  status: StaffAccountStatus
  /** ISO date — "ngày tham gia" khi active, "ngày mời" khi pending. */
  joinedAt: string
}

export type AuditActionType =
  | "change_teacher"
  | "substitute"
  | "assign_makeup"
  | "swap_session"
  | "change_class"
  | "long_leave"
  | "reenroll"
  | "withdraw_subject"
  | "withdraw_full"
  | "confirm_payment"
  | "edit_ai_grading"
  | "teacher_absence"
  | "cancel_session"
  | "adjust_work_credit"

export interface SystemAuditLogEntry {
  id: string
  /** ISO datetime. */
  createdAt: string
  /** `StaffAccount.id` của người thực hiện. */
  actorId: string
  actionType: AuditActionType
  /** Vd "Nguyễn Minh Khang", "Toán 8A". */
  targetLabel: string
  /** Link tới trang chi tiết đối tượng nếu có trong `ROUTES`. */
  targetHref?: string
  changeBefore?: string
  changeAfter?: string
  reason?: string
  effectiveDate?: string
  ip: string
}
