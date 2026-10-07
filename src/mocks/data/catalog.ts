import { SUBJECT_MAP } from "@/constants/subjects"
import { STATUS_MAP } from "@/constants/status"
import { ERROR_MSG } from "@/constants/messages/error"
import {
  buildSlotIdentity,
  generateSessionSlots,
  getTestMonth,
} from "@/mocks/data/session-schedule"
import { MockError } from "@/mocks/utils/mock-query"
import { todayInVietnam, yesterdayInVietnam } from "@/lib/calendar-date"
import type {
  ClassRecord,
  ClassSession,
  Lesson,
  Program,
  Room,
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
  {
    id: "prg-math-8",
    subjectId: "subj-math",
    grade: 8,
    name: "Toán 8 cơ bản",
    totalLessons: 36,
    monthlyFee: 500000,
    textbook: "Toán 8 — Cánh Diều",
    description: "Chương trình Đại số & Hình học 8 bám sát SGK, luyện tập theo từng chuyên đề.",
    isActive: true,
  },
  {
    id: "prg-math-9",
    subjectId: "subj-math",
    grade: 9,
    name: "Toán 9 nâng cao",
    totalLessons: 40,
    monthlyFee: 500000,
    description: "Chương trình nâng cao dành cho học sinh khá giỏi, bổ sung dạng bài thi chuyên.",
    isActive: false,
  },
  {
    id: "prg-math-10",
    subjectId: "subj-math",
    grade: 9,
    name: "Toán 9 ôn thi",
    totalLessons: 32,
    monthlyFee: 500000,
    description: "Ôn tập trọng tâm chuẩn bị kỳ thi tuyển sinh lớp 10.",
    isActive: true,
  },
  {
    id: "prg-math-7",
    subjectId: "subj-math",
    grade: 7,
    name: "Toán 7 cơ bản",
    totalLessons: 34,
    monthlyFee: 500000,
    description: "Chương trình Toán 7 bám sát SGK, củng cố nền tảng Đại số & Hình học.",
    isActive: true,
  },
  {
    id: "prg-math-6",
    subjectId: "subj-math",
    grade: 6,
    name: "Toán 6 cơ bản",
    totalLessons: 32,
    monthlyFee: 500000,
    description: "Chương trình làm quen THCS, củng cố kiến thức nền Toán 6.",
    isActive: true,
  },
  {
    id: "prg-chem-8",
    subjectId: "subj-chem",
    grade: 8,
    name: "Hóa 8 cơ bản",
    totalLessons: 30,
    monthlyFee: 500000,
    description: "Nhập môn Hóa học: nguyên tử, phân tử, phản ứng hóa học cơ bản.",
    isActive: true,
  },
  {
    id: "prg-chem-9",
    subjectId: "subj-chem",
    grade: 9,
    name: "Hóa 9 cơ bản",
    totalLessons: 34,
    monthlyFee: 500000,
    description: "Hệ thống hóa kiến thức Hóa 9, trọng tâm Axit - Bazơ - Muối.",
    isActive: true,
  },
  {
    id: "prg-phys-7",
    subjectId: "subj-phys",
    grade: 7,
    name: "Lý 7 cơ bản",
    totalLessons: 28,
    monthlyFee: 500000,
    description: "Chương trình Vật lý 7: quang học, âm học và điện học nhập môn.",
    isActive: true,
  },
  {
    id: "prg-phys-9",
    subjectId: "subj-phys",
    grade: 9,
    name: "Lý 9 chuyên đề",
    totalLessons: 36,
    monthlyFee: 500000,
    description: "Chuyên đề điện từ học và quang học nâng cao cho học sinh khá giỏi.",
    isActive: true,
  },
  {
    id: "prg-phys-10",
    subjectId: "subj-phys",
    grade: 9,
    name: "Lý 9 ôn thi",
    totalLessons: 30,
    monthlyFee: 500000,
    description: "Ôn tập trọng tâm Vật lý 9 chuẩn bị kỳ thi tuyển sinh lớp 10.",
    isActive: true,
  },
  {
    id: "prg-biol-6",
    subjectId: "subj-biol",
    grade: 6,
    name: "Sinh 6 cơ bản",
    totalLessons: 26,
    monthlyFee: 500000,
    description: "Nhập môn Sinh học: tế bào, thực vật và cơ thể sống.",
    isActive: true,
  },
  {
    id: "prg-biol-9",
    subjectId: "subj-biol",
    grade: 9,
    name: "Sinh 9 cơ bản",
    totalLessons: 30,
    monthlyFee: 500000,
    description: "Hệ thống hóa kiến thức Di truyền học và Sinh thái học lớp 9.",
    isActive: true,
  },
]

