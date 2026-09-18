/**
 * Lời mời giáo viên và phân công dạy thay.
 * Tên field bám theo `.claude/rules/data-contracts.md`.
 */

export type TeacherInvitationStatus = "pending_review" | "sent" | "approved" | "rejected"
export type SubstituteStatus = "confirmed" | "pending_confirm" | "cancelled"

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
