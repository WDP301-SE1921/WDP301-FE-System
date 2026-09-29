import { CURRENT_TEACHER_ID, findClass, findSubject } from "@/mocks/data/catalog"
import { MOCK_ASSIGNMENTS, findAssignment, findSubmissionsByAssignment } from "@/mocks/data/assignments"
import { getClassRows, getEnrolledCount } from "@/features/classes/selectors"
import type { Assignment, AssignmentStatus, AssignmentType } from "@/types/assignment"
import type { ClassRecord } from "@/types/catalog"

/**
 * Sĩ số lớp, môn học và số bài đã nộp là field TÍNH ĐƯỢC — derive tại đây thay vì
 * nhét vào entity `Assignment`. Xem `.claude/rules/data-contracts.md`.
 */

export interface AssignmentRow {
  assignment: Assignment
  classRecord?: ClassRecord
  subjectCode: string
  submittedCount: number
  totalStudents: number
}

export interface AssignmentRowFilters {
  classId?: string
  type?: AssignmentType
  status?: AssignmentStatus
  search?: string
}

/** Lớp giáo viên đang phụ trách — reuse filter `teacherId` đã có ở `classes/selectors.ts`. */
export function getMyClassOptions(): Array<{ value: string; label: string }> {
  return getClassRows({ teacherId: CURRENT_TEACHER_ID }).map((row) => ({
    value: row.classRecord.id,
    label: row.classRecord.name,
  }))
}

function toAssignmentRow(assignment: Assignment): AssignmentRow {
  const classRecord = findClass(assignment.classId)
  const totalStudents = classRecord ? getEnrolledCount(classRecord.id) : 0
  const submittedCount = findSubmissionsByAssignment(assignment.id).filter(
    (submission) => submission.status !== "not_submitted"
  ).length

  return {
    assignment,
    classRecord,
    subjectCode: classRecord ? (findSubject(classRecord.subjectId)?.code ?? "") : "",
    submittedCount,
    totalStudents,
  }
}

/** Bài tập/đề kiểm tra của các lớp `CURRENT_TEACHER_ID` phụ trách, theo bộ lọc. */
export function getAssignmentRows(filters: AssignmentRowFilters = {}): AssignmentRow[] {
  const myClassIds = new Set(getMyClassOptions().map((option) => option.value))
  const keyword = filters.search?.trim().toLowerCase()

  return MOCK_ASSIGNMENTS.filter((assignment) => myClassIds.has(assignment.classId))
    .filter((assignment) => !filters.classId || assignment.classId === filters.classId)
    .filter((assignment) => !filters.type || assignment.type === filters.type)
    .filter((assignment) => !filters.status || assignment.status === filters.status)
    .filter((assignment) => !keyword || assignment.title.toLowerCase().includes(keyword))
    .map(toAssignmentRow)
}

export function getAssignmentTotalPoints(assignment: Assignment): number {
  return (
    Math.round(assignment.questions.reduce((sum, question) => sum + question.points, 0) * 100) /
    100
  )
}

export interface AssignmentDetail extends Assignment {
  classRecord?: ClassRecord
  totalPoints: number
}

export function getAssignmentDetail(assignmentId: string): AssignmentDetail | null {
  const assignment = findAssignment(assignmentId)
  if (!assignment) return null

  return {
    ...assignment,
    classRecord: findClass(assignment.classId),
    totalPoints: getAssignmentTotalPoints(assignment),
  }
}
