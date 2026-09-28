import type { AuditActionType } from "@/types/system"
import type { StatusVariant } from "@/constants/status"

/**
 * Nhãn + màu badge cho từng loại thao tác trong Lịch sử thay đổi (PROMPT 14B).
 * Cùng tinh thần với `STATUS_MAP` ở `constants/status.ts` — bảng tra, không hardcode
 * chuỗi trong component.
 */
export const AUDIT_ACTION_MAP: Record<
  AuditActionType,
  { label: string; variant: StatusVariant }
> = {
  change_teacher: { label: "Đổi giáo viên", variant: "info" },
  substitute: { label: "Dạy thay", variant: "secondary" },
  assign_makeup: { label: "Xếp học bù", variant: "success" },
  swap_session: { label: "Đổi buổi", variant: "secondary" },
  change_class: { label: "Đổi lịch cố định", variant: "warning" },
  long_leave: { label: "Nghỉ dài hạn", variant: "neutral" },
  reenroll: { label: "Cho học lại", variant: "success" },
  withdraw_subject: { label: "Nghỉ môn", variant: "warning" },
  withdraw_full: { label: "Nghỉ hẳn", variant: "danger" },
  confirm_payment: { label: "Xác nhận thanh toán", variant: "success" },
  edit_ai_grading: { label: "Sửa kết quả AI", variant: "info" },
}
