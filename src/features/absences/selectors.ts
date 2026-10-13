import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  MOCK_TODAY,
  findClass,
  findClassSession,
  findProgram,
  findSubject,
  findTeacher,
  resolveLessonOrder,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS, MOCK_STUDENTS, findEnrollment, findStudent } from "@/mocks/data/students"
import { findStaffAccount } from "@/mocks/data/staff"
import {
  MOCK_LONG_LEAVES,
  MOCK_MAKEUP_ASSIGNMENTS,
  MOCK_WITHDRAWAL_RECORDS,
  getAvailableSlots,
} from "@/mocks/data/absences"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import type { ClassRecord, ClassSession } from "@/types/catalog"
import type { Enrollment, StudentProfile } from "@/types/student"
import type { LongLeave, MakeupAssignment, MakeupKind, WithdrawalRecord } from "@/types/absence"

/**
 * Tất cả field tính được (sĩ số, tiến độ, trạng thái theo ngày...) derive tại đây
 * thay vì lưu trên entity. Xem `.claude/rules/data-contracts.md`.
 */

// ---------------------------------------------------------------------------
// Học sinh & Enrollment dùng chung cho cả 6 màn
// ---------------------------------------------------------------------------

export interface StudentEnrollmentOption {
  enrollment: Enrollment
  classRecord: ClassRecord
  subjectCode: string
  label: string
}

/** Enrollment đang active của 1 học sinh, kèm nhãn "Toán 8A" để hiển thị. */
export function getActiveEnrollmentOptions(studentProfileId: string): StudentEnrollmentOption[] {
  return MOCK_ENROLLMENTS.filter(
    (item) => item.studentProfileId === studentProfileId && item.status === "active"
  )
    .map((enrollment) => {
      const classRecord = findClass(enrollment.classId)
      if (!classRecord) return null
      return {
        enrollment,
        classRecord,
        subjectCode: findSubject(classRecord.subjectId)?.code ?? "",
        label: classRecord.name,
      }
    })
    .filter((item): item is StudentEnrollmentOption => Boolean(item))
}

/** Fetcher cho `StudentPicker` (`EntityPicker`) — chỉ tìm học sinh đang học. */
export async function fetchActiveStudentOptions(search: string): Promise<EntityOption[]> {
  const keyword = search.trim().toLowerCase()

  return MOCK_STUDENTS.filter((student) => student.status !== "withdrawn")
    .filter(
      (student) =>
        !keyword ||
        student.name.toLowerCase().includes(keyword) ||
        student.code.toLowerCase().includes(keyword)
    )
    .slice(0, 20)
    .map(toStudentEntityOption)
}

export interface MakeupPrefill {
  student: EntityOption
  enrollmentId: string
  originalSessionId: string
}

/**
 * Điền sẵn luồng xếp học bù từ deep-link `?studentId=&sessionId=` (vd từ danh sách buổi bị hủy):
 * học sinh, enrollment của học sinh trong lớp của buổi đó, và buổi nghỉ. Không hợp lệ → `null`.
 */
export function getMakeupPrefill(
  studentId?: string | null,
  sessionId?: string | null
): MakeupPrefill | null {
  const student = studentId ? findStudent(studentId) : undefined
  const session = sessionId ? findClassSession(sessionId) : undefined
  if (!student || !session) return null

  const enrollment = MOCK_ENROLLMENTS.find(
    (item) =>
      item.studentProfileId === student.id &&
      item.classId === session.classId &&
      item.status === "active"
  )
  if (!enrollment) return null

  return {
    student: toStudentEntityOption(student),
    enrollmentId: enrollment.id,
    originalSessionId: session.id,
  }
}

function toStudentEntityOption(student: StudentProfile): EntityOption {
  return {
    id: student.id,
    name: student.name,
    sub: `${student.code} · Khối ${student.grade}`,
  }
}

// ---------------------------------------------------------------------------
// PROMPT 10 / 10B / 10C — Buổi nghỉ & buổi học bù
// ---------------------------------------------------------------------------

export interface ReportableSessionRow {
  session: ClassSession
  order: number
  lessonTitle: string
  room: string
  isPast: boolean
}

/**
 * Buổi "gần đây/sắp tới" của 1 lớp để chọn làm buổi nghỉ — cửa sổ 10 ngày trước
 * tới 21 ngày sau `MOCK_TODAY`. `futureOnly` dùng cho PROMPT 10C (Đổi 1 buổi):
 * chỉ được đổi buổi chưa diễn ra.
 */
