import {
  MOCK_CLASSES,
  findProgram,
  findSubject,
  findTeacher,
} from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS, MOCK_STUDENTS, findStudent } from "@/mocks/data/students"
import { MOCK_PARENTS, findParent } from "@/mocks/data/parents"
import { getSubjectCodes } from "@/features/students/selectors"
import type { ClassRecord, Program } from "@/types/catalog"

/**
 * Sĩ số và học phí là field TÍNH ĐƯỢC — derive tại đây thay vì nhét vào entity.
 * Xem `.claude/rules/data-contracts.md`.
 */

export interface ClassOptionRow {
  classRecord: ClassRecord
  program: Program
  subjectCode: string
  teacherName?: string
  enrolled: number
  isFull: boolean
  monthlyFee: number
}

/** Số học sinh đang theo học của một lớp. */
export function getEnrolledCount(classId: string): number {
  return MOCK_ENROLLMENTS.filter(
    (item) => item.classId === classId && item.status === "active"
  ).length
}

/** Lớp đang mở, lọc theo môn và khối đã chọn ở bước 3. */
export function getClassOptionRows(
  subjectId: string,
  grade?: number
): ClassOptionRow[] {
  const rows: ClassOptionRow[] = []

  MOCK_CLASSES.forEach((classRecord) => {
    if (classRecord.status !== "open") return
    if (subjectId && classRecord.subjectId !== subjectId) return
    if (grade !== undefined && classRecord.grade !== grade) return

    const program = findProgram(classRecord.programId)
    if (!program) return

    const enrolled = getEnrolledCount(classRecord.id)

    rows.push({
      classRecord,
      program,
      subjectCode: findSubject(classRecord.subjectId)?.code ?? "",
      teacherName: findTeacher(classRecord.teacherId)?.name,
      enrolled,
      isFull: enrolled >= classRecord.capacity,
      monthlyFee: program.monthlyFee,
    })
  })

  return rows
}

export interface TuitionBreakdown {
  monthlyFee: number
  months: number
  startDate: string
  endDate: string
  total: number
}

/** Học phí = học phí/tháng × số tháng; kỳ học bắt đầu từ `startDate`. */
export function getTuitionBreakdown(
  monthlyFee: number,
  months: number,
  startDate: Date
): TuitionBreakdown {
  const end = new Date(startDate)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)

  return {
    monthlyFee,
    months,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    total: monthlyFee * months,
  }
}

/** Danh sách phụ huynh đã kích hoạt, cho picker ở luồng A2. */
export function getParentOptions(): Array<{ value: string; label: string }> {
  return MOCK_PARENTS.map((parent) => ({
    value: parent.id,
    label: `${parent.email} · ${parent.phone}`,
  }))
}

/**
 * Danh sách học sinh cho picker ở luồng A3 — bao gồm cả học sinh đã nghỉ hẳn để
 * quản lý có thể đăng ký lại (nút "Đăng ký lại" ở PROMPT 10F deep-link tới đây).
 */
export function getStudentOptions(): Array<{ value: string; label: string }> {
  return MOCK_STUDENTS.map((student) => ({
    value: student.id,
    label: `${student.name} · ${student.code}`,
  }))
}

/** Email + tên học sinh để hiển thị ở card tóm tắt, tùy luồng đăng ký. */
export function resolveSummaryIdentity(values: {
  registrationType: string
  studentName: string
  parentEmail: string
  parentAccountId: string
  studentProfileId: string
}) {
  if (values.studentProfileId) {
    const student = findStudent(values.studentProfileId)
    return {
      studentName: student?.name ?? "",
      parentEmail: findParent(student?.parentAccountId ?? "")?.email ?? "",
      grade: student?.grade,
      subjectCodes: student ? getSubjectCodes(
        MOCK_ENROLLMENTS.filter((item) => item.studentProfileId === student.id)
      ) : [],
    }
  }

  if (values.parentAccountId) {
    return {
      studentName: values.studentName,
      parentEmail: findParent(values.parentAccountId)?.email ?? "",
      grade: undefined,
      subjectCodes: [],
    }
  }

  return {
    studentName: values.studentName,
    parentEmail: values.parentEmail,
    grade: undefined,
    subjectCodes: [],
  }
}
