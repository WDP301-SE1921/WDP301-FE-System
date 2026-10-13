import {
  MOCK_CLASS_SESSIONS,
  MOCK_TODAY,
  findClass,
  findClassSession,
  findSubject,
  findTeacher,
  resolveSessionLabel,
} from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import { MOCK_MAKEUP_ASSIGNMENTS } from "@/mocks/data/absences"
import {
  MOCK_SUBSTITUTES,
  MOCK_TEACHER_ABSENCES,
  MOCK_WORK_ADJUSTMENTS,
} from "@/mocks/data/teachers"
import { BUSINESS_RULES } from "@/constants/business-rules"
import type { ClassRecord, ClassSession } from "@/types/catalog"
import type { StudentProfile } from "@/types/student"
import type { TeacherAbsenceReport } from "@/types/teacher"

/**
 * Công giáo viên là field TÍNH ĐƯỢC: 1 buổi có điểm danh bởi giáo viên đó = 1 công (giáo viên
 * dạy thay được công, giáo viên gốc thì không). Không lưu công lên entity — derive tại đây từ
 * `ClassSession`, `TeacherAbsenceReport`, `SubstituteAssignment`, `WorkCreditAdjustment`.
 * Xem `.claude/rules/data-contracts.md`.
 */

export type WorkCreditStatus =
  | "settled"
  | "adjusted"
  | "substituted_in"
  | "unsettled"
  | "absent_notified"
  | "absent_urgent"
  | "cancelled"

export interface WorkCreditSessionRow {
  session: ClassSession
  classRecord?: ClassRecord
  subjectCode: string
  sessionLabel: string
  /** Số giờ tham khảo của buổi, suy từ giờ bắt đầu / kết thúc. */
  hours: number
  status: WorkCreditStatus
  /** 1 nếu buổi này được tính công cho giáo viên, 0 nếu không. */
  credit: 0 | 1
  /** Lý do báo nghỉ / hủy buổi / ghi nhận công nếu có. */
  note?: string
}

export interface WorkCreditSummary {
  credits: number
  hours: number
  substitutedIn: number
  absentNotified: number
  absentUrgent: number
  unsettled: number
  cancelled: number
}

/** Báo nghỉ trong vòng N giờ trước giờ học = đột xuất (derive, không lưu). */
export function isUrgentAbsence(report: TeacherAbsenceReport, session: ClassSession): boolean {
  const sessionStart = new Date(`${session.date}T${session.startTime}:00`).getTime()
  const reportedAt = new Date(report.reportedAt).getTime()
  return sessionStart - reportedAt < BUSINESS_RULES.TEACHER_ABSENCE_URGENT_HOURS * 60 * 60 * 1000
}

function sessionHours(session: ClassSession): number {
  const [startHour, startMinute] = session.startTime.split(":").map(Number)
  const [endHour, endMinute] = session.endTime.split(":").map(Number)
  return Math.round(((endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60) * 10) / 10
}

function resolveRow(session: ClassSession, teacherId: string): WorkCreditSessionRow | null {
  const classRecord = findClass(session.classId)
  const report = MOCK_TEACHER_ABSENCES.find(
    (item) => item.classSessionId === session.id && item.teacherId === teacherId
  )
  const substitution = MOCK_SUBSTITUTES.find(
    (item) => item.classSessionId === session.id && item.status !== "cancelled"
  )
  const adjustment = MOCK_WORK_ADJUSTMENTS.find(
    (item) => item.classSessionId === session.id && item.teacherId === teacherId
  )

  const base = {
    session,
    classRecord,
    subjectCode: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
    sessionLabel: resolveSessionLabel(session),
    hours: sessionHours(session),
  }

  if (session.cancelledAt) {
    return { ...base, status: "cancelled", credit: 0, note: session.cancelReason }
  }

  if (session.attendanceMarkedBy === teacherId) {
    const isSubstitute = substitution?.substituteTeacherId === teacherId
    return {
      ...base,
      status: isSubstitute ? "substituted_in" : "settled",
      credit: 1,
      note: isSubstitute ? substitution?.reason : undefined,
    }
  }

  if (adjustment) {
    return { ...base, status: "adjusted", credit: 1, note: adjustment.reason }
  }

  if (report) {
    return {
      ...base,
      status: isUrgentAbsence(report, session) ? "absent_urgent" : "absent_notified",
      credit: 0,
      note: report.reason,
    }
  }

  if (substitution && substitution.mainTeacherId === teacherId) {
    return { ...base, status: "absent_notified", credit: 0, note: substitution.reason }
  }

  if (session.teacherId === teacherId && !session.attendanceMarkedAt && session.date < MOCK_TODAY) {
    return { ...base, status: "unsettled", credit: 0 }
  }

  return null
}

function summarize(rows: WorkCreditSessionRow[]): WorkCreditSummary {
  const count = (status: WorkCreditStatus) => rows.filter((row) => row.status === status).length

  return {
    credits: rows.reduce((sum, row) => sum + row.credit, 0),
    hours: Math.round(rows.reduce((sum, row) => sum + row.credit * row.hours, 0) * 10) / 10,
    substitutedIn: count("substituted_in"),
    absentNotified: count("absent_notified"),
    absentUrgent: count("absent_urgent"),
    unsettled: count("unsettled"),
    cancelled: count("cancelled"),
  }
}

/** Các buổi (đến hết hôm nay) liên quan tới công của một giáo viên trong `month` (`YYYY-MM`). */
export function getTeacherWorkCreditRows(teacherId: string, month: string): WorkCreditSessionRow[] {
  return MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.date.startsWith(month) &&
      session.date <= MOCK_TODAY &&
      (session.teacherId === teacherId ||
        session.attendanceMarkedBy === teacherId ||
        MOCK_TEACHER_ABSENCES.some(
          (item) => item.classSessionId === session.id && item.teacherId === teacherId
        ) ||
        MOCK_SUBSTITUTES.some(
          (item) => item.classSessionId === session.id && item.mainTeacherId === teacherId
        ))
  )
    .map((session) => resolveRow(session, teacherId))
    .filter((row): row is WorkCreditSessionRow => row !== null)
    .sort((a, b) => b.session.date.localeCompare(a.session.date))
}