export const MOCK_LESSONS: Lesson[] = [
  {
    id: "les-math8-01",
    programId: "prg-math-8",
    order: 1,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 1: Nhân đơn thức với đa thức",
    description: "Ôn tập quy tắc nhân đơn thức với đa thức và bài tập áp dụng.",
  },
  {
    id: "les-math8-02",
    programId: "prg-math-8",
    order: 2,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 2: Nhân đa thức với đa thức",
    description: "Áp dụng quy tắc phân phối để nhân hai đa thức nhiều hạng tử.",
  },
  {
    id: "les-math8-03",
    programId: "prg-math-8",
    order: 3,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 3: Những hằng đẳng thức đáng nhớ",
    description: "Giới thiệu 3 hằng đẳng thức cơ bản và bài tập áp dụng.",
  },
  {
    id: "les-math8-04",
    programId: "prg-math-8",
    order: 4,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 4: Hằng đẳng thức đáng nhớ (tiếp theo)",
    description: "Mở rộng các hằng đẳng thức bậc ba và bài tập tổng hợp.",
  },
  {
    id: "les-math8-05",
    programId: "prg-math-8",
    order: 5,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 5: Hằng đẳng thức",
    description: "Luyện tập tổng hợp các hằng đẳng thức đáng nhớ đã học.",
  },
  {
    id: "les-math8-06",
    programId: "prg-math-8",
    order: 6,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 6: Phân tích đa thức thành nhân tử (đặt nhân tử chung)",
    description: "Phương pháp đặt nhân tử chung và dùng hằng đẳng thức.",
  },
  {
    id: "les-math8-07",
    programId: "prg-math-8",
    order: 7,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 7: Phân tích đa thức thành nhân tử (nhóm hạng tử)",
    description: "Phương pháp nhóm hạng tử để phân tích đa thức.",
  },
  {
    id: "les-math8-08",
    programId: "prg-math-8",
    order: 8,
    chapter: "Chương 1: Phép nhân và phép chia các đa thức",
    title: "Bài 8: Luyện tập phân tích đa thức thành nhân tử",
    description: "Tổng hợp bài tập rèn kỹ năng phân tích đa thức.",
  },
  {
    id: "les-math8-12",
    programId: "prg-math-8",
    order: 12,
    title: "Bài 12: Phân tích đa thức",
    description: "Ôn tập nâng cao các phương pháp phân tích đa thức thành nhân tử.",
  },
  {
    id: "les-math8-13",
    programId: "prg-math-8",
    order: 13,
    title: "Bài 13: Phương trình bậc nhất",
    description: "Giải phương trình bậc nhất một ẩn và bài toán thực tế.",
  },
  {
    id: "les-chem9-03",
    programId: "prg-chem-9",
    order: 3,
    title: "Bài 3: Tính chất Axit",
    description: "Tính chất hóa học của Axit và phản ứng với kim loại, bazơ.",
  },
  {
    id: "les-chem9-08",
    programId: "prg-chem-9",
    order: 8,
    title: "Bài 8: Bazơ và muối",
    description: "Tính chất hóa học của Bazơ, Muối và mối quan hệ giữa các hợp chất.",
  },
  {
    id: "les-phys7-08",
    programId: "prg-phys-7",
    order: 8,
    title: "Bài 8: Khúc xạ Ánh sáng",
    description: "Hiện tượng khúc xạ ánh sáng và ứng dụng trong đời sống.",
  },
  {
    id: "les-phys9-11",
    programId: "prg-phys-9",
    order: 11,
    title: "Bài 11: Điện từ học",
    description: "Từ trường, lực điện từ và ứng dụng trong động cơ điện.",
  },
  {
    id: "les-biol6-07",
    programId: "prg-biol-6",
    order: 7,
    title: "Bài 7: Tế bào thực vật",
    description: "Cấu tạo tế bào thực vật và chức năng các thành phần chính.",
  },
]

