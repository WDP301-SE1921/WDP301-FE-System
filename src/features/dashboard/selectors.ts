import {
  MOCK_SESSIONS_TODAY,
  findClass,
  findTeacher,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MOCK_ACTIVATION_LINKS, MOCK_EMAIL_LOGS, MOCK_PAYMENTS } from "@/mocks/data/payments"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import { getDaysRemaining } from "@/features/students/selectors"
import { BUSINESS_RULES } from "@/constants/business-rules"
import type { Payment } from "@/types/student"

/** Số liệu Dashboard đều derive từ mock entity, không hardcode trong page. */

export interface TodaySessionRow {
  id: string
  timeRange: string
  className: string
  subjectCode: string
  lessonTitle: string
  teacherName?: string
  room: string
  /** "marked" = đã điểm danh, "unmarked" = chưa, "no_teacher" = chưa xếp giáo viên. */
  attendanceState: "marked" | "unmarked" | "no_teacher"
}

export interface RecentPaymentRow {
  payment: Payment
  studentName: string
  className: string
  months: number
}

export function getTodaySessionRows(): TodaySessionRow[] {
  return MOCK_SESSIONS_TODAY.map((session) => {
    const classRecord = findClass(session.classId)
    const teacher = findTeacher(session.teacherId)

    return {
      id: session.id,
      timeRange: `${session.startTime}–${session.endTime}`,
      className: classRecord?.name ?? "",
      subjectCode: classRecord?.subjectId.replace("subj-", "").toUpperCase() ?? "",
      lessonTitle: resolveLessonTitle(session.lessonId),
      teacherName: teacher?.name,
      room: classRecord?.room ?? "",
      attendanceState: !session.teacherId
        ? "no_teacher"
        : session.attendanceMarkedAt
          ? "marked"
          : "unmarked",
    }
  })
}

export function getRecentPaymentRows(limit = 5): RecentPaymentRow[] {
  return [...MOCK_PAYMENTS]
    .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
    .slice(0, limit)
    .map((payment) => {
      const enrollment = MOCK_ENROLLMENTS.find((item) => item.id === payment.enrollmentId)
      const student = enrollment ? findStudent(enrollment.studentProfileId) : undefined

      return {
        payment,
        studentName: student?.name ?? "",
        className: findClass(enrollment?.classId ?? "")?.name ?? "",
        months: enrollment?.months ?? 0,
      }
    })
}

export interface PendingTaskCounts {
  expiringLinks: number
  failedEmails: number
  expiringPackages: number
  sessionsWithoutTeacher: number
  endingLongLeaves: number
}

/** Số lượng của từng nhóm việc cần xử lý trên Dashboard. */
export function getPendingTaskCounts(today: Date = new Date()): PendingTaskCounts {
  const expiringLinks = MOCK_ACTIVATION_LINKS.filter(
    (link) =>
      !link.usedAt &&
      getDaysRemaining(link.expiresAt, today) <= BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS
  ).length

  const failedEmails = MOCK_EMAIL_LOGS.filter((item) => item.status === "failed").length

  const expiringPackages = MOCK_ENROLLMENTS.filter(
    (item) => item.status === "active" && getDaysRemaining(item.endDate, today) <= 7
  ).length

  const sessionsWithoutTeacher = MOCK_SESSIONS_TODAY.filter(
    (item) => !item.teacherId
  ).length

  const endingLongLeaves = MOCK_ENROLLMENTS.filter(
    (item) => item.status === "reserved"
  ).length

  return {
    expiringLinks,
    failedEmails,
    expiringPackages,
    sessionsWithoutTeacher,
    endingLongLeaves,
  }
}
