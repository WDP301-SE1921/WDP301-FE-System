import { SUBJECT_MAP } from "@/constants/subjects"
import type {
  ClassRecord,
  ClassSession,
  Lesson,
  Program,
  Subject,
  Teacher,
} from "@/types/catalog"

/**
 * Danh mục đào tạo giả lập cho giai đoạn MOCK-ONLY.
 * Xóa file này trong cùng PR nối endpoint danh mục thật.
 */

export const MOCK_SUBJECTS: Subject[] = [
  { id: "subj-math", code: SUBJECT_MAP.MATH.code, name: SUBJECT_MAP.MATH.name },
  { id: "subj-phys", code: SUBJECT_MAP.PHYS.code, name: SUBJECT_MAP.PHYS.name },
  { id: "subj-chem", code: SUBJECT_MAP.CHEM.code, name: SUBJECT_MAP.CHEM.name },
  { id: "subj-biol", code: SUBJECT_MAP.BIOL.code, name: SUBJECT_MAP.BIOL.name },
]

export const MOCK_PROGRAMS: Program[] = [
  { id: "prg-math-8", subjectId: "subj-math", grade: 8, name: "Toán 8 cơ bản", totalLessons: 36, monthlyFee: 500000 },
  { id: "prg-math-9", subjectId: "subj-math", grade: 9, name: "Toán 9 nâng cao", totalLessons: 40, monthlyFee: 500000 },
  { id: "prg-math-10", subjectId: "subj-math", grade: 9, name: "Toán 9 ôn thi", totalLessons: 32, monthlyFee: 500000 },
  { id: "prg-math-7", subjectId: "subj-math", grade: 7, name: "Toán 7 cơ bản", totalLessons: 34, monthlyFee: 500000 },
  { id: "prg-math-6", subjectId: "subj-math", grade: 6, name: "Toán 6 cơ bản", totalLessons: 32, monthlyFee: 500000 },
  { id: "prg-chem-8", subjectId: "subj-chem", grade: 8, name: "Hóa 8 cơ bản", totalLessons: 30, monthlyFee: 500000 },
  { id: "prg-chem-9", subjectId: "subj-chem", grade: 9, name: "Hóa 9 cơ bản", totalLessons: 34, monthlyFee: 500000 },
  { id: "prg-phys-7", subjectId: "subj-phys", grade: 7, name: "Lý 7 cơ bản", totalLessons: 28, monthlyFee: 500000 },
  { id: "prg-phys-9", subjectId: "subj-phys", grade: 9, name: "Lý 9 chuyên đề", totalLessons: 36, monthlyFee: 500000 },
  { id: "prg-phys-10", subjectId: "subj-phys", grade: 9, name: "Lý 9 ôn thi", totalLessons: 30, monthlyFee: 500000 },
  { id: "prg-biol-6", subjectId: "subj-biol", grade: 6, name: "Sinh 6 cơ bản", totalLessons: 26, monthlyFee: 500000 },
  { id: "prg-biol-9", subjectId: "subj-biol", grade: 9, name: "Sinh 9 cơ bản", totalLessons: 30, monthlyFee: 500000 },
]

export const MOCK_LESSONS: Lesson[] = [
  { id: "les-math8-05", programId: "prg-math-8", order: 5, title: "Bài 5: Hằng đẳng thức" },
  { id: "les-math8-12", programId: "prg-math-8", order: 12, title: "Bài 12: Phân tích đa thức" },
  { id: "les-math8-13", programId: "prg-math-8", order: 13, title: "Bài 13: Phương trình bậc nhất" },
  { id: "les-chem9-03", programId: "prg-chem-9", order: 3, title: "Bài 3: Tính chất Axit" },
  { id: "les-chem9-08", programId: "prg-chem-9", order: 8, title: "Bài 8: Bazơ và muối" },
  { id: "les-phys7-08", programId: "prg-phys-7", order: 8, title: "Bài 8: Khúc xạ Ánh sáng" },
  { id: "les-phys9-11", programId: "prg-phys-9", order: 11, title: "Bài 11: Điện từ học" },
  { id: "les-biol6-07", programId: "prg-biol-6", order: 7, title: "Bài 7: Tế bào thực vật" },
]

