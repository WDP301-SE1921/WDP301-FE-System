/**
 * Danh mục đào tạo: môn học, chương trình, bài học, giáo viên, lớp, buổi học.
 * Tên field bám theo `.claude/rules/data-contracts.md`.
 */

export type ClassStatus = "open" | "ended"
export type TeacherStatus = "active" | "on_leave" | "inactive"

export interface Subject {
  id: string
  /** Mã môn dùng để tra `SUBJECT_MAP` trong `src/constants/subjects.ts`. */
  code: string
  name: string
}

export interface Program {
  id: string
  subjectId: string
  grade: number
  name: string
  totalLessons: number
  /** Học phí một tháng, đơn vị VND. */
  monthlyFee: number
  /** Mô tả ngắn về chương trình, hiển thị ở modal Thêm/Sửa chương trình. */
  description?: string
  /** Chương trình còn được dùng để tạo lớp mới hay không (Switch "Đang sử dụng"). */
  isActive: boolean
}

export interface Lesson {
  id: string
  programId: string
  order: number
  title: string
  /** Mô tả ngắn nội dung bài học, hiển thị trong "Danh sách bài học". */
  description?: string
}

export interface Room {
  id: string
  name: string
  /** Sức chứa tối đa, đơn vị học sinh. */
  capacity: number
  isActive: boolean
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  /** Mã giáo viên hiển thị, vd "GV-MAT01". */
  code: string
  subjectIds: string[]
  status: TeacherStatus
  /** Số năm kinh nghiệm giảng dạy. */
  yearsExperience: number
  /** Điểm đánh giá trung bình từ phụ huynh, thang 5. */
  rating: number
  joinedAt: string
  /** Tổ trưởng bộ môn. */
  isHeadTeacher?: boolean
  /** Mô tả ngắn chuyên môn, hiển thị dưới tên ở màn chi tiết. */
  specialty?: string
}

export interface ClassRecord {
  id: string
  name: string
  subjectId: string
  programId: string
  grade: number
  teacherId?: string
  room: string
  /** ISO day numbers (2 = Thứ 2 … 8 = Chủ nhật theo cách gọi của `ScheduleText`). */
  weekdays: string[]
  startTime: string
  endTime: string
  capacity: number
  status: ClassStatus
}

/** Contract: id, classId, lessonId, programId, date, capacity. */
export interface ClassSession {
  id: string
  classId: string
  lessonId: string
  programId: string
  date: string
  capacity: number
  startTime: string
  endTime: string
  /** Bỏ trống khi buổi chưa xếp được giáo viên. */
  teacherId?: string
  /** Bỏ trống khi giáo viên chưa điểm danh buổi này. */
  attendanceMarkedAt?: string
}