export function getReportableSessions(
  classId: string,
  options: { futureOnly?: boolean } = {}
): ReportableSessionRow[] {
  const classRecord = findClass(classId)
  if (!classRecord) return []

  const windowStart = addDays(MOCK_TODAY, -10)
  const windowEnd = addDays(MOCK_TODAY, 21)

  return MOCK_CLASS_SESSIONS.filter((session) => session.classId === classId)
    .filter((session) => session.date >= windowStart && session.date <= windowEnd)
    .filter((session) => (options.futureOnly ? session.date > MOCK_TODAY : true))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => ({
      session,
      order: resolveLessonOrder(session.lessonId),
      lessonTitle: resolveLessonTitle(session.lessonId),
      room: classRecord.room,
      isPast: session.date < MOCK_TODAY,
    }))
}

export interface MakeupCandidateRow {
  session: ClassSession
  classRecord: ClassRecord
  order: number
  lessonTitle: string
  teacherName?: string
  availableSlots: number
}

/**
 * Buổi thay thế hợp lệ theo `.claude/skills/attendance-rules`: cùng `programId`,
 * cùng `lessonId`, chưa diễn ra, còn chỗ. Lọc phía "server" (selector), không lọc
 * lại ở component.
 */
export function getMakeupCandidates(originalSessionId: string): MakeupCandidateRow[] {
  const original = findClassSession(originalSessionId)
  if (!original) return []

  const rows: MakeupCandidateRow[] = []

  MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.id !== original.id &&
      session.programId === original.programId &&
      session.lessonId === original.lessonId &&
      session.date > MOCK_TODAY
  ).forEach((session) => {
    const classRecord = findClass(session.classId)
    if (!classRecord) return

    const availableSlots = getAvailableSlots(session.id)
    if (availableSlots <= 0) return

    rows.push({
      session,
      classRecord,
      order: resolveLessonOrder(session.lessonId),
      lessonTitle: resolveLessonTitle(session.lessonId),
      teacherName: findTeacher(session.teacherId)?.name,
      availableSlots,
    })
  })

  return rows.sort((a, b) => a.session.date.localeCompare(b.session.date))
}

export interface MakeupPendingRow {
  assignment: MakeupAssignment
  student?: StudentProfile
  originalSession?: ClassSession
  originalClass?: ClassRecord
  makeupSession?: ClassSession
  makeupClass?: ClassRecord
  assignedByName: string
}

export function getPendingMakeupRows(kind?: MakeupKind): MakeupPendingRow[] {
  return MOCK_MAKEUP_ASSIGNMENTS.filter((item) => !kind || item.kind === kind)
    .map((assignment) => {
      const originalSession = findClassSession(assignment.originalSessionId)
      const makeupSession = findClassSession(assignment.makeupSessionId)

      return {
        assignment,
        student: findStudent(assignment.studentProfileId),
        originalSession,
        originalClass: originalSession ? findClass(originalSession.classId) : undefined,
        makeupSession,
        makeupClass: makeupSession ? findClass(makeupSession.classId) : undefined,
        assignedByName: findStaffAccount(assignment.assignedBy)?.name ?? "—",
      }
    })
    .sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt))
}

// ---------------------------------------------------------------------------
// PROMPT 10D — Đổi lịch cố định (chuyển lớp)
// ---------------------------------------------------------------------------

/** Tiến độ lớp = số buổi đã điểm danh / tổng số bài chương trình. */
function getClassProgress(classId: string): { completed: number; total: number } {
  const classRecord = findClass(classId)
  const program = classRecord ? findProgram(classRecord.programId) : undefined
  const completed = MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.classId === classId && session.attendanceMarkedAt && session.kind === "lesson"
  ).length

  return { completed, total: program?.totalLessons ?? 0 }
}

export interface ClassChangeCandidate {
  classRecord: ClassRecord
  teacherName?: string
  enrolled: number
  isFull: boolean
  progress: { completed: number; total: number }
  /** Chênh lệch bài học so với lớp hiện tại — dương = lớp mới đi nhanh hơn. */
  progressGap: number
}

export interface ClassChangeContext {
  enrollment: Enrollment
  currentClass: ClassRecord
  currentProgress: { completed: number; total: number }
  candidates: ClassChangeCandidate[]
}

export function getClassChangeContext(enrollmentId: string): ClassChangeContext | null {
  const enrollment = findEnrollment(enrollmentId)
  if (!enrollment) return null

  const currentClass = findClass(enrollment.classId)
  if (!currentClass) return null

  const currentProgress = { completed: enrollment.completedLessons, total: getClassProgress(currentClass.id).total }

  const candidates = MOCK_CLASSES.filter(
    (item) =>
      item.id !== currentClass.id &&
      item.programId === currentClass.programId &&
      item.status === "open"
  ).map((classRecord) => {
    const enrolled = MOCK_ENROLLMENTS.filter(
      (item) => item.classId === classRecord.id && item.status === "active"
    ).length
    const progress = getClassProgress(classRecord.id)

    return {
      classRecord,
      teacherName: findTeacher(classRecord.teacherId)?.name,
      enrolled,
      isFull: enrolled >= classRecord.capacity,
      progress,
      progressGap: progress.completed - enrollment.completedLessons,
    }
  })

  return { enrollment, currentClass, currentProgress, candidates }
}

