import { findAttendanceByStudent } from "@/mocks/data/attendance"
import { findClass, findClassSession, findSubject } from "@/mocks/data/catalog"
import {
  MOCK_ENROLLMENTS,
  MOCK_STUDENTS,
  findEnrollmentsByStudent,
} from "@/mocks/data/students"
import { findParent } from "@/mocks/data/parents"
import type {
  AttendanceStatus,
  Enrollment,
  ParentAccount,
  StudentProfile,
} from "@/types/student"

/**
 * Field TÍNH ĐƯỢC được derive ở đây thay vì nhét vào entity — backend không trả
 * những field này, nên giữ một chỗ duy nhất để sửa khi công thức thay đổi.
 * Xem `.claude/rules/data-contracts.md`.
 */

export interface AttendanceBreakdown {
  present: number
  absent: number
  madeUp: number
  excused: number
  total: number
  /** Phần trăm làm tròn 1 chữ số thập phân. */
  rate: number
}

export interface StudentRow {
  student: StudentProfile
  parent?: ParentAccount
  enrollments: Enrollment[]
  /** Mã môn đang học, để render `<SubjectTag />`. */
  subjectCodes: string[]
  attendance: AttendanceBreakdown
  /** Ngày hết hạn của gói học phí xa nhất, undefined khi chưa có gói nào. */
  packageEndDate?: string
}

const EMPTY_BREAKDOWN: AttendanceBreakdown = {
  present: 0,
  absent: 0,
  madeUp: 0,
  excused: 0,
  total: 0,
  rate: 0,
}

const STATUS_BUCKET: Record<AttendanceStatus, keyof AttendanceBreakdown> = {
  present: "present",
  absent: "absent",
  made_up: "madeUp",
  excused: "excused",
}

/**
 * Tỷ lệ đi học = (có mặt + đã học bù) / tổng số buổi đã diễn ra.
 * Truyền `classId` để tính riêng cho một lớp/môn.
 */
export function getAttendanceBreakdown(
  studentProfileId: string,
  classId?: string
): AttendanceBreakdown {
  const records = findAttendanceByStudent(studentProfileId).filter(
    (record) =>
      !classId || findClassSession(record.classSessionId)?.classId === classId
  )

  if (records.length === 0) return EMPTY_BREAKDOWN

  const breakdown = { ...EMPTY_BREAKDOWN, total: records.length }

  records.forEach((record) => {
    const bucket = STATUS_BUCKET[record.status]
    breakdown[bucket] += 1
  })

  const attended = breakdown.present + breakdown.madeUp
  breakdown.rate = Math.round((attended / breakdown.total) * 1000) / 10

  return breakdown
}

/** Ngày hết hạn xa nhất trong các gói đang hoạt động của học sinh. */
export function getPackageEndDate(enrollments: Enrollment[]): string | undefined {
  const dates = enrollments
    .filter((item) => item.status !== "dropped")
    .map((item) => item.endDate)
    .sort()

  return dates.at(-1)
}

/** Số ngày còn lại tới `endDate`, âm khi đã quá hạn. */
export function getDaysRemaining(endDate: string, today: Date = new Date()): number {
  const diff = new Date(endDate).getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getSubjectCodes(enrollments: Enrollment[]): string[] {
  const codes = enrollments
    .filter((item) => item.status !== "dropped")
    .map((item) => findSubject(item.subjectId)?.code)
    .filter((code): code is string => Boolean(code))

  return Array.from(new Set(codes))
}

export function toStudentRow(student: StudentProfile): StudentRow {
  const enrollments = findEnrollmentsByStudent(student.id)

  return {
    student,
    parent: findParent(student.parentAccountId),
    enrollments,
    subjectCodes: getSubjectCodes(enrollments),
    attendance: getAttendanceBreakdown(student.id),
    packageEndDate: getPackageEndDate(enrollments),
  }
}

export function getStudentRows(): StudentRow[] {
  return MOCK_STUDENTS.map(toStudentRow)
}

/** Mã lớp đang học, dùng cho select "Tất cả lớp" ở filter bar. */
export function getClassOptions(): Array<{ value: string; label: string }> {
  const classIds = Array.from(new Set(MOCK_ENROLLMENTS.map((item) => item.classId)))

  return classIds
    .map((classId) => findClass(classId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi"))
}
