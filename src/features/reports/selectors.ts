import { findClass } from "@/mocks/data/catalog"
import { MOCK_TEACHER_REPORTS } from "@/mocks/data/reports"
import type { TeacherReport } from "@/types/report"

/**
 * Selector cho domain Báo cáo giáo viên (PROMPT T7). Tên lớp là field TÍNH ĐƯỢC —
 * derive tại đây thay vì lưu trùng trên `TeacherReport`. Danh sách lớp cho bộ lọc
 * dùng lại `getMyClassOptions()` của `features/assignments/selectors.ts` (import
 * trực tiếp ở component, không re-export ở đây để tránh trùng nguồn).
 */

export interface ReportRow {
  report: TeacherReport
  classNames: string[]
}

function toReportRow(report: TeacherReport): ReportRow {
  return {
    report,
    classNames: report.classIds
      .map((classId) => findClass(classId)?.name)
      .filter((name): name is string => Boolean(name)),
  }
}

/** Lịch sử báo cáo, mới nhất trước. */
export function getReportRows(): ReportRow[] {
  return [...MOCK_TEACHER_REPORTS]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toReportRow)
}