// ---------------------------------------------------------------------------
// PROMPT 10E — Nghỉ dài hạn
// ---------------------------------------------------------------------------

export type LongLeaveStatus = "active" | "upcoming" | "ended"

export function getLongLeaveStatus(leave: LongLeave): LongLeaveStatus {
  if (leave.startDate > MOCK_TODAY) return "upcoming"
  if (leave.endDate < MOCK_TODAY) return "ended"
  return "active"
}

export interface LongLeaveSessionPreview {
  date: string
  classId: string
  subjectCode: string
  lessonTitle: string
}

/**
 * Buổi học trong khoảng ngày nghỉ sẽ tự chuyển "Nghỉ có phép" — tính trực tiếp từ
 * lịch cố định (không đọc lại điểm danh đã ghi) để dùng được cả cho preview lúc
 * tạo (chưa lưu) lẫn hiển thị lại sau khi đã lưu.
 */
export function getLongLeaveAffectedSessions(
  studentProfileId: string,
  subjectIds: string[],
  startDate: string,
  endDate: string
): LongLeaveSessionPreview[] {
  if (!startDate || !endDate) return []

  const enrollments = MOCK_ENROLLMENTS.filter(
    (item) => item.studentProfileId === studentProfileId && item.status === "active"
  ).filter((item) => subjectIds.length === 0 || subjectIds.includes(item.subjectId))

  const rows: LongLeaveSessionPreview[] = []

  enrollments.forEach((enrollment) => {
    MOCK_CLASS_SESSIONS.filter(
      (session) =>
        session.classId === enrollment.classId &&
        session.date >= startDate &&
        session.date <= endDate
    ).forEach((session) => {
      rows.push({
        date: session.date,
        classId: session.classId,
        subjectCode: findSubject(enrollment.subjectId)?.code ?? "",
        lessonTitle: resolveLessonTitle(session.lessonId),
      })
    })
  })

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

export interface LongLeaveRow {
  leave: LongLeave
  student?: StudentProfile
  status: LongLeaveStatus
  subjectCodes: string[]
  affectedSessionCount: number
}

export function getLongLeaveRows(): LongLeaveRow[] {
  return MOCK_LONG_LEAVES.map((leave) => ({
    leave,
    student: findStudent(leave.studentProfileId),
    status: getLongLeaveStatus(leave),
    subjectCodes: leave.subjectIds
      .map((id) => findSubject(id)?.code)
      .filter((code): code is string => Boolean(code)),
    affectedSessionCount: getLongLeaveAffectedSessions(
      leave.studentProfileId,
      leave.subjectIds,
      leave.startDate,
      leave.endDate
    ).length,
  }))
}

export interface LongLeaveTotals {
  active: number
  upcoming: number
  ended: number
}

export function getLongLeaveTotals(rows: LongLeaveRow[]): LongLeaveTotals {
  return {
    active: rows.filter((row) => row.status === "active").length,
    upcoming: rows.filter((row) => row.status === "upcoming").length,
    ended: rows.filter((row) => row.status === "ended").length,
  }
}

// ---------------------------------------------------------------------------
// PROMPT 10F — Nghỉ môn / Nghỉ hẳn / Cho học lại
// ---------------------------------------------------------------------------

export interface WithdrawableEnrollmentRow {
  enrollment: Enrollment
  classRecord: ClassRecord
  subjectCode: string
}

export function getWithdrawableEnrollments(studentProfileId: string): WithdrawableEnrollmentRow[] {
  return getActiveEnrollmentOptions(studentProfileId).map((item) => ({
    enrollment: item.enrollment,
    classRecord: item.classRecord,
    subjectCode: item.subjectCode,
  }))
}

export interface ReenrollRow {
  record: WithdrawalRecord
  student: StudentProfile
  subjectCodes: string[]
}

/** Bảng "Cho học lại" — học sinh đã nghỉ hẳn, cùng các môn đã học trước đó. */
export function getReenrollRows(): ReenrollRow[] {
  return MOCK_STUDENTS.filter((student) => student.status === "withdrawn")
    .map((student) => {
      const record = MOCK_WITHDRAWAL_RECORDS.filter(
        (item) => item.studentProfileId === student.id
      ).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]

      const subjectCodes = Array.from(
        new Set(
          MOCK_ENROLLMENTS.filter((item) => item.studentProfileId === student.id)
            .map((item) => findSubject(item.subjectId)?.code)
            .filter((code): code is string => Boolean(code))
        )
      )

      return record ? { record, student, subjectCodes } : null
    })
    .filter((row): row is ReenrollRow => Boolean(row))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
