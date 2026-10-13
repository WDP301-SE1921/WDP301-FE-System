import { BUSINESS_RULES } from "@/constants/business-rules"
import type { SessionKind } from "@/types/catalog"

/**
 * Sinh khung buổi học của một lớp từ lịch cố định — dùng CHUNG cho dữ liệu mock có sẵn
 * (`catalog.ts`) và cho tạo lớp mới + card "Xem trước" (`classes.ts`) để hai bên luôn khớp.
 *
 * Quy tắc "mỗi buổi 1 bài, mỗi tháng 1 bài kiểm tra": đi từ ngày khai giảng, mỗi lần gặp
 * một thứ trong lịch cố định thì có một buổi. Buổi CUỐI của mỗi tháng lịch là buổi kiểm
 * tra; các bài học dồn sang những buổi còn lại nên tổng số bài giữ nguyên `totalLessons`
 * và lịch kéo dài thêm tương ứng. Hai ngoại lệ: không kiểm tra khi lớp chưa dạy đủ
 * `BUSINESS_RULES.MONTHLY_TEST_MIN_LESSONS` bài kể từ lần trước, và không đặt kiểm tra
 * thay cho buổi của bài cuối cùng (chương trình kết thúc ở đó).
 */

/** Nhãn thứ trong `ClassRecord.weekdays` → số thứ tự theo `Date.getUTCDay()`. */
export const WEEKDAY_TO_INDEX: Record<string, number> = {
  CN: 0,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
}

export interface SessionSlot {
  /** Ngày `YYYY-MM-DD`. */
  date: string
  /** Nhãn thứ, vd "T2". */
  weekdayLabel: string
  kind: SessionKind
  /** Số thứ tự bài học — chỉ có ở buổi `lesson`. */
  lessonOrder?: number
  /** Tháng `YYYY-MM` — chỉ có ở buổi `monthly_test`. */
  testMonth?: string
}

export interface SessionSlotInput {
  weekdays: string[]
  /** Ngày khai giảng `YYYY-MM-DD`. */
  startDate: string
  totalLessons: number
}

/** Chặn trên để vòng lặp luôn kết thúc kể cả khi lịch cố định rỗng. */
const MAX_DAYS = 1000

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toWeekdayLabel(index: number): string {
  return Object.entries(WEEKDAY_TO_INDEX).find(([, value]) => value === index)?.[0] ?? ""
}

/** Buổi kế tiếp trong lịch (cùng tuần hoặc tuần sau) có rơi sang tháng khác không. */
function isLastSlotOfMonth(cursor: Date, wantedDays: number[]): boolean {
  const next = new Date(cursor)
  for (let step = 0; step < 7; step += 1) {
    next.setUTCDate(next.getUTCDate() + 1)
    if (wantedDays.includes(next.getUTCDay())) {
      return next.getUTCMonth() !== cursor.getUTCMonth()
    }
  }
  return true
}

export function generateSessionSlots(input: SessionSlotInput): SessionSlot[] {
  const wantedDays = input.weekdays
    .map((day) => WEEKDAY_TO_INDEX[day])
    .filter((day): day is number => day !== undefined)

  if (wantedDays.length === 0 || !input.startDate || input.totalLessons <= 0) return []

  const slots: SessionSlot[] = []
  const cursor = new Date(input.startDate)
  let lessonOrder = 0
  let lessonsSinceTest = 0

  for (let guard = 0; guard < MAX_DAYS && lessonOrder < input.totalLessons; guard += 1) {
    const dayIndex = cursor.getUTCDay()

    if (wantedDays.includes(dayIndex)) {
      const date = toIsoDate(cursor)
      const isFinalLessonSlot = lessonOrder === input.totalLessons - 1
      const isTestSlot =
        !isFinalLessonSlot &&
        lessonsSinceTest >= BUSINESS_RULES.MONTHLY_TEST_MIN_LESSONS &&
        isLastSlotOfMonth(cursor, wantedDays)

      if (isTestSlot) {
        slots.push({
          date,
          weekdayLabel: toWeekdayLabel(dayIndex),
          kind: "monthly_test",
          testMonth: date.slice(0, 7),
        })
        lessonsSinceTest = 0
      } else {
        lessonOrder += 1
        lessonsSinceTest += 1
        slots.push({ date, weekdayLabel: toWeekdayLabel(dayIndex), kind: "lesson", lessonOrder })
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return slots
}

/** `lessonId` của buổi học thường: `<programId>-<order>`. */
export function buildLessonId(programId: string, order: number): string {
  return `${programId}-${order}`
}

/** `lessonId` của buổi kiểm tra tháng: `<programId>-test-<YYYY-MM>`. */
export function buildTestLessonId(programId: string, month: string): string {
  return `${programId}-test-${month}`
}

const TEST_LESSON_ID = /-test-(\d{4}-\d{2})$/

export function isTestLessonId(lessonId: string): boolean {
  return TEST_LESSON_ID.test(lessonId)
}

/** Tháng `YYYY-MM` của buổi kiểm tra suy từ `lessonId`; `undefined` nếu là buổi học thường. */
export function getTestMonth(lessonId: string): string | undefined {
  return TEST_LESSON_ID.exec(lessonId)?.[1]
}

/** `lessonId` + `id` buổi học của một khe: buổi học giữ id theo số bài, buổi kiểm tra theo tháng. */
export function buildSlotIdentity(programId: string, classId: string, slot: SessionSlot) {
  if (slot.kind === "monthly_test" && slot.testMonth) {
    return {
      sessionId: `ses-${classId}-test-${slot.testMonth}`,
      lessonId: buildTestLessonId(programId, slot.testMonth),
    }
  }

  const order = slot.lessonOrder ?? 0
  return {
    sessionId: `ses-${classId}-${order}`,
    lessonId: buildLessonId(programId, order),
  }
}
