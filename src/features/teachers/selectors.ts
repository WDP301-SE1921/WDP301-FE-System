import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  MOCK_SUBJECTS,
  MOCK_TEACHERS,
  MOCK_TODAY,
  findClass,
  findSubject,
  findTeacher,
  resolveLessonOrder,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MOCK_SUBSTITUTES } from "@/mocks/data/teachers"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import { findManager } from "@/mocks/data/payments"
import type { ClassRecord, ClassSession, Teacher } from "@/types/catalog"
import type { SubstituteAssignment } from "@/types/teacher"

/**
 * Tải giảng dạy, số lớp phụ trách, số buổi dạy thay là field TÍNH ĐƯỢC — derive tại
 * đây thay vì nhét vào entity `Teacher`. Xem `.claude/rules/data-contracts.md`.
 */

/** Tuần chứa ngày "hôm nay" của bộ mock. */
function getCurrentWeekRange(): { from: string; to: string } {
  const today = new Date(MOCK_TODAY)
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  }
}

export const CURRENT_WEEK = getCurrentWeekRange()

export interface TeacherRow {
  teacher: Teacher
  subjectCodes: string[]
  classes: ClassRecord[]
  classCount: number
  /** Số buổi dạy trong tuần hiện tại. */
  weeklySessionCount: number
  /** Tổng số học sinh của các lớp phụ trách. */
  studentCount: number
  /** Số lần đi dạy thay trong tháng hiện tại. */
  substituteCount: number
}

function countStudents(classes: ClassRecord[]): number {
  return classes.reduce(
    (sum, item) =>
      sum +
      MOCK_ENROLLMENTS.filter(
        (enrollment) =>
          enrollment.classId === item.id && enrollment.status === "active"
      ).length,
    0
  )
}

export function toTeacherRow(teacher: Teacher): TeacherRow {
  const classes = MOCK_CLASSES.filter((item) => item.teacherId === teacher.id)

  const weeklySessionCount = MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.teacherId === teacher.id &&
      session.date >= CURRENT_WEEK.from &&
      session.date <= CURRENT_WEEK.to
  ).length

  const monthPrefix = MOCK_TODAY.slice(0, 7)
  const substituteCount = MOCK_SUBSTITUTES.filter(
    (item) =>
      item.substituteTeacherId === teacher.id &&
      item.assignedAt.startsWith(monthPrefix)
  ).length

  return {
    teacher,
    subjectCodes: teacher.subjectIds
      .map((id) => findSubject(id)?.code)
      .filter((code): code is string => Boolean(code)),
    classes,
    classCount: classes.length,
    weeklySessionCount,
    studentCount: countStudents(classes),
    substituteCount,
  }
}

export function getTeacherRows(): TeacherRow[] {
  return MOCK_TEACHERS.map(toTeacherRow)
}

export function findTeacherRow(teacherId: string): TeacherRow | null {
  const teacher = findTeacher(teacherId)
  return teacher ? toTeacherRow(teacher) : null
}

export interface TeacherTotals {
  active: number
  inactive: number
  /** Tổng giờ dạy của cả trung tâm trong tuần. */
  weeklyHours: number
  runningClasses: number
  averageRating: number
}

export function getTeacherTotals(rows: TeacherRow[]): TeacherTotals {
  const active = rows.filter((row) => row.teacher.status === "active")

  const weeklyMinutes = MOCK_CLASS_SESSIONS.filter(
    (session) =>
      session.teacherId &&
      session.date >= CURRENT_WEEK.from &&
      session.date <= CURRENT_WEEK.to
  ).reduce((sum, session) => {
    const [startHour, startMinute] = session.startTime.split(":").map(Number)
    const [endHour, endMinute] = session.endTime.split(":").map(Number)
    return sum + (endHour * 60 + endMinute - (startHour * 60 + startMinute))
  }, 0)

  const ratedTeachers = active.filter((row) => row.teacher.rating > 0)

  return {
    active: active.length,
    inactive: rows.filter((row) => row.teacher.status === "inactive").length,
    weeklyHours: Math.round(weeklyMinutes / 60),
    runningClasses: MOCK_CLASSES.filter((item) => item.status === "open").length,
    averageRating:
      ratedTeachers.length === 0
        ? 0
        : Math.round(
            (ratedTeachers.reduce((sum, row) => sum + row.teacher.rating, 0) /
              ratedTeachers.length) *
              10
          ) / 10,
  }
}

export interface SubstituteCandidateSession {
  session: ClassSession
  classRecord?: ClassRecord
  subjectCode: string
  lessonTitle: string
  lessonOrder: number
  mainTeacherName?: string
  /** Buổi chưa có giáo viên nào phụ trách. */
  needsTeacher: boolean
  studentCount: number
}

