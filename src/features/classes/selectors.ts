import {
  MOCK_CLASSES,
  MOCK_PROGRAMS,
  MOCK_TEACHERS,
  MOCK_TODAY,
  findClass,
  findProgram,
  findSubject,
  findTeacher,
  findSessionsByClass,
  resolveLessonOrder,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import { findAttendanceBySession } from "@/mocks/data/attendance"
import type { ClassRecord, ClassSession, Program } from "@/types/catalog"
import type { StudentProfile } from "@/types/student"

/**
 * Sĩ số, tiến độ và trạng thái buổi học là field TÍNH ĐƯỢC — derive tại đây thay vì
 * nhét vào entity. Xem `.claude/rules/data-contracts.md`.
 */

export type SessionState = "marked" | "unmarked" | "upcoming"

export interface ClassRow {
  classRecord: ClassRecord
  program?: Program
  subjectCode: string
  teacherName?: string
  enrolled: number
  isFull: boolean
  /** Số buổi đã điểm danh trên tổng số bài của chương trình. */
  completedLessons: number
  totalLessons: number
}

export interface ClassSessionRow {
  session: ClassSession
  order: number
  lessonTitle: string
  teacherName?: string
  state: SessionState
  isToday: boolean
  /** Số học sinh học bù đến buổi này. */
  makeupCount: number
}

export interface ClassDetail extends ClassRow {
  sessions: ClassSessionRow[]
  students: StudentProfile[]
}

export function getEnrolledCount(classId: string): number {
  return MOCK_ENROLLMENTS.filter(
    (item) => item.classId === classId && item.status === "active"
  ).length
}

function toClassRow(classRecord: ClassRecord): ClassRow {
  const program = findProgram(classRecord.programId)
  const enrolled = getEnrolledCount(classRecord.id)
  const sessions = findSessionsByClass(classRecord.id)

  return {
    classRecord,
    program,
    subjectCode: findSubject(classRecord.subjectId)?.code ?? "",
    teacherName: findTeacher(classRecord.teacherId)?.name,
    enrolled,
    isFull: enrolled >= classRecord.capacity,
    completedLessons: sessions.filter((item) => item.attendanceMarkedAt).length,
    totalLessons: program?.totalLessons ?? sessions.length,
  }
}

export function getClassRows(): ClassRow[] {
  return MOCK_CLASSES.map(toClassRow)
}

function toSessionRow(session: ClassSession): ClassSessionRow {
  const order = resolveLessonOrder(session.lessonId)
  const isToday = session.date === MOCK_TODAY

  const state: SessionState = session.attendanceMarkedAt
    ? "marked"
    : session.date <= MOCK_TODAY
      ? "unmarked"
      : "upcoming"

  // Học bù = bản ghi điểm danh của học sinh KHÔNG thuộc danh sách lớp.
  const classStudentIds = new Set(
    MOCK_ENROLLMENTS.filter((item) => item.classId === session.classId).map(
      (item) => item.studentProfileId
    )
  )
  const makeupCount = findAttendanceBySession(session.id).filter(
    (record) => !classStudentIds.has(record.studentProfileId)
  ).length

  return {
    session,
    order,
    lessonTitle: resolveLessonTitle(session.lessonId),
    teacherName: findTeacher(session.teacherId)?.name,
    state,
    isToday,
    makeupCount,
  }
}

export function getClassDetail(classId: string): ClassDetail | null {
  const classRecord = findClass(classId)
  if (!classRecord) return null

  const students = MOCK_ENROLLMENTS.filter((item) => item.classId === classId)
    .map((item) => findStudent(item.studentProfileId))
    .filter((item): item is StudentProfile => Boolean(item))

  return {
    ...toClassRow(classRecord),
    sessions: findSessionsByClass(classId).map(toSessionRow),
    students,
  }
}

export interface ClassTotals {
  total: number
  open: number
  full: number
  students: number
  averageStudents: number
  openPercent: number
}

export function getClassTotals(rows: ClassRow[]): ClassTotals {
  const open = rows.filter((row) => row.classRecord.status === "open").length
  const students = rows.reduce((sum, row) => sum + row.enrolled, 0)

  return {
    total: rows.length,
    open,
    full: rows.filter((row) => row.isFull).length,
    students,
    averageStudents:
      rows.length === 0 ? 0 : Math.round((students / rows.length) * 10) / 10,
    openPercent: rows.length === 0 ? 0 : Math.round((open / rows.length) * 1000) / 10,
  }
}

/** Danh sách phòng học đang dùng, cho filter và cột "Xem theo phòng". */
export function getRoomOptions(): string[] {
  return Array.from(new Set(MOCK_CLASSES.map((item) => item.room))).sort()
}

export function getTeacherOptions(): Array<{ value: string; label: string }> {
  return MOCK_TEACHERS.map((item) => ({ value: item.id, label: item.name }))
}

export function getProgramOptions(): Array<{ value: string; label: string }> {
  return MOCK_PROGRAMS.map((item) => ({ value: item.id, label: item.name }))
}
