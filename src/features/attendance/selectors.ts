import {
  MOCK_SESSIONS_TODAY,
  findClass,
  findClassSession,
  findSubject,
  findTeacher,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS, findStudent } from "@/mocks/data/students"
import { findAttendanceBySession } from "@/mocks/data/attendance"
import { MOCK_LONG_LEAVES } from "@/mocks/data/absences"
import { getEnrolledCount } from "@/features/classes/selectors"
import type { ClassRecord, ClassSession } from "@/types/catalog"
import type { AttendanceStatus } from "@/types/student"

/**
 * Field TÍNH ĐƯỢC cho màn Điểm danh của Giáo viên — derive từ `ClassSession`,
 * `AttendanceRecord`, `LongLeave` đã có, không dựng entity mới.
 */

export interface AttendanceSessionRow {
  session: ClassSession
  classRecord: ClassRecord
  subjectCode: string
  lessonTitle: string
  room: string
  enrolled: number
  capacity: number
  isMarked: boolean
}

function toAttendanceSessionRow(session: ClassSession): AttendanceSessionRow | null {
  const classRecord = findClass(session.classId)
  if (!classRecord) return null

  return {
    session,
    classRecord,
    subjectCode: findSubject(classRecord.subjectId)?.code ?? "",
    lessonTitle: resolveLessonTitle(session.lessonId),
    room: classRecord.room,
    enrolled: getEnrolledCount(classRecord.id),
    capacity: classRecord.capacity,
    isMarked: Boolean(session.attendanceMarkedAt),
  }
}

/** Buổi học hôm nay của các lớp do một giáo viên phụ trách. */
export function getTodayAttendanceRows(teacherId: string): AttendanceSessionRow[] {
  return MOCK_SESSIONS_TODAY.filter((session) => session.teacherId === teacherId)
    .map(toAttendanceSessionRow)
    .filter((row): row is AttendanceSessionRow => Boolean(row))
}

export interface AttendanceRosterEntry {
  studentProfileId: string
  name: string
  code: string
  status: AttendanceStatus
  note?: string
  /** Chỉ bật nút "Nghỉ có phép" khi học sinh có `LongLeave` phủ ngày buổi học này. */
  canExcuse: boolean
}

export interface AttendanceSessionDetail {
  session: ClassSession
  classRecord: ClassRecord
  subjectCode: string
  lessonTitle: string
  teacherName?: string
  roster: AttendanceRosterEntry[]
}

function canExcuseStudent(
  studentProfileId: string,
  date: string,
  subjectId: string
): boolean {
  return MOCK_LONG_LEAVES.some(
    (leave) =>
      leave.studentProfileId === studentProfileId &&
      leave.startDate <= date &&
      date <= leave.endDate &&
      (leave.subjectIds.length === 0 || leave.subjectIds.includes(subjectId))
  )
}

/** Roster của 1 buổi học, mặc định trạng thái "Có mặt" khi chưa có bản ghi điểm danh. */
export function getAttendanceSessionDetail(
  sessionId: string
): AttendanceSessionDetail | null {
  const session = findClassSession(sessionId)
  if (!session) return null

  const classRecord = findClass(session.classId)
  if (!classRecord) return null

  const recordByStudent = new Map(
    findAttendanceBySession(sessionId).map((record) => [record.studentProfileId, record])
  )

  const roster: AttendanceRosterEntry[] = MOCK_ENROLLMENTS.filter(
    (item) => item.classId === session.classId && item.status === "active"
  )
    .map((item) => findStudent(item.studentProfileId))
    .filter((student): student is NonNullable<typeof student> => Boolean(student))
    .map((student) => {
      const existing = recordByStudent.get(student.id)

      return {
        studentProfileId: student.id,
        name: student.name,
        code: student.code,
        status: existing?.status ?? "present",
        note: existing?.note,
        canExcuse: canExcuseStudent(student.id, session.date, classRecord.subjectId),
      }
    })

  return {
    session,
    classRecord,
    subjectCode: findSubject(classRecord.subjectId)?.code ?? "",
    lessonTitle: resolveLessonTitle(session.lessonId),
    teacherName: findTeacher(session.teacherId)?.name,
    roster,
  }
}