/** "Giáo viên đang đăng nhập" cho toàn bộ giai đoạn mock — khớp `MOCK_TEACHERS[0]`, cùng tiền lệ `CURRENT_MANAGER_ID` (`mocks/data/system.ts`). */
export const CURRENT_TEACHER_ID = "tch-001"

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
 * Phòng học. `ClassRecord.room` vẫn là chuỗi tên phòng (không đổi model để tránh
 * ảnh hưởng các màn đã có) — "Số lớp đang dùng" derive bằng cách so khớp tên.
 */
export const MOCK_ROOMS: Room[] = [
  { id: "room-101", name: "P.101", capacity: 24, isActive: true },
  { id: "room-102", name: "P.102", capacity: 18, isActive: true },
  { id: "room-103", name: "P.103", capacity: 18, isActive: true },
  { id: "room-104", name: "P.104", capacity: 18, isActive: true },
  { id: "room-105", name: "P.105", capacity: 22, isActive: true },
  { id: "room-106", name: "P.106", capacity: 25, isActive: true },
  { id: "room-107", name: "P.107", capacity: 22, isActive: true },
  { id: "room-108", name: "P.108", capacity: 22, isActive: true },
  { id: "room-201", name: "P.201", capacity: 20, isActive: true },
  { id: "room-202", name: "P.202", capacity: 20, isActive: true },
  { id: "room-203", name: "P.203", capacity: 20, isActive: true },
  { id: "room-204", name: "P.204", capacity: 20, isActive: true },
  { id: "room-301", name: "P.301", capacity: 15, isActive: false },
]

/** Ngày hiện tại theo múi giờ Việt Nam để lịch mẫu không bị lỗi thời. */
export const MOCK_TODAY = todayInVietnam()

/** "Bây giờ" của bộ mock — dùng cho mọi dấu thời gian sinh ra lúc chạy để khớp `MOCK_TODAY`. */
export const MOCK_NOW = `${MOCK_TODAY}T09:00:00`

/** Lịch mẫu bắt đầu từ hôm qua; từng lớp vẫn học đúng lịch cố định. */
const TERM_START = yesterdayInVietnam()

/**
 * Sinh toàn bộ buổi học của một lớp từ lịch cố định (bộ sinh dùng chung với tạo lớp mới ở
 * `session-schedule.ts`): mỗi buổi một bài, buổi cuối mỗi tháng là kiểm tra tháng. Buổi đã
 * qua được đánh dấu là đã điểm danh.
 */
