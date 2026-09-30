/**
 * Lời mời giáo viên và phân công dạy thay.
 * Tên field bám theo `.claude/rules/data-contracts.md`.
 */

export type TeacherInvitationStatus = "pending_review" | "sent" | "approved" | "rejected"
export type SubstituteStatus = "confirmed" | "pending_confirm" | "cancelled"
export type TeacherAbsenceStatus = "pending" | "covered" | "cancelled"

export interface TeacherInvitation {
  id: string
  email: string
  name: string
  phone: string
  subjectIds: string[]
  status: TeacherInvitationStatus
  createdAt: string
  /** Khối lớp ứng viên đăng ký dạy, vd [10, 11, 12]. */
  grades: number[]
  /** Nguồn hồ sơ, vd "Cơ sở Trần Đại Nghĩa". */
  source?: string
  /** Kinh nghiệm tự khai, hiển thị trên card duyệt hồ sơ. */
  experienceNote?: string
  /** Tên file CV đính kèm — chỉ hiển thị tên, không có link tải trong mock. */
  cvFileName?: string
}

export interface SubstituteAssignment {
  id: string
  classSessionId: string
  mainTeacherId: string
  substituteTeacherId: string
  reason: string
  /** Id quản lý đã xếp. */
  assignedBy: string
  assignedAt: string
  status: SubstituteStatus
}

/**
 * Giáo viên báo nghỉ một buổi của mình. "Đột xuất" KHÔNG lưu ở đây — derive từ `reportedAt` so
 * với giờ bắt đầu buổi (`features/work-credits/selectors.ts` → `isUrgentAbsence`).
 */
export interface TeacherAbsenceReport {
  id: string
  classSessionId: string
  teacherId: string
  reason: string
  reportedAt: string
  status: TeacherAbsenceStatus
  /** Id nhân sự đã xử lý (xếp dạy thay hoặc hủy buổi). */
  resolvedBy?: string
  resolvedAt?: string
}

/** Quản lý ghi nhận công thủ công cho một buổi đã dạy nhưng chưa được điểm danh. */
export interface WorkCreditAdjustment {
  id: string
  classSessionId: string
  teacherId: string
  reason: string
  adjustedBy: string
  adjustedAt: string
}
