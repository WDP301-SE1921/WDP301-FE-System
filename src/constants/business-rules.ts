/**
 * Giới hạn nghiệp vụ dùng để validate và hiển thị ở FE. Backend vẫn là nơi kiểm tra
 * chính — các số ở đây phải khớp với hợp đồng dữ liệu trong
 * `.claude/rules/data-contracts.md`.
 */
export const BUSINESS_RULES = {
  /** Số tháng một Enrollment được đăng ký. */
  ENROLLMENT_MONTHS_MIN: 1,
  ENROLLMENT_MONTHS_MAX: 12,
  /** Hạn dùng của link kích hoạt tài khoản gửi qua email. */
  ACTIVATION_LINK_EXPIRY_DAYS: 7,
  /** Hạn dùng của link đặt lại mật khẩu gửi qua email. */
  PASSWORD_RESET_EXPIRY_MINUTES: 30,
  /** Ngưỡng cảnh báo gói học phí sắp hết hạn (ngày). */
  PACKAGE_EXPIRY_WARNING_DAYS: 7,
  /** Mục tiêu tỷ lệ đi học của trung tâm (%). */
  ATTENDANCE_RATE_TARGET: 95,
  /** Sĩ số tối đa một lớp. */
  CLASS_CAPACITY_MAX: 20,
  /**
   * Mỗi tháng lịch có 1 buổi kiểm tra ở buổi cuối của tháng. Tháng nào lớp học chưa đủ
   * số buổi này kể từ lần kiểm tra trước (hoặc từ ngày khai giảng) thì bỏ qua kiểm tra.
   */
  MONTHLY_TEST_MIN_LESSONS: 4,
  /** Giáo viên báo nghỉ trong vòng N giờ trước giờ học được coi là nghỉ đột xuất. */
  TEACHER_ABSENCE_URGENT_HOURS: 24,
  /** Số bài học tối đa của một chương trình. */
  PROGRAM_LESSONS_MAX: 200,
  /** Ngưỡng độ tin cậy AI (%) để đủ điều kiện duyệt nhanh hàng loạt (PROMPT T6). */
  AI_HIGH_CONFIDENCE_THRESHOLD: 95,
  /** Bài tập được tính "sắp hết hạn nộp" nếu hạn nộp trong vòng N giờ tới (Dashboard giáo viên). */
  ASSIGNMENT_DUE_SOON_HOURS: 72,
} as const

export const WEEKDAYS = [
  { value: 1, label: "Thứ 2", shortLabel: "T2" },
  { value: 2, label: "Thứ 3", shortLabel: "T3" },
  { value: 3, label: "Thứ 4", shortLabel: "T4" },
  { value: 4, label: "Thứ 5", shortLabel: "T5" },
  { value: 5, label: "Thứ 6", shortLabel: "T6" },
  { value: 6, label: "Thứ 7", shortLabel: "T7" },
  { value: 0, label: "Chủ nhật", shortLabel: "CN" },
] as const