export const MOCK_TEACHERS: Teacher[] = [
  { id: "tch-001", name: "Trần Văn Minh", email: "minh.tran@edugrade.vn", phone: "0912 334 881", code: "GV-MAT01", subjectIds: ["subj-math"], status: "active", yearsExperience: 8, rating: 4.9, joinedAt: "2018-08-01", isHeadTeacher: true, specialty: "Toán học (THCS & Luyện thi Chuyên)" },
  { id: "tch-002", name: "Lê Thu Hà", email: "ha.le@edugrade.vn", phone: "0983 112 233", code: "GV-CHM02", subjectIds: ["subj-chem"], status: "active", yearsExperience: 6, rating: 4.8, joinedAt: "2020-02-10", specialty: "Hóa học THCS" },
  { id: "tch-003", name: "Nguyễn Văn An", email: "an.nguyen@edugrade.vn", phone: "0977 889 900", code: "GV-PHY03", subjectIds: ["subj-phys"], status: "active", yearsExperience: 5, rating: 4.6, joinedAt: "2021-06-15", specialty: "Vật lý THCS" },
  { id: "tch-004", name: "Phạm Thị Cúc", email: "cuc.pham@edugrade.vn", phone: "0966 234 567", code: "GV-BIO04", subjectIds: ["subj-biol"], status: "active", yearsExperience: 7, rating: 4.7, joinedAt: "2019-09-01", isHeadTeacher: true, specialty: "Sinh học THCS" },
  { id: "tch-005", name: "Đỗ Quang Huy", email: "huy.do@edugrade.vn", phone: "0903 445 566", code: "GV-MAT05", subjectIds: ["subj-math", "subj-phys"], status: "active", yearsExperience: 9, rating: 4.9, joinedAt: "2017-08-20", specialty: "Toán – Lý luyện thi" },
  { id: "tch-006", name: "Hoàng Thị Phương", email: "phuong.hoang@edugrade.vn", phone: "0983 112 233", code: "GV-PHY06", subjectIds: ["subj-phys"], status: "active", yearsExperience: 4, rating: 4.5, joinedAt: "2022-01-05", specialty: "Vật lý cơ bản" },
  { id: "tch-007", name: "Lê Hoàng Long", email: "long.le@edugrade.vn", phone: "0977 889 901", code: "GV-MAT07", subjectIds: ["subj-math"], status: "active", yearsExperience: 10, rating: 4.9, joinedAt: "2016-03-12", specialty: "Toán 10 – 11" },
  { id: "tch-008", name: "Đỗ Tuấn Anh", email: "anh.do@edugrade.vn", phone: "0945 678 891", code: "GV-CHM08", subjectIds: ["subj-chem"], status: "active", yearsExperience: 3, rating: 4.4, joinedAt: "2023-02-01", specialty: "Hóa học cơ bản" },
  { id: "tch-009", name: "Nguyễn Thùy Trang", email: "trang.nguyen@edugrade.vn", phone: "0966 234 568", code: "GV-BIO09", subjectIds: ["subj-chem", "subj-biol"], status: "active", yearsExperience: 6, rating: 4.7, joinedAt: "2020-08-15", specialty: "Hóa – Sinh" },
  { id: "tch-010", name: "Vũ Thúy Chi", email: "chi.vu@edugrade.vn", phone: "0938 456 789", code: "GV-BIO10", subjectIds: ["subj-biol"], status: "active", yearsExperience: 4, rating: 4.6, joinedAt: "2022-05-20", specialty: "Sinh học cơ bản" },
  { id: "tch-011", name: "Đặng Văn Đức", email: "duc.dang@edugrade.vn", phone: "0903 111 444", code: "GV-MAT11", subjectIds: ["subj-math"], status: "active", yearsExperience: 5, rating: 4.7, joinedAt: "2021-09-01", specialty: "Toán 12" },
  { id: "tch-012", name: "Vũ Thế Hùng", email: "hung.vu@edugrade.vn", phone: "0912 777 888", code: "GV-PHY12", subjectIds: ["subj-phys"], status: "active", yearsExperience: 7, rating: 4.9, joinedAt: "2019-01-10", specialty: "Vật lý chuyên đề" },
  { id: "tch-013", name: "Lê Mai Trang", email: "trang.lm@edugrade.vn", phone: "0988 333 222", code: "GV-PHY13", subjectIds: ["subj-phys"], status: "active", yearsExperience: 3, rating: 4.5, joinedAt: "2023-08-01", specialty: "Vật lý cơ bản" },
  { id: "tch-014", name: "Phạm Thành Đạt", email: "dat.pham@edugrade.vn", phone: "0977 222 111", code: "GV-PHY14", subjectIds: ["subj-phys"], status: "active", yearsExperience: 8, rating: 4.8, joinedAt: "2018-11-20", specialty: "Vật lý luyện thi" },
  { id: "tch-015", name: "Cao Văn An", email: "an.cao@edugrade.vn", phone: "0945 000 111", code: "GV-CHM15", subjectIds: ["subj-chem"], status: "inactive", yearsExperience: 5, rating: 4.3, joinedAt: "2021-03-01", specialty: "Hóa học THCS" },
  { id: "tch-016", name: "Đỗ Nhật Nam", email: "nam.do@edugrade.vn", phone: "0938 999 000", code: "GV-MAT16", subjectIds: ["subj-math"], status: "inactive", yearsExperience: 2, rating: 4.2, joinedAt: "2024-01-15", specialty: "Toán hình học" },
]

