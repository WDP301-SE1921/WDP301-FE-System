import {
  MOCK_CLASS_SESSIONS,
  MOCK_TODAY,
  findClass,
  findSubject,
  findTeacher,
  resolveLessonTitle,
  resolveSessionLabel,
} from "@/mocks/data/catalog"
import { findAttendanceBySession } from "@/mocks/data/attendance"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import type { CalendarEvent } from "@/components/shared/calendar/schedule-calendar"
import type { SessionStatus } from "@/components/shared/calendar/session-block"

/** Buổi học được map sang `CalendarEvent` của `<ScheduleCalendar />`. */

export interface ScheduleFilters {
  teacherId?: string
  subjectId?: string
  room?: string
  classId?: string
}

function resolveStatus(
  sessionDate: string,
  hasTeacher: boolean,
  isCancelled = false
): SessionStatus {
  if (isCancelled || !hasTeacher) return "CANCELLED"
  if (sessionDate < MOCK_TODAY) return "COMPLETED"
  return "SCHEDULED"
}

export function getCalendarEvents(filters: ScheduleFilters = {}): CalendarEvent[] {
  return MOCK_CLASS_SESSIONS.filter((session) => {
    const classRecord = findClass(session.classId)
    if (!classRecord) return false

    if (filters.teacherId && session.teacherId !== filters.teacherId) return false
    if (filters.subjectId && classRecord.subjectId !== filters.subjectId) return false
    if (filters.room && classRecord.room !== filters.room) return false
    if (filters.classId && session.classId !== filters.classId) return false

    return true
  }).map((session) => {
    const classRecord = findClass(session.classId)
    const teacher = findTeacher(session.teacherId)

    const classStudentIds = MOCK_ENROLLMENTS.filter(
      (item) => item.classId === session.classId
    ).map((item) => item.studentProfileId)

    const records = findAttendanceBySession(session.id)
    const absentStudents = records
      .filter((record) => record.status === "absent" || record.status === "excused")
      .map((record) => ({
        id: record.studentProfileId,
        name: findStudent(record.studentProfileId)?.name ?? "",
        reason: record.note,
      }))

    return {
      id: session.id,
      title: `${classRecord?.name ?? ""} · ${resolveSessionLabel(session)}`,
      subject: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
      date: session.date,
      time: `${session.startTime} - ${session.endTime}`,
      startHour: Number(session.startTime.slice(0, 2)),
      room: classRecord?.room,
      teacherName: teacher?.name,
      status: resolveStatus(session.date, Boolean(session.teacherId), Boolean(session.cancelledAt)),
      totalStudents: classStudentIds.length,
      attendedCount: records.filter(
        (record) => record.status === "present" || record.status === "made_up"
      ).length,
      absentStudents,
    }
  })
}

export interface ScheduleSummary {
  weekSessionCount: number
  needsCoordination: number
}

/** Buổi trong tuần chứa `MOCK_TODAY`, và số buổi chưa xếp giáo viên. */
export function getScheduleSummary(events: CalendarEvent[]): ScheduleSummary {
  const today = new Date(MOCK_TODAY)
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const from = monday.toISOString().slice(0, 10)
  const to = sunday.toISOString().slice(0, 10)

  const weekEvents = events.filter(
    (event) => event.date >= from && event.date <= to
  )

  return {
    weekSessionCount: weekEvents.length,
    needsCoordination: weekEvents.filter((event) => !event.teacherName).length,
  }
}

/** Ghép dữ liệu cho drawer chi tiết buổi học (PROMPT 9B). */
export function getSessionDetail(sessionId: string) {
  const session = MOCK_CLASS_SESSIONS.find((item) => item.id === sessionId)
  if (!session) return null

  const classRecord = findClass(session.classId)
  const records = findAttendanceBySession(session.id)

  return {
    id: session.id,
    title: `${classRecord?.name ?? ""} · ${resolveSessionLabel(session)}`,
    subject: findSubject(classRecord?.subjectId ?? "")?.code ?? "",
    date: session.date,
    time: `${session.startTime} - ${session.endTime}`,
    room: classRecord?.room,
    teacherName: findTeacher(session.teacherId)?.name,
    status: resolveStatus(session.date, Boolean(session.teacherId), Boolean(session.cancelledAt)),
    teacherId: session.teacherId,
    isMarked: Boolean(session.attendanceMarkedAt),
    isCancelled: Boolean(session.cancelledAt),
    lessonTitle: resolveLessonTitle(session.lessonId),
    totalStudents: MOCK_ENROLLMENTS.filter(
      (item) => item.classId === session.classId
    ).length,
    attendedCount: records.filter(
      (record) => record.status === "present" || record.status === "made_up"
    ).length,
    absentStudents: records
      .filter((record) => record.status === "absent" || record.status === "excused")
      .map((record) => ({
        id: record.studentProfileId,
        name: findStudent(record.studentProfileId)?.name ?? "",
        reason: record.note,
      })),
    classId: session.classId,
  }
}
