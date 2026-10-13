/**
 * Báo cáo giáo viên tự tạo (PROMPT T7). Domain hoàn toàn mới — chưa nằm trong
 * `.claude/rules/data-contracts.md`, theo đúng tiền lệ `types/absence.ts`/
 * `types/assignment.ts` (business type mới có file riêng).
 */

export type ReportFormat = "excel" | "pdf"

export interface TeacherReport {
  id: string
  /** Tự đặt theo lớp + khoảng thời gian, xem `buildReportName()` ở `mocks/data/reports.ts`. */
  name: string
  teacherId: string
  classIds: string[]
  studentProfileIds?: string[]
  /** ISO date. */
  fromDate: string
  /** ISO date. */
  toDate: string
  includeScores: boolean
  includeAttendance: boolean
  includeProgress: boolean
  /** ISO datetime. */
  createdAt: string
  /** Vd "1.4 M" — chỉ hiển thị, dữ liệu giả lập derive từ quy mô báo cáo. */
  fileSizeLabel?: string
}
