import { MOCK_PARENTS } from "@/mocks/data/parents"
import {
  findEnrollment,
  findEnrollmentsByStudent,
  findStudentsByParent,
} from "@/mocks/data/students"
import {
  findActivationLinksByEnrollments,
  findEmailLogsByParent,
} from "@/mocks/data/payments"
import { findClass } from "@/mocks/data/catalog"
import { getSubjectCodes } from "@/features/students/selectors"
import type {
  ActivationLink,
  EmailLog,
  LinkCodeStatus,
  ParentAccount,
  StudentProfile,
} from "@/types/student"

/**
 * Field TÍNH ĐƯỢC của phụ huynh (số con, trạng thái mã liên kết) derive tại đây thay
 * vì nhét vào entity `ParentAccount` — xem `.claude/rules/data-contracts.md`.
 *
 * Toàn bộ hàm ở file này chạy trong `queryFn`, không chạy lúc render, nên được phép
 * đọc thời gian hiện tại.
 */

export interface ParentChild {
  student: StudentProfile
  subjectCodes: string[]
}

export interface ParentLinkRow {
  link: ActivationLink
  status: LinkCodeStatus
  className: string
}

export interface ParentRow {
  parent: ParentAccount
  children: ParentChild[]
  childCount: number
  links: ParentLinkRow[]
  emails: EmailLog[]
}

/** Đã dùng → `used`; quá hạn → `expired`; còn lại → `active`. */
export function getLinkStatus(
  link: ActivationLink,
  now: number = Date.now()
): LinkCodeStatus {
  if (link.usedAt) return "used"
  if (new Date(link.expiresAt).getTime() < now) return "expired"
  return "active"
}

export function toParentRow(parent: ParentAccount): ParentRow {
  const students = findStudentsByParent(parent.id)

  const children = students.map((student) => ({
    student,
    subjectCodes: getSubjectCodes(findEnrollmentsByStudent(student.id)),
  }))

  const enrollmentIds = students.flatMap((student) =>
    findEnrollmentsByStudent(student.id).map((item) => item.id)
  )

  const now = Date.now()
  const links = findActivationLinksByEnrollments(enrollmentIds).map((link) => ({
    link,
    status: getLinkStatus(link, now),
    className: findClass(findEnrollment(link.enrollmentId)?.classId ?? "")?.name ?? "—",
  }))

  return {
    parent,
    children,
    childCount: children.length,
    links,
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
