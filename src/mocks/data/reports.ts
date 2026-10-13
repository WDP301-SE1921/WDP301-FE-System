import { formatDate } from "@/lib/format"
import { ERROR_MSG } from "@/constants/messages/error"
import { CURRENT_TEACHER_ID, findClass } from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import { MockError } from "@/mocks/utils/mock-query"
import type { TeacherReport } from "@/types/report"

/**
 * Báo cáo giáo viên tự tạo giả lập cho giai đoạn MOCK-ONLY (PROMPT T7).
 * Xóa file này trong cùng PR nối endpoint báo cáo thật.
 */

function classNamesOf(classIds: string[]): string[] {
  return classIds
    .map((classId) => findClass(classId)?.name)
    .filter((name): name is string => Boolean(name))
}

/** Tên báo cáo tự đặt theo lớp + khoảng thời gian — không phải chuỗi người dùng gõ. */
function buildReportName(classNames: string[], fromDate: string, toDate: string): string {
  const classLabel = classNames.length === 1 ? classNames[0] : `${classNames.length} lớp`
  return `Báo cáo ${classLabel} (${formatDate(fromDate)} – ${formatDate(toDate)})`
}

function countEnrolledStudents(classIds: string[]): number {
  return MOCK_ENROLLMENTS.filter(
    (item) => classIds.includes(item.classId) && item.status === "active"
  ).length
}

/** Dung lượng tệp giả lập, tất định theo quy mô báo cáo — không hardcode 1 giá trị chung. */
function buildFileSizeLabel(classIds: string[]): string {
  const studentCount = countEnrolledStudents(classIds)
  const sizeKb = 180 + classIds.length * 60 + studentCount * 12
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} M` : `${sizeKb} K`
}

const SEEDED_ROWS: Array<
  Pick<
    TeacherReport,
    | "classIds"
    | "fromDate"
    | "toDate"
    | "includeScores"
    | "includeAttendance"
    | "includeProgress"
    | "createdAt"
  >
> = [
  {
    classIds: ["cls-math-8a"],
    fromDate: "2026-09-09",
    toDate: "2026-09-15",
    includeScores: true,
    includeAttendance: true,
    includeProgress: true,
    createdAt: "2026-09-15T18:20:00",
  },
  {
    classIds: ["cls-math-7a"],
    fromDate: "2026-09-08",
    toDate: "2026-09-14",
    includeScores: true,
    includeAttendance: true,
    includeProgress: false,
    createdAt: "2026-09-14T20:05:00",
  },
  {
    // Báo cáo điểm giữa kỳ — chỉ lấy điểm số, không kèm tỷ lệ đi học/tiến độ.
    classIds: ["cls-math-8a", "cls-math-7a"],
    fromDate: "2026-08-01",
    toDate: "2026-09-10",
    includeScores: true,
    includeAttendance: false,
    includeProgress: false,
    createdAt: "2026-09-11T08:30:00",
  },
  {
    classIds: ["cls-math-10a"],
    fromDate: "2026-08-16",
    toDate: "2026-09-05",
    includeScores: true,
    includeAttendance: true,
    includeProgress: true,
    createdAt: "2026-09-06T09:00:00",
  },
  {
    // Báo cáo tổng hợp tháng 8, cả 3 lớp giáo viên phụ trách.
    classIds: ["cls-math-8a", "cls-math-7a", "cls-math-10a"],
    fromDate: "2026-08-01",
    toDate: "2026-08-31",
    includeScores: true,
    includeAttendance: true,
    includeProgress: true,
    createdAt: "2026-09-01T09:15:00",
  },
]

export const MOCK_TEACHER_REPORTS: TeacherReport[] = SEEDED_ROWS.map((row, index) => {
  const classNames = classNamesOf(row.classIds)

  return {
    id: `rpt-00${index + 1}`,
    name: buildReportName(classNames, row.fromDate, row.toDate),
    teacherId: CURRENT_TEACHER_ID,
    classIds: row.classIds,
    fromDate: row.fromDate,
    toDate: row.toDate,
    includeScores: row.includeScores,
    includeAttendance: row.includeAttendance,
    includeProgress: row.includeProgress,
    createdAt: row.createdAt,
    fileSizeLabel: buildFileSizeLabel(row.classIds),
  }
})

export interface CreateTeacherReportInput {
  classIds: string[]
  studentProfileIds?: string[]
  fromDate: string
  toDate: string
  includeScores: boolean
  includeAttendance: boolean
  includeProgress: boolean
}

let reportSequence = MOCK_TEACHER_REPORTS.length

export function mockCreateTeacherReport(input: CreateTeacherReportInput): TeacherReport {
  const classNames = classNamesOf(input.classIds)
  if (classNames.length === 0) throw new MockError(ERROR_MSG.NOT_FOUND)

  reportSequence += 1

  const report: TeacherReport = {
    id: `rpt-new-${reportSequence}`,
    name: buildReportName(classNames, input.fromDate, input.toDate),
    teacherId: CURRENT_TEACHER_ID,
    classIds: input.classIds,
    studentProfileIds: input.studentProfileIds,
    fromDate: input.fromDate,
    toDate: input.toDate,
    includeScores: input.includeScores,
    includeAttendance: input.includeAttendance,
    includeProgress: input.includeProgress,
    createdAt: new Date().toISOString(),
    fileSizeLabel: buildFileSizeLabel(input.classIds),
  }

  MOCK_TEACHER_REPORTS.unshift(report)

  return report
}