export const MOCK_CLASSES: ClassRecord[] = [
  {
    id: "cls-math-8a",
    name: "Toán 8A",
    subjectId: "subj-math",
    programId: "prg-math-8",
    grade: 8,
    teacherId: "tch-001",
    room: "P.101",
    weekdays: ["T2", "T4", "T6"],
    startTime: "15:00",
    endTime: "16:30",
    capacity: 20,
    status: "open",
  },
  {
    id: "cls-math-8c",
    name: "Toán 8C",
    subjectId: "subj-math",
    programId: "prg-math-8",
    grade: 8,
    teacherId: "tch-005",
    room: "P.105",
    weekdays: ["T3", "T5"],
    startTime: "17:00",
    endTime: "18:30",
    capacity: 20,
    status: "open",
  },
  {
    id: "cls-chem-9b",
    name: "Hóa 9B",
    subjectId: "subj-chem",
    programId: "prg-chem-9",
    grade: 9,
    teacherId: "tch-002",
    room: "P.203",
    weekdays: ["T2", "T4", "T6"],
    startTime: "17:00",
    endTime: "18:30",
    capacity: 18,
    status: "open",
  },
  {
    id: "cls-chem-8b",
    name: "Hóa 8B",
    subjectId: "subj-chem",
    programId: "prg-chem-8",
    grade: 8,
    teacherId: "tch-002",
    room: "P.202",
    weekdays: ["T2", "T6"],
    startTime: "15:00",
    endTime: "16:30",
    capacity: 18,
    status: "open",
  },
  {
    id: "cls-phys-7a",
    name: "Lý 7A",
    subjectId: "subj-phys",
    programId: "prg-phys-7",
    grade: 7,
    room: "P.102",
    weekdays: ["T4", "T7"],
    startTime: "18:45",
    endTime: "20:15",
    capacity: 16,
    status: "open",
  },
  {
    id: "cls-phys-9c",
    name: "Lý 9 Chuyên",
    subjectId: "subj-phys",
    programId: "prg-phys-9",
    grade: 9,
    teacherId: "tch-003",
    room: "P.104",
    weekdays: ["T2", "T5"],
    startTime: "18:45",
    endTime: "20:15",
    capacity: 16,
    status: "open",
  },
  {
    id: "cls-math-11a",
    name: "Toán 9 Ôn thi",
    subjectId: "subj-math",
    programId: "prg-math-10",
    grade: 9,
    teacherId: "tch-005",
    room: "P.106",
    weekdays: ["T3", "T6"],
    startTime: "18:45",
    endTime: "20:15",
    capacity: 22,
    status: "open",
  },
  {
    id: "cls-math-10a",
    name: "Toán 6A",
    subjectId: "subj-math",
    programId: "prg-math-6",
    grade: 6,
    teacherId: "tch-001",
    room: "P.108",
    weekdays: ["T2", "T5"],
    startTime: "15:00",
    endTime: "16:30",
    capacity: 20,
    status: "open",
  },
  {
    id: "cls-math-7a",
    name: "Toán 7A",
    subjectId: "subj-math",
    programId: "prg-math-7",
    grade: 7,
    teacherId: "tch-001",
    room: "P.107",
    weekdays: ["T4", "T7"],
    startTime: "15:00",
    endTime: "16:30",
    capacity: 20,
    status: "open",
  },
  {
    id: "cls-biol-6a",
    name: "Sinh 6A",
    subjectId: "subj-biol",
    programId: "prg-biol-6",
    grade: 6,
    teacherId: "tch-004",
    room: "P.201",
    weekdays: ["T3", "T6"],
    startTime: "17:00",
    endTime: "18:30",
    capacity: 18,
    status: "open",
  },
  {
    id: "cls-biol-9a",
    name: "Sinh 9A",
    subjectId: "subj-biol",
    programId: "prg-biol-9",
    grade: 9,
    teacherId: "tch-004",
    room: "P.204",
    weekdays: ["T2", "T6"],
    startTime: "17:00",
    endTime: "18:30",
    capacity: 18,
    status: "open",
  },
  {
    id: "cls-phys-9a",
    name: "Lý 9A",
    subjectId: "subj-phys",
    programId: "prg-phys-10",
    grade: 9,
    teacherId: "tch-003",
    room: "P.103",
    weekdays: ["T3", "T5"],
    startTime: "15:00",
    endTime: "16:30",
    capacity: 16,
    status: "open",
  },
]

