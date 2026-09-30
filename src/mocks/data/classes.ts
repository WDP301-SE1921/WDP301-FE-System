import {
  MOCK_CLASSES,
  MOCK_CLASS_SESSIONS,
  findProgram,
  resolveLessonTitle,
} from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { ERROR_MSG } from "@/constants/messages/error"
import {
  buildSlotIdentity,
  generateSessionSlots,
} from "@/mocks/data/session-schedule"
import type { ClassFormInput } from "@/lib/validators/class"
import type { ClassRecord, ClassSession, SessionKind } from "@/types/catalog"

/**
 * Tạo lớp + sinh buổi học giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint lớp học thật.
 */

export interface SessionPreview {
  /** Số thứ tự buổi trong lịch (1..N), tính cả buổi kiểm tra tháng. */
  order: number
  kind: SessionKind
  /** Id buổi học sẽ được tạo — khớp với `mockCreateClass`. */
  sessionId: string
  lessonId: string
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

/**
 * Sinh trước danh sách buổi học từ lịch cố định — dùng cho card "Xem trước" ở
 * PROMPT 8B và cho chính lúc tạo lớp, để xem trước và kết quả luôn khớp nhau. Bộ sinh
 * (`generateSessionSlots`) tự chèn buổi kiểm tra vào buổi cuối mỗi tháng.
 *
 * Cần `classId` khi muốn biết id buổi học thật; xem trước chưa có lớp nên dùng id tạm.
 */
export function previewSessions(
  input: Pick<ClassFormInput, "programId" | "weekdays" | "startDate" | "startTime" | "endTime">,
  classId = "preview"
): SessionPreview[] {
  const program = findProgram(input.programId)
  if (!program) return []

  return generateSessionSlots({
    weekdays: input.weekdays,
    startDate: input.startDate,
    totalLessons: program.totalLessons,
  }).map((slot, index) => {
    const { sessionId, lessonId } = buildSlotIdentity(program.id, classId, slot)

    return {
      order: index + 1,
      kind: slot.kind,
      sessionId,
      lessonId,
      date: slot.date,
      weekdayLabel: slot.weekdayLabel,
      lessonTitle: resolveLessonTitle(lessonId),
      time: `${input.startTime}–${input.endTime}`,
    }
  })
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
    teacherId: input.teacherId || undefined,
    room: input.room,
    weekdays: input.weekdays,
    startTime: input.startTime,
    endTime: input.endTime,
    capacity: input.capacity,
    status: "open",
  }

  MOCK_CLASSES.push(classRecord)

  const sessions: ClassSession[] = previewSessions(input, classId).map((preview) => ({
    id: preview.sessionId,
    classId,
    lessonId: preview.lessonId,
    kind: preview.kind,
    programId: program.id,
    date: preview.date,
    capacity: input.capacity,
    startTime: input.startTime,
    endTime: input.endTime,
    teacherId: input.teacherId || undefined,
  }))

  MOCK_CLASS_SESSIONS.push(...sessions)

  return { classId, sessionCount: sessions.length }
}
