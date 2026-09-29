import { BUSINESS_RULES } from "@/constants/business-rules"
import { FIELD_LIMITS } from "@/constants/validation"

export const VALIDATION_MSG = {
  REQUIRED: "Trường này là bắt buộc",
  INVALID_EMAIL: "Email không hợp lệ",
  INVALID_PHONE: "Số điện thoại không hợp lệ",
  MIN_LENGTH: (min: number) => `Tối thiểu ${min} ký tự`,
  MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự`,
  PASSWORD_WEAK: `Mật khẩu tối thiểu ${FIELD_LIMITS.PASSWORD_MIN} ký tự, gồm chữ hoa, chữ thường và số`,
  PASSWORD_NOT_MATCH: "Mật khẩu xác nhận không khớp",
  TERMS_REQUIRED: "Bạn cần đồng ý với điều khoản trước khi tiếp tục",
  MONTHS_RANGE: `Số tháng từ ${BUSINESS_RULES.ENROLLMENT_MONTHS_MIN} đến ${BUSINESS_RULES.ENROLLMENT_MONTHS_MAX}`,
  PAYMENT_CONFIRM_REQUIRED: "Cần xác nhận đã nhận đủ học phí trước khi tiếp tục",
  CAPACITY_RANGE: `Sĩ số tối đa ${BUSINESS_RULES.CLASS_CAPACITY_MAX} học sinh/lớp`,
  WEEKDAYS_REQUIRED: "Chọn ít nhất một ngày học trong tuần",
  END_TIME_AFTER_START: "Giờ kết thúc phải sau giờ bắt đầu",
  END_DATE_AFTER_START: "Ngày kết thúc phải sau ngày bắt đầu",
  SUBJECTS_REQUIRED: "Chọn ít nhất một môn dạy",
  SUBSTITUTE_TEACHER_REQUIRED: "Chọn giáo viên dạy thay",
  SESSION_REQUIRED: "Chọn một buổi học",
  ENROLLMENTS_REQUIRED: "Chọn ít nhất một môn cần kết thúc",
  CONFIRM_NAME_REQUIRED: "Gõ đúng tên học sinh để xác nhận",
  PROGRAM_NAME_REQUIRED: "Vui lòng nhập tên chương trình",

  // Bài tập / Đề kiểm tra (PROMPT T5B)
  DUE_DATE_AFTER_OPEN: "Hạn nộp phải sau ngày mở bài",
  QUESTIONS_REQUIRED: "Đề cần có ít nhất 1 câu hỏi",
  QUESTION_CONTENT_REQUIRED: "Nhập nội dung câu hỏi",
  QUESTION_POINTS_REQUIRED: "Nhập điểm cho câu hỏi (lớn hơn 0)",
  QUESTION_OPTIONS_REQUIRED: "Nhập đủ nội dung cho cả 4 đáp án",
  QUESTION_CORRECT_OPTION_REQUIRED: "Chọn đúng 1 đáp án đúng cho câu trắc nghiệm",
  QUESTION_SAMPLE_ANSWER_REQUIRED: "Nhập đáp án mẫu / tiêu chí chấm cho câu tự luận",

  // Chấm bài AI (PROMPT T6B)
  SCORE_MIN: "Điểm không được nhỏ hơn 0",

  // Báo cáo (PROMPT T7)
  CLASSES_REQUIRED: "Chọn ít nhất một lớp",
} as const
