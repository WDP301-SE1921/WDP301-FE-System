/**
 * Nghỉ học & học bù: xếp học bù, đổi buổi, đổi lịch cố định, nghỉ dài hạn,
 * nghỉ môn/nghỉ hẳn. Đây là các entity NGHIỆP VỤ chỉ phục vụ luồng thao tác của
 * quản lý — chưa có trong `.claude/rules/data-contracts.md` — theo đúng tiền lệ
 * `TeacherInvitation`/`SubstituteAssignment` ở `src/types/teacher.ts`.
 *
 * Mọi hành động vẫn tác động lên entity gốc (`Enrollment`, `AttendanceRecord`,
 * `StudentProfile`, `ClassSession`) thay vì dựng mô hình buổi học/điểm danh song song.
 *
 * `status` của `MakeupAssignment` khớp `STATUS_MAP.makeup` trong
 * `src/constants/status.ts` (pending | done | missed).
 */

export type MakeupStatus = "pending" | "done" | "missed"

/** "makeup" = xếp học bù (buổi gốc có thể giữ nguyên lịch); "swap" = đổi hẳn 1 buổi cụ thể. */
export type MakeupKind = "makeup" | "swap"

export interface MakeupAssignment {
  id: string
  kind: MakeupKind
  studentProfileId: string
  /** `ClassSession.id` của buổi nghỉ/buổi gốc. */
  originalSessionId: string
  /** `ClassSession.id` của buổi học bù/buổi thay thế. */
  makeupSessionId: string
  status: MakeupStatus
  /** Chỉ áp dụng cho kind "makeup" — có đánh dấu Vắng buổi gốc hay không. */
  markOriginalAbsent: boolean
  note?: string
  /** Id quản lý đã xếp. */
  assignedBy: string
  assignedAt: string
}

export interface ClassChangeRequest {
  id: string
  studentProfileId: string
  enrollmentId: string
  fromClassId: string
  toClassId: string
  /** Ngày áp dụng lịch mới. */
  effectiveDate: string
  reason: string
  createdBy: string
  createdAt: string
}

export interface LongLeave {
  id: string
  studentProfileId: string
  /** Rỗng = áp dụng cho tất cả môn đang học. */
  subjectIds: string[]
  startDate: string
  endDate: string
  reason: string
  createdBy: string
  createdAt: string
}

export type WithdrawalKind = "subject" | "full"

export interface WithdrawalRecord {
  id: string
  studentProfileId: string
  kind: WithdrawalKind
  /** Các Enrollment bị kết thúc bởi hành động này. */
  enrollmentIds: string[]
  effectiveDate: string
  reason: string
  createdBy: string
  createdAt: string
}
