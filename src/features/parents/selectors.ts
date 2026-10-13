import { MOCK_PARENTS } from "@/mocks/data/parents"
import { findEnrollmentsByStudent, findStudentsByParent } from "@/mocks/data/students"
import { findEmailLogsByParent } from "@/mocks/data/payments"
import { getSubjectCodes } from "@/features/students/selectors"
import type { EmailLog, ParentAccount, StudentProfile } from "@/types/student"

/**
 * Field TÍNH ĐƯỢC của phụ huynh (số con) derive tại đây thay
 * vì nhét vào entity `ParentAccount` — xem `.claude/rules/data-contracts.md`.
 *
 * Toàn bộ hàm ở file này chạy trong `queryFn`, không chạy lúc render, nên được phép
 * đọc thời gian hiện tại.
 */

export interface ParentChild {
  student: StudentProfile
  subjectCodes: string[]
}

export interface ParentRow {
  parent: ParentAccount
  children: ParentChild[]
  childCount: number
  emails: EmailLog[]
}

export function toParentRow(parent: ParentAccount): ParentRow {
  const students = findStudentsByParent(parent.id)

  const children = students.map((student) => ({
    student,
    subjectCodes: getSubjectCodes(findEnrollmentsByStudent(student.id)),
  }))

  return {
    parent,
    children,
    childCount: children.length,
    emails: findEmailLogsByParent(parent.id),
  }
}

export function getParentRows(): ParentRow[] {
  return MOCK_PARENTS.map(toParentRow)
}

/** Số con trung bình trên mỗi tài khoản phụ huynh, làm tròn 1 chữ số. */
export function getAverageChildrenPerParent(rows: ParentRow[]): number {
  if (rows.length === 0) return 0
  const total = rows.reduce((sum, row) => sum + row.childCount, 0)
  return Math.round((total / rows.length) * 10) / 10
}