export interface TeacherWorkCredits {
  rows: WorkCreditSessionRow[]
  summary: WorkCreditSummary
}

export function getTeacherWorkCredits(teacherId: string, month: string): TeacherWorkCredits {
  const rows = getTeacherWorkCreditRows(teacherId, month)
  return { rows, summary: summarize(rows) }
}

/** Tháng có buổi học đã diễn ra (đến hết hôm nay), mới nhất trước — cho bộ chọn tháng. */
export function getWorkCreditMonths(): string[] {
  return Array.from(
    new Set(
      MOCK_CLASS_SESSIONS.filter((session) => session.date <= MOCK_TODAY).map((session) =>
        session.date.slice(0, 7)
      )
    )
  ).sort((a, b) => b.localeCompare(a))
}

export const CURRENT_WORK_CREDIT_MONTH = MOCK_TODAY.slice(0, 7)

// ---------------------------------------------------------------------------
// Báo nghỉ chờ xử lý (quản lý trung tâm) và buổi hủy cần học bù (nhân viên)
// ---------------------------------------------------------------------------

export interface TeacherAbsenceRow {
  report: TeacherAbsenceReport
  session?: ClassSession
  classRecord?: ClassRecord
  subjectCode: string
  sessionLabel: string
  teacherName: string
  isUrgent: boolean
}

function toAbsenceRow(report: TeacherAbsenceReport): TeacherAbsenceRow {
  const session = findClassSession(report.classSessionId)
  const classRecord = findClass(session?.classId ?? "")

  return {
    report,
    session,
    classRecord,
    subjectCode: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
    sessionLabel: session ? resolveSessionLabel(session) : "—",
    teacherName: findTeacher(report.teacherId)?.name ?? "—",
    isUrgent: session ? isUrgentAbsence(report, session) : false,
  }
}

/** Báo nghỉ chờ xử lý, đột xuất và buổi gần nhất lên trước. */
export function getPendingAbsenceRows(): TeacherAbsenceRow[] {
  return MOCK_TEACHER_ABSENCES.filter((item) => item.status === "pending")
    .map(toAbsenceRow)
    .sort(
      (a, b) =>
        Number(b.isUrgent) - Number(a.isUrgent) ||
        (a.session?.date ?? "").localeCompare(b.session?.date ?? "")
    )
}

/** Id các buổi giáo viên đã báo nghỉ và đang chờ xử lý — để ẩn nút "Báo nghỉ" ở lịch dạy. */
export function getPendingAbsenceSessionIds(teacherId: string): string[] {
  return MOCK_TEACHER_ABSENCES.filter(
    (item) => item.teacherId === teacherId && item.status === "pending"
  ).map((item) => item.classSessionId)
}

export function getPendingAbsenceCount(): number {
  return MOCK_TEACHER_ABSENCES.filter((item) => item.status === "pending").length
}

export interface CancelledSessionMakeupRow {
  session: ClassSession
  classRecord: ClassRecord
  sessionLabel: string
  /** Học sinh của lớp chưa được xếp học bù cho buổi này. */
  students: StudentProfile[]
}

/** Buổi bị trung tâm hủy mà còn học sinh chưa xếp học bù. */
export function getCancelledSessionMakeupNeeds(): CancelledSessionMakeupRow[] {
  return MOCK_CLASS_SESSIONS.filter((session) => session.cancelledAt)
    .map((session) => {
      const classRecord = findClass(session.classId)
      if (!classRecord) return null

      const students = MOCK_ENROLLMENTS.filter(
        (item) => item.classId === session.classId && item.status === "active"
      )
        .map((item) => findStudent(item.studentProfileId))
        .filter((student): student is StudentProfile => Boolean(student))
        .filter(
          (student) =>
            !MOCK_MAKEUP_ASSIGNMENTS.some(
              (assignment) =>
                assignment.originalSessionId === session.id &&
                assignment.studentProfileId === student.id
            )
        )

      return { session, classRecord, sessionLabel: resolveSessionLabel(session), students }
    })
    .filter((row): row is CancelledSessionMakeupRow => row !== null && row.students.length > 0)
}
