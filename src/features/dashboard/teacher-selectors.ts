import { BUSINESS_RULES } from "@/constants/business-rules"
import { getClassRows } from "@/features/classes/selectors"
import { getTodayAttendanceRows } from "@/features/attendance/selectors"
import { getGradingQueueCounts } from "@/features/grading/selectors"
import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS } from "@/mocks/data/assignments"
import { MOCK_TODAY, findClass } from "@/mocks/data/catalog"
import { findStudent } from "@/mocks/data/students"
import type { Submission } from "@/types/assignment"

/**
 * Selectors riêng cho Dashboard Giáo viên. Tách khỏi `selectors.ts` (Dashboard
 * Quản lý) vì hai role đọc dữ liệu theo góc nhìn hoàn toàn khác nhau.
 *
 * Domain Bài tập/Bài nộp/Chấm bài AI (PROMPT T5/T5B/T5C/T6) đã được xây — số liệu
 * dưới đây tính từ `MOCK_ASSIGNMENTS`/`MOCK_SUBMISSIONS` thật, không còn placeholder.
 */

export function getTeacherClassCount(teacherId: string): number {
  return getClassRows({ teacherId }).length
}

function getTeacherClassIds(teacherId: string): Set<string> {
  return new Set(getClassRows({ teacherId }).map((row) => row.classRecord.id))
}

export interface TeacherPendingCounts {
  unmarkedSessionsToday: number
  ungradedSubmissions: number
  pendingAiReview: number
  assignmentsDueSoon: number
}

export function getTeacherPendingCounts(teacherId: string): TeacherPendingCounts {
  const unmarkedSessionsToday = getTodayAttendanceRows(teacherId).filter(
    (row) => !row.isMarked
  ).length

  const classIds = getTeacherClassIds(teacherId)
  const assignments = MOCK_ASSIGNMENTS.filter((assignment) => classIds.has(assignment.classId))
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id))

  const ungradedSubmissions = MOCK_SUBMISSIONS.filter(
    (submission) => assignmentIds.has(submission.assignmentId) && submission.status === "pending"
  ).length

  const nowAnchor = new Date(MOCK_TODAY).getTime()
  const dueSoonThreshold = nowAnchor + BUSINESS_RULES.ASSIGNMENT_DUE_SOON_HOURS * 60 * 60 * 1000

  const assignmentsDueSoon = assignments.filter((assignment) => {
    if (assignment.status !== "assigned") return false
    const dueTime = new Date(assignment.dueDate).getTime()
    return dueTime >= nowAnchor && dueTime <= dueSoonThreshold
  }).length

  return {
    unmarkedSessionsToday,
    ungradedSubmissions,
    // Khớp đúng số của tab "Chờ duyệt" ở PROMPT T6 (gồm cả "ai_graded" lẫn "ai_grading").
    pendingAiReview: getGradingQueueCounts().pending_review,
    assignmentsDueSoon,
  }
}

export interface RecentSubmissionRow {
  submission: Submission
  studentName: string
  className: string
  assignmentName: string
  assignmentId: string
}

/** Bảng "Bài nộp gần đây" — N bài nộp mới nhất của các lớp giáo viên phụ trách. */
export function getRecentSubmissions(teacherId: string, limit = 5): RecentSubmissionRow[] {
  const classIds = getTeacherClassIds(teacherId)
  const assignmentById = new Map(
    MOCK_ASSIGNMENTS.filter((assignment) => classIds.has(assignment.classId)).map(
      (assignment) => [assignment.id, assignment]
    )
  )

  return MOCK_SUBMISSIONS.filter(
    (submission) => assignmentById.has(submission.assignmentId) && submission.submittedAt
  )
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
    .slice(0, limit)
    .map((submission) => {
      const assignment = assignmentById.get(submission.assignmentId)
      const classRecord = assignment ? findClass(assignment.classId) : undefined

      return {
        submission,
        studentName: findStudent(submission.studentProfileId)?.name ?? "—",
        className: classRecord?.name ?? "—",
        assignmentName: assignment?.title ?? "—",
        assignmentId: submission.assignmentId,
      }
    })
}
