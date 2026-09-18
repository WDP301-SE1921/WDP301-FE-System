import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  findProgram,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import type { ClassFormInput } from "@/lib/validators/class"
import type { ClassRecord, ClassSession } from "@/types/catalog"

/**
 * Tạo lớp + sinh buổi học giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint lớp học thật.
 */

/** Nhãn thứ trong `ClassRecord.weekdays` → số thứ tự theo `Date.getUTCDay()`. */
const WEEKDAY_TO_INDEX: Record<string, number> = {
  CN: 0,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
}

export interface SessionPreview {
  order: number
  date: string
  weekdayLabel: string
  lessonTitle: string
  time: string
}

export interface RoomConflict {
  room: string
  className: string
  weekdayLabel: string
  time: string
}

export interface CreateClassResult {
  classId: string
  sessionCount: number
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toWeekdayLabel(date: Date): string {
  const index = date.getUTCDay()
  return (
    Object.entries(WEEKDAY_TO_INDEX).find(([, value]) => value === index)?.[0] ?? ""
  )
}

/**
 * Sinh trước danh sách buổi học từ lịch cố định — dùng cho card "Xem trước" ở
 * PROMPT 8B và cho chính lúc tạo lớp, để xem trước và kết quả luôn khớp nhau.
 */
export function previewSessions(
  input: Pick<ClassFormInput, "programId" | "weekdays" | "startDate" | "startTime" | "endTime">
): SessionPreview[] {
  const program = findProgram(input.programId)
  if (!program || input.weekdays.length === 0 || !input.startDate) return []

  const wantedDays = input.weekdays
    .map((day) => WEEKDAY_TO_INDEX[day])
    .filter((day) => day !== undefined)

  if (wantedDays.length === 0) return []

  const sessions: SessionPreview[] = []
  const cursor = new Date(input.startDate)
  let order = 0

  // Chặn trên để vòng lặp luôn kết thúc.
  for (let guard = 0; guard < 500 && order < program.totalLessons; guard += 1) {
    if (wantedDays.includes(cursor.getUTCDay())) {
      order += 1
      sessions.push({
        order,
        date: toIsoDate(cursor),
        weekdayLabel: toWeekdayLabel(cursor),
        lessonTitle: resolveLessonTitle(`${program.id}-${order}`),
        time: `${input.startTime}–${input.endTime}`,
      })
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return sessions
}

/**
 * Tìm lớp đã chiếm phòng ở cùng khung giờ và có ngày học trùng.
 * Backend thật sẽ kiểm tra lại — đây chỉ là cảnh báo sớm cho quản lý.
 */
export function findRoomConflict(
  input: Pick<ClassFormInput, "room" | "weekdays" | "startTime" | "endTime">,
  excludeClassId?: string
): RoomConflict | null {
  if (!input.room || input.weekdays.length === 0 || !input.startTime) return null

  const conflicting = MOCK_CLASSES.find((item) => {
    if (item.id === excludeClassId) return false
    if (item.room !== input.room) return false
    if (item.status !== "open") return false

    const sharesDay = item.weekdays.some((day) => input.weekdays.includes(day))
    if (!sharesDay) return false

    // Trùng khi hai khoảng thời gian giao nhau.
    return input.startTime < item.endTime && item.startTime < input.endTime
  })

  if (!conflicting) return null

  const sharedDay = conflicting.weekdays.find((day) => input.weekdays.includes(day))

  return {
    room: conflicting.room,
    className: conflicting.name,
    weekdayLabel: sharedDay ?? conflicting.weekdays[0],
    time: `${conflicting.startTime}–${conflicting.endTime}`,
  }
}

/** Phòng trống cùng khung giờ, dùng cho phần "Gợi ý phòng trống". */
export function findAvailableRooms(
  input: Pick<ClassFormInput, "weekdays" | "startTime" | "endTime">
): Array<{ room: string; capacity: number }> {
  const rooms = Array.from(
    new Map(MOCK_CLASSES.map((item) => [item.room, item.capacity])).entries()
  )

  return rooms
    .filter(
      ([room]) => findRoomConflict({ ...input, room }) === null
    )
    .map(([room, capacity]) => ({ room, capacity }))
}

let sequence = 0

export function mockCreateClass(input: ClassFormInput): CreateClassResult {
  const program = findProgram(input.programId)
  if (!program) throw new MockError(ERROR_MSG.NOT_FOUND)

  sequence += 1
  const classId = `cls-new-${sequence}`

  const classRecord: ClassRecord = {
    id: classId,
    name: input.name.trim(),
    subjectId: input.subjectId,
    programId: input.programId,
    grade: Number(input.grade),
    teacherId: input.teacherId,
    room: input.room,
    weekdays: input.weekdays,
    startTime: input.startTime,
    endTime: input.endTime,
    capacity: input.capacity,
    status: "open",
  }

  MOCK_CLASSES.push(classRecord)

  const sessions: ClassSession[] = previewSessions(input).map((preview) => ({
    id: `ses-${classId}-${preview.order}`,
    classId,
    lessonId: `${program.id}-${preview.order}`,
    programId: program.id,
    date: preview.date,
    capacity: input.capacity,
    startTime: input.startTime,
    endTime: input.endTime,
    teacherId: input.teacherId,
  }))

  MOCK_CLASS_SESSIONS.push(...sessions)

  return { classId, sessionCount: sessions.length }
}