/**
 * Ngày "hôm nay" cố định của bộ mock (Thứ 4) — chọn ngày này để 3 lớp Toán 8A,
 * Hóa 9B và Lý 7A cùng có buổi, khớp nội dung Dashboard trong docs mà vẫn giữ
 * đúng lịch cố định "T2 - T4 - T6" của Toán 8A ở PROMPT 8C.
 */
export const MOCK_TODAY = "2026-09-16"

/** Ngày khai giảng chung của kỳ học trong bộ mock (Thứ 2). */
const TERM_START = "2026-08-03"

/** Nhãn thứ trong `ClassRecord.weekdays` → số thứ tự theo `Date.getDay()`. */
const WEEKDAY_TO_INDEX: Record<string, number> = {
  CN: 0,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Sinh toàn bộ buổi học của một lớp: đi từ ngày khai giảng, mỗi lần gặp thứ nằm
 * trong lịch cố định thì tạo một buổi, cho tới khi đủ số bài của chương trình.
 * Buổi đã qua được đánh dấu là đã điểm danh.
 */
function buildSessionsForClass(classRecord: ClassRecord): ClassSession[] {
  const program = MOCK_PROGRAMS.find((item) => item.id === classRecord.programId)
  if (!program) return []

  const wantedDays = classRecord.weekdays
    .map((day) => WEEKDAY_TO_INDEX[day])
    .filter((day) => day !== undefined)

  const sessions: ClassSession[] = []
  const cursor = new Date(TERM_START)
  let order = 0

  // Chặn trên để vòng lặp luôn kết thúc kể cả khi lịch cố định rỗng.
  for (let guard = 0; guard < 400 && order < program.totalLessons; guard += 1) {
    if (wantedDays.includes(cursor.getUTCDay())) {
      order += 1
      const date = toIsoDate(cursor)
      const isPast = date < MOCK_TODAY
      const isEarlierToday = date === MOCK_TODAY && classRecord.startTime < "17:00"

      sessions.push({
        id: `ses-${classRecord.id}-${order}`,
        classId: classRecord.id,
        lessonId: `${program.id}-${order}`,
        programId: program.id,
        date,
        capacity: classRecord.capacity,
        startTime: classRecord.startTime,
        endTime: classRecord.endTime,
        teacherId: classRecord.teacherId,
        attendanceMarkedAt:
          classRecord.teacherId && (isPast || isEarlierToday)
            ? `${date}T${classRecord.endTime}:00`
            : undefined,
      })
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return sessions
}

/** Buổi học của mọi lớp — nguồn dữ liệu cho Chi tiết lớp và Lịch học tổng. */
export const MOCK_CLASS_SESSIONS: ClassSession[] = MOCK_CLASSES.flatMap(
  buildSessionsForClass
)

/** Buổi học diễn ra trong ngày "hôm nay" của bộ mock. */
export const MOCK_SESSIONS_TODAY: ClassSession[] = MOCK_CLASS_SESSIONS.filter(
  (session) => session.date === MOCK_TODAY
).sort((a, b) => a.startTime.localeCompare(b.startTime))

export function findSessionsByClass(classId: string): ClassSession[] {
  return MOCK_CLASS_SESSIONS.filter((session) => session.classId === classId)
}

export function findClassSession(sessionId: string): ClassSession | undefined {
  return MOCK_CLASS_SESSIONS.find((session) => session.id === sessionId)
}

/** Số thứ tự bài học suy từ `lessonId` sinh theo chương trình. */
export function resolveLessonOrder(lessonId: string): number {
  return Number(lessonId.split("-").at(-1) ?? 0)
}

/** Tên bài học hiển thị; ưu tiên bài đã đặt tên trong `MOCK_LESSONS`. */
export function resolveLessonTitle(lessonId: string): string {
  const order = resolveLessonOrder(lessonId)
  const named = MOCK_LESSONS.find(
    (lesson) => lesson.programId === lessonId.replace(`-${order}`, "") && lesson.order === order
  )
  return named?.title ?? `Bài ${order}`
}

export function findSubject(subjectId: string): Subject | undefined {
  return MOCK_SUBJECTS.find((item) => item.id === subjectId)
}

export function findClass(classId: string): ClassRecord | undefined {
  return MOCK_CLASSES.find((item) => item.id === classId)
}

export function findProgram(programId: string): Program | undefined {
  return MOCK_PROGRAMS.find((item) => item.id === programId)
}

export function findLesson(lessonId: string): Lesson | undefined {
  return MOCK_LESSONS.find((item) => item.id === lessonId)
}

export function findTeacher(teacherId?: string): Teacher | undefined {
  if (!teacherId) return undefined
  return MOCK_TEACHERS.find((item) => item.id === teacherId)
}
