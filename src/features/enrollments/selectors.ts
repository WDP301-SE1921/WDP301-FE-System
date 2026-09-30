import {
  MOCK_CLASSES,
  MOCK_SUBJECTS,
  findClass,
  findProgram,
  findSubject,
  findTeacher,
} from "@/mocks/data/catalog"
import { MOCK_PARENTS, findParent } from "@/mocks/data/parents"
import {
  findEnrollmentsByStudent,
  findStudent,
  findStudentsByParent,
} from "@/mocks/data/students"
import { getEnrolledCount } from "@/features/classes/selectors"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import type { ParentAccount, StudentProfile } from "@/types/student"
import type { ClassRecord, Program, Subject } from "@/types/catalog"

/**
 * Sĩ số, học phí và trùng lịch là field TÍNH ĐƯỢC — derive tại đây thay vì nhét vào entity.
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
  /** Lớp con đang học bị trùng lịch với lớp này (nếu có) — chỉ cảnh báo, không chặn. */
  conflictClass?: ClassRecord
}

/** "HH:MM" so sánh được theo thứ tự chuỗi. Hai khoảng giao nhau khi mỗi bên bắt đầu trước khi bên kia kết thúc. */
function timeRangesOverlap(a: ClassRecord, b: ClassRecord): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

/** Lớp đang học của hồ sơ con trùng thứ + khung giờ với `classId`, hoặc `undefined`. */
export function findStudentScheduleConflict(
  studentProfileId: string,
  classId: string
): ClassRecord | undefined {
  const target = findClass(classId)
  if (!target || !studentProfileId) return undefined

  return findEnrollmentsByStudent(studentProfileId)
    .filter((enrollment) => enrollment.status === "active" && enrollment.classId !== classId)
    .map((enrollment) => findClass(enrollment.classId))
    .find(
      (current): current is ClassRecord =>
        current !== undefined &&
        current.weekdays.some((day) => target.weekdays.includes(day)) &&
        timeRangesOverlap(current, target)
    )
}

/** Lớp đang mở, lọc theo môn và khối đã chọn ở bước 3, kèm cảnh báo trùng lịch của hồ sơ con. */
export function getClassOptionRows(
  subjectId: string,
  grade?: number,
  studentProfileId?: string
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
      conflictClass: studentProfileId
        ? findStudentScheduleConflict(studentProfileId, classRecord.id)
        : undefined,
    })
  })

  return rows
}

/** Môn có ít nhất một lớp đang mở ở khối đã chọn. */
export function getSubjectOptionsForGrade(grade?: number): Subject[] {
  if (grade === undefined) return []

  return MOCK_SUBJECTS.filter((subject) =>
    MOCK_CLASSES.some(
      (classRecord) =>
        classRecord.status === "open" &&
        classRecord.subjectId === subject.id &&
        classRecord.grade === grade
    )
  )
}

export interface EnrollmentPrefill {
  parentAccountId: string
  studentProfileId: string
  grade: string
  /** Bước bắt đầu: 1 (chọn con) khi chỉ có phụ huynh, 2 (khối/môn/lớp) khi đã có cả hồ sơ con. */
  step: number
}

/**
 * Điền sẵn wizard từ deep-link `?parentId=&studentId=`. Chỉ nhận phụ huynh còn hoạt động và
 * hồ sơ con thuộc đúng phụ huynh đó; không hợp lệ thì trả `null` để wizard bắt đầu từ bước 1.
 */
export function getEnrollmentPrefill(
  parentId?: string | null,
  studentId?: string | null
): EnrollmentPrefill | null {
  const student = studentId ? findStudent(studentId) : undefined
  const parent = findParent(student?.parentAccountId ?? parentId ?? "")
  if (!parent || parent.status !== "activated") return null

  const child = student && student.parentAccountId === parent.id ? student : undefined

  return {
    parentAccountId: parent.id,
    studentProfileId: child?.id ?? "",
    grade: child ? String(child.grade) : "",
    step: child ? 2 : 1,
  }
}

/** Email phụ huynh + tên/khối của con để hiển thị ở card tóm tắt. */
export function getEnrollmentIdentity(parentAccountId: string, studentProfileId: string) {
  const student = studentProfileId ? findStudent(studentProfileId) : undefined

  return {
    parentEmail: findParent(parentAccountId)?.email ?? "",
    studentName: student?.name ?? "",
    childGrade: student?.grade,
  }
}

// ---------------------------------------------------------------------------
// Fetcher cho `ParentPicker` / `EntityPicker` ở bước 1–2 của wizard (picker có sẵn ở shared/)
// ---------------------------------------------------------------------------

/** Phụ huynh hiển thị trong picker: email là tên chính, SĐT + số hồ sơ con là dòng phụ. */
export function toParentOption(parent: ParentAccount): EntityOption {
  return {
    id: parent.id,
    name: parent.email,
    sub: `${parent.phone} · ${findStudentsByParent(parent.id).length} hồ sơ con`,
  }
}

export function toChildOption(student: StudentProfile): EntityOption {
  return {
    id: student.id,
    name: student.name,
    sub: `${student.code} · ${STUDENT_MSG.GRADE_LABEL(student.grade)}`,
  }
}

/** Tìm phụ huynh theo Gmail hoặc SĐT. Tài khoản đã bị khóa không đăng ký được nên không hiện. */
export async function fetchRegistrableParentOptions(search: string): Promise<EntityOption[]> {
  const keyword = search.trim().toLowerCase()
  const compactKeyword = keyword.replace(/\s/g, "")

  return MOCK_PARENTS.filter((parent) => parent.status === "activated")
    .filter(
      (parent) =>
        !keyword ||
        parent.email.toLowerCase().includes(keyword) ||
        parent.phone.replace(/\s/g, "").includes(compactKeyword)
    )
    .slice(0, 20)
    .map(toParentOption)
}

/** Fetcher hồ sơ con của MỘT phụ huynh — chỉ tìm trong các con phụ huynh đã tạo trên app. */
export function createChildOptionsFetcher(parentAccountId: string) {
  return async (search: string): Promise<EntityOption[]> => {
    const keyword = search.trim().toLowerCase()

    return findStudentsByParent(parentAccountId)
      .filter(
        (student) =>
          !keyword ||
          student.name.toLowerCase().includes(keyword) ||
          student.code.toLowerCase().includes(keyword)
      )
      .map(toChildOption)
  }
}

export function getChildCount(parentAccountId: string): number {
  return findStudentsByParent(parentAccountId).length
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
