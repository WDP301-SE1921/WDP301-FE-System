import type { AttendanceRecord, AttendanceStatus } from "@/types/student"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import { findClassSession, findSessionsByClass } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"

/**
 * Bản ghi điểm danh giả lập cho giai đoạn MOCK-ONLY.
 * Buổi học thuộc về LỚP (`MOCK_CLASS_SESSIONS` trong `catalog.ts`); file này chỉ
 * sinh điểm danh của từng học sinh trên các buổi lớp đó.
 *
 * Xóa file này trong cùng PR nối endpoint điểm danh thật.
 */

/** Chuỗi trạng thái lặp lại để sinh dữ liệu ổn định, không dùng random. */
const STATUS_CYCLE: AttendanceStatus[] = [
  "present",
  "present",
  "present",
  "present",
  "made_up",
  "present",
  "present",
  "excused",
  "present",
  "present",
  "absent",
  "present",
]

const MAKEUP_NOTE = "Học bù tại lớp cùng chương trình"
const EXCUSED_NOTE = "Phụ huynh báo nghỉ trước buổi học"

/**
 * Mỗi enrollment điểm danh trên `completedLessons` buổi đầu tiên của lớp.
 * Lệch pha theo chỉ số enrollment để các học sinh cùng lớp không trùng trạng thái.
 */
function buildAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []

  MOCK_ENROLLMENTS.forEach((enrollment, enrollmentIndex) => {
    const sessions = findSessionsByClass(enrollment.classId).slice(
      0,
      enrollment.completedLessons
    )

    sessions.forEach((session, index) => {
      const status =
        STATUS_CYCLE[(index + enrollmentIndex) % STATUS_CYCLE.length]

      records.push({
        id: `att-${enrollment.id}-${index + 1}`,
        classSessionId: session.id,
        studentProfileId: enrollment.studentProfileId,
        status,
        note:
          status === "made_up"
            ? MAKEUP_NOTE
            : status === "excused"
              ? EXCUSED_NOTE
              : undefined,
      })
    })
  })

  return records
}

export const MOCK_ATTENDANCE: AttendanceRecord[] = buildAttendance()

export function findAttendanceByStudent(
  studentProfileId: string
): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter((item) => item.studentProfileId === studentProfileId)
}

export function findAttendanceBySession(classSessionId: string): AttendanceRecord[] {
  return MOCK_ATTENDANCE.filter((item) => item.classSessionId === classSessionId)
}

export interface SaveAttendanceInput {
  studentProfileId: string
  status: AttendanceStatus
  note?: string
}

/**
 * Lưu điểm danh của Giáo viên cho 1 buổi học (PROMPT T4B): thay toàn bộ bản ghi
 * cũ của buổi này bằng lượt điểm danh mới, và đánh dấu buổi đã điểm danh.
 */
export function mockSaveAttendance(
  sessionId: string,
  records: SaveAttendanceInput[]
): AttendanceRecord[] {
  const session = findClassSession(sessionId)
  if (!session) throw new MockError(ERROR_MSG.NOT_FOUND)

  for (let index = MOCK_ATTENDANCE.length - 1; index >= 0; index -= 1) {
    if (MOCK_ATTENDANCE[index].classSessionId === sessionId) {
      MOCK_ATTENDANCE.splice(index, 1)
    }
  }

  const newRecords: AttendanceRecord[] = records.map((record, index) => ({
    id: `att-${sessionId}-${index + 1}`,
    classSessionId: sessionId,
    studentProfileId: record.studentProfileId,
    status: record.status,
    note: record.note,
  }))

  MOCK_ATTENDANCE.push(...newRecords)
  session.attendanceMarkedAt = new Date().toISOString()

  return newRecords
}

/** Tỷ lệ đi học toàn trung tâm theo 7 ngày gần nhất, dùng cho biểu đồ Dashboard. */
export const MOCK_WEEKLY_ATTENDANCE = [
  { day: "T2", rate: 93.1 },
  { day: "T3", rate: 92.6 },
  { day: "Hôm nay", rate: 94.2, isToday: true },
  { day: "T5", rate: 95.4 },
  { day: "T6", rate: 91.8 },
  { day: "T7", rate: 96.2 },
  { day: "CN", rate: 89.5 },
]