function buildSessionsForClass(classRecord: ClassRecord): ClassSession[] {
  const program = MOCK_PROGRAMS.find((item) => item.id === classRecord.programId)
  if (!program) return []

  return generateSessionSlots({
    weekdays: classRecord.weekdays,
    startDate: TERM_START,
    totalLessons: program.totalLessons,
  }).map((slot) => {
    const { sessionId, lessonId } = buildSlotIdentity(program.id, classRecord.id, slot)
    const isPast = slot.date < MOCK_TODAY
    const isEarlierToday = slot.date === MOCK_TODAY && classRecord.startTime < "17:00"

    return {
      id: sessionId,
      classId: classRecord.id,
      lessonId,
      kind: slot.kind,
      programId: program.id,
      date: slot.date,
      capacity: classRecord.capacity,
      startTime: classRecord.startTime,
      endTime: classRecord.endTime,
      teacherId: classRecord.teacherId,
      attendanceMarkedAt:
        classRecord.teacherId && (isPast || isEarlierToday)
          ? `${slot.date}T${classRecord.endTime}:00`
          : undefined,
      attendanceMarkedBy:
        classRecord.teacherId && (isPast || isEarlierToday) ? classRecord.teacherId : undefined,
    }
  })
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

/** Số thứ tự bài học suy từ `lessonId` sinh theo chương trình; buổi kiểm tra tháng không có số bài (0). */
export function resolveLessonOrder(lessonId: string): number {
  if (getTestMonth(lessonId)) return 0
  return Number(lessonId.split("-").at(-1) ?? 0)
}

/** Nhãn ngắn của buổi trong lịch: "Buổi 12" hoặc "Kiểm tra tháng". */
export function resolveSessionLabel(session: Pick<ClassSession, "kind" | "lessonId">): string {
  return session.kind === "monthly_test"
    ? STATUS_MAP.sessionKind.monthly_test.label
    : `Buổi ${resolveLessonOrder(session.lessonId)}`
}

/** Tên bài học hiển thị; ưu tiên bài đã đặt tên trong `MOCK_LESSONS`. */
export function resolveLessonTitle(lessonId: string): string {
  const testMonth = getTestMonth(lessonId)
  if (testMonth) {
    const [year, month] = testMonth.split("-")
    return `${STATUS_MAP.sessionKind.monthly_test.label} ${month}/${year}`
  }

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

export function findRoom(roomId: string): Room | undefined {
  return MOCK_ROOMS.find((item) => item.id === roomId)
}

/**
 * Mutation giả lập cho Danh mục đào tạo (PROMPT 12, 12B, 12C).
 * Xóa cùng các hàm find/mock khác trong file này khi nối endpoint danh mục thật.
 */

export interface ProgramInput {
  name: string
  subjectId: string
  /** Khối lớp, dạng chuỗi vì Select trả `string` — chuyển sang Number khi lưu. */
  grade: string
  monthlyFee: number
  /** Tổng số bài học của chương trình — quyết định số buổi học sinh ra khi tạo lớp. */
  totalLessons: number
  textbook: string
  description: string
  isActive: boolean
}

let programSequence = MOCK_PROGRAMS.length

export function mockCreateProgram(input: ProgramInput): Program {
  if (!findSubject(input.subjectId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  programSequence += 1

  const program: Program = {
    id: `prg-new-${programSequence}`,
    subjectId: input.subjectId,
    grade: Number(input.grade),
    name: input.name.trim(),
    // Danh sách bài học cụ thể thêm dần ở trang chi tiết; `totalLessons` là số bài cần đủ.
    totalLessons: input.totalLessons,
    monthlyFee: input.monthlyFee,
    textbook: input.textbook.trim() || undefined,
    description: input.description.trim(),
    isActive: input.isActive,
  }

  MOCK_PROGRAMS.unshift(program)

  return program
}

export function mockUpdateProgram(programId: string, input: ProgramInput): Program {
  const program = MOCK_PROGRAMS.find((item) => item.id === programId)
  if (!program) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findSubject(input.subjectId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  program.name = input.name.trim()
  program.subjectId = input.subjectId
  program.grade = Number(input.grade)
  program.monthlyFee = input.monthlyFee
  program.totalLessons = input.totalLessons
  program.textbook = input.textbook.trim() || undefined
  program.description = input.description.trim()
  program.isActive = input.isActive

  return program
}

export interface LessonInput {
  programId: string
  title: string
  chapter: string
  description: string
}

let lessonSequence = MOCK_LESSONS.length

export function mockAddLesson(input: LessonInput): Lesson {
  if (!findProgram(input.programId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  lessonSequence += 1
  const currentMaxOrder = Math.max(
    0,
    ...MOCK_LESSONS.filter((item) => item.programId === input.programId).map((item) => item.order)
  )

  const lesson: Lesson = {
    id: `les-new-${lessonSequence}`,
    programId: input.programId,
    order: currentMaxOrder + 1,
    title: input.title.trim(),
    chapter: input.chapter.trim() || undefined,
    description: input.description.trim(),
  }

  MOCK_LESSONS.push(lesson)

  return lesson
}

export function mockUpdateLesson(
  lessonId: string,
  input: Pick<LessonInput, "title" | "chapter" | "description">
): Lesson {
  const lesson = MOCK_LESSONS.find((item) => item.id === lessonId)
  if (!lesson) throw new MockError(ERROR_MSG.NOT_FOUND)

  lesson.title = input.title.trim()
  lesson.chapter = input.chapter.trim() || undefined
  lesson.description = input.description.trim()

  return lesson
}

export function mockDeleteLesson(lessonId: string): { id: string } {
  const index = MOCK_LESSONS.findIndex((item) => item.id === lessonId)
  if (index === -1) throw new MockError(ERROR_MSG.NOT_FOUND)

  MOCK_LESSONS.splice(index, 1)

  return { id: lessonId }
}

/**
 * Sắp xếp lại thứ tự bài học của một chương trình theo mảng id đã kéo-thả.
 * Ghi lại field `order` 1..N theo đúng vị trí mới — quyết định bài gắn vào buổi
 * học khi tạo lớp.
 */
export function mockReorderLessons(programId: string, orderedLessonIds: string[]): Lesson[] {
  orderedLessonIds.forEach((lessonId, index) => {
    const lesson = MOCK_LESSONS.find(
      (item) => item.id === lessonId && item.programId === programId
    )
    if (lesson) lesson.order = index + 1
  })

  return MOCK_LESSONS.filter((item) => item.programId === programId).sort(
    (a, b) => a.order - b.order
  )
}

export interface RoomInput {
  name: string
  capacity: number
  isActive: boolean
}

export function mockUpdateRoom(roomId: string, input: RoomInput): Room {
  const room = MOCK_ROOMS.find((item) => item.id === roomId)
  if (!room) throw new MockError(ERROR_MSG.NOT_FOUND)

  room.name = input.name.trim()
  room.capacity = input.capacity
  room.isActive = input.isActive

  return room
}

/**
 * Mutation giả lập cho Tài khoản cá nhân của giáo viên (PROMPT T8) — mirror
 * `mockUpdateManagerProfile` (`mocks/data/system.ts`). "Môn dạy" (`subjectIds`)
 * không sửa được ở đây — do Quản lý phân công, xem `TEACHER_PROFILE_MSG`.
 */
export interface UpdateTeacherInput {
  id: string
  name: string
  phone: string
  specialty: string
  subjectIds: string[]
}

/** Quản lý trung tâm / admin sửa hồ sơ giáo viên (khác `mockUpdateTeacherProfile` — GV tự sửa, không đổi được môn dạy). */
export function mockUpdateTeacher(input: UpdateTeacherInput): Teacher {
  const teacher = findTeacher(input.id)
  if (!teacher) throw new MockError(ERROR_MSG.NOT_FOUND)

  teacher.name = input.name.trim()
  teacher.phone = input.phone.trim()
  teacher.specialty = input.specialty.trim() || undefined
  teacher.subjectIds = input.subjectIds

  return teacher
}

export interface UpdateTeacherProfileInput {
  id: string
  name: string
  phone: string
}

export function mockUpdateTeacherProfile(input: UpdateTeacherProfileInput): Teacher {
  const teacher = findTeacher(input.id)
  if (!teacher) throw new MockError(ERROR_MSG.NOT_FOUND)

  teacher.name = input.name.trim()
  teacher.phone = input.phone.trim()

  return teacher
}
