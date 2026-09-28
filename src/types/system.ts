/**
 * Quản lý viên (tài khoản quản lý) và lịch sử thay đổi toàn hệ thống.
 * Tên field bám theo `.claude/rules/data-contracts.md` — `status` là string union,
 * không dùng numeric enum.
 */
export type ManagerAccountStatus = "active" | "pending" | "disabled"

export interface ManagerAccount {
  id: string
  name: string
  email: string
  phone?: string
  status: ManagerAccountStatus
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

export interface SystemAuditLogEntry {
  id: string
  /** ISO datetime. */
  createdAt: string
  /** `ManagerAccount.id` của người thực hiện. */
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