/** Buổi học từ hôm nay trở đi, dùng cho màn xếp dạy thay (PROMPT 11D). */
export function getSubstituteCandidateSessions(): SubstituteCandidateSession[] {
  return MOCK_CLASS_SESSIONS.filter((session) => session.date >= MOCK_TODAY)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 40)
    .map((session) => {
      const classRecord = findClass(session.classId)

      return {
        session,
        classRecord,
        subjectCode: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
        lessonTitle: resolveLessonTitle(session.lessonId),
        lessonOrder: resolveLessonOrder(session.lessonId),
        mainTeacherName: findTeacher(session.teacherId)?.name,
        needsTeacher: !session.teacherId,
        studentCount: MOCK_ENROLLMENTS.filter(
          (item) => item.classId === session.classId && item.status === "active"
        ).length,
      }
    })
}

export interface SubstituteCandidate {
  teacher: Teacher
  /** Số buổi giáo viên này đã dạy trong ngày của buổi đang xét. */
  sessionsOnDate: number
  /** Trùng lịch với buổi đang xét. */
  hasConflict: boolean
  /** Dạy đúng môn của lớp. */
  isSameSubject: boolean
}

/**
 * Giáo viên có thể nhận dạy thay cho một buổi: ưu tiên cùng môn và không trùng giờ.
 * Trùng lịch = đã có buổi khác cùng ngày giao nhau về thời gian.
 */
export function getSubstituteCandidates(sessionId: string): SubstituteCandidate[] {
  const session = MOCK_CLASS_SESSIONS.find((item) => item.id === sessionId)
  if (!session) return []

  const classRecord = findClass(session.classId)

  return MOCK_TEACHERS.filter(
    (teacher) => teacher.status === "active" && teacher.id !== session.teacherId
  )
    .map((teacher) => {
      const sameDaySessions = MOCK_CLASS_SESSIONS.filter(
        (item) => item.teacherId === teacher.id && item.date === session.date
      )

      const hasConflict = sameDaySessions.some(
        (item) =>
          session.startTime < item.endTime && item.startTime < session.endTime
      )

      return {
        teacher,
        sessionsOnDate: sameDaySessions.length,
        hasConflict,
        isSameSubject: classRecord
          ? teacher.subjectIds.includes(classRecord.subjectId)
          : false,
      }
    })
    .sort((a, b) => {
      if (a.hasConflict !== b.hasConflict) return a.hasConflict ? 1 : -1
      if (a.isSameSubject !== b.isSameSubject) return a.isSameSubject ? -1 : 1
      return a.sessionsOnDate - b.sessionsOnDate
    })
}

export interface SubstituteHistoryRow {
  assignment: SubstituteAssignment
  session?: ClassSession
  classRecord?: ClassRecord
  subjectCode: string
  lessonOrder: number
  mainTeacherName?: string
  substituteTeacherName?: string
  assignedByName: string
}

export function getSubstituteHistory(): SubstituteHistoryRow[] {
  return MOCK_SUBSTITUTES.map((assignment) => {
    const session = MOCK_CLASS_SESSIONS.find(
      (item) => item.id === assignment.classSessionId
    )
    const classRecord = findClass(session?.classId ?? "")

    return {
      assignment,
      session,
      classRecord,
      subjectCode: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
      lessonOrder: session ? resolveLessonOrder(session.lessonId) : 0,
      mainTeacherName: findTeacher(assignment.mainTeacherId)?.name,
      substituteTeacherName: findTeacher(assignment.substituteTeacherId)?.name,
      assignedByName: findManager(assignment.assignedBy)?.name ?? "—",
    }
  })
}

/** Giáo viên có thể nhận phụ trách một lớp (PROMPT 11E). */
export function getClassTeacherCandidates(classId: string): SubstituteCandidate[] {
  const classRecord = findClass(classId)
  if (!classRecord) return []

  return MOCK_TEACHERS.filter(
    (teacher) => teacher.status === "active" && teacher.id !== classRecord.teacherId
  )
    .map((teacher) => {
      const teacherClasses = MOCK_CLASSES.filter(
        (item) => item.teacherId === teacher.id && item.status === "open"
      )

      // Trùng lịch cố định: chung thứ và khung giờ giao nhau.
      const hasConflict = teacherClasses.some(
        (item) =>
          item.weekdays.some((day) => classRecord.weekdays.includes(day)) &&
          classRecord.startTime < item.endTime &&
          item.startTime < classRecord.endTime
      )

      return {
        teacher,
        sessionsOnDate: teacherClasses.length,
        hasConflict,
        isSameSubject: teacher.subjectIds.includes(classRecord.subjectId),
      }
    })
    .sort((a, b) => {
      if (a.hasConflict !== b.hasConflict) return a.hasConflict ? 1 : -1
      if (a.isSameSubject !== b.isSameSubject) return a.isSameSubject ? -1 : 1
      return a.sessionsOnDate - b.sessionsOnDate
    })
}

export function getSubjectOptions(): Array<{ value: string; label: string }> {
  return MOCK_SUBJECTS.map((subject) => ({ value: subject.id, label: subject.name }))
}
