import { BUSINESS_RULES } from "@/constants/business-rules"

export const ENROLLMENT_MSG = {
  TITLE: "Đăng ký học",
  DESC: "Tra cứu phụ huynh, chọn hồ sơ con, xếp lớp theo lịch cố định và thu học phí trong một quy trình",
  TERM_BADGE: "Kỳ học mới 2026 – 2027",

  // Stepper
  STEP_PARENT: "Phụ huynh",
  STEP_PARENT_SUB: "Tra cứu theo Gmail",
  STEP_CHILD: "Chọn con",
  STEP_CHILD_SUB: "Hồ sơ trên app",
  STEP_CLASS: "Khối, môn & lớp",
  STEP_CLASS_SUB: "Theo lịch cố định",
  STEP_PAYMENT: "Học phí",
  STEP_PAYMENT_SUB: "Thu tiền tại trung tâm",
  STEP_DONE: "Hoàn tất",
  STEP_DONE_SUB: "Biên lai",

  // Bước 1 — chọn phụ huynh
  LOOKUP_TITLE: "Chọn phụ huynh",
  LOOKUP_DESC:
    "Phụ huynh tự đăng ký tài khoản và tạo hồ sơ cho con trên ứng dụng EduGrade trước khi trung tâm đăng ký lớp.",
  LOOKUP_PICKER_LABEL: "Phụ huynh (tìm theo Gmail hoặc số điện thoại)",
  LOOKUP_PICKER_PLACEHOLDER: "Nhập Gmail hoặc số điện thoại phụ huynh...",
  LOOKUP_ALERT_TITLE: "Không tìm thấy phụ huynh?",
  LOOKUP_ALERT_DESC:
    "Phụ huynh cần tải ứng dụng EduGrade, đăng ký tài khoản và tạo hồ sơ cho con trước. Tài khoản đã bị khóa không hiện trong kết quả — liên hệ quản lý trung tâm để mở khóa.",
  PARENT_DISABLED: "Tài khoản phụ huynh đã bị khóa, không thể đăng ký học",
  CHILD_NOT_OF_PARENT: "Hồ sơ con không thuộc tài khoản phụ huynh đã tra cứu",

  // Bước 2 — chọn con
  CHILD_TITLE: "Chọn hồ sơ con",
  CHILD_DESC: "Các hồ sơ con phụ huynh đã tạo trên ứng dụng",
  CHILD_PICKER_LABEL: "Hồ sơ con (tìm theo tên hoặc mã học sinh)",
  CHILD_PICKER_PLACEHOLDER: "Tìm tên hoặc mã học sinh...",
  CHILD_EMPTY_TITLE: "Phụ huynh chưa tạo hồ sơ con",
  CHILD_EMPTY_DESC:
    "Phụ huynh cần tạo hồ sơ cho con trên ứng dụng EduGrade rồi quay lại đăng ký.",
  CHILD_WITHDRAWN_NOTE: "Đã nghỉ hẳn — đăng ký lại sẽ mở lại hồ sơ này",

  // Bước 3 — khối, môn, lớp
  CLASS_GRADE_TITLE: "Chọn khối",
  CLASS_GRADE_PLACEHOLDER: "Chọn khối",
  CLASS_GRADE_MISMATCH: (childGrade: number, grade: number) =>
    `Con đang học khối ${childGrade} nhưng bạn đang chọn khối ${grade}. Hãy kiểm tra lại nếu chưa chủ ý.`,
  CLASS_SUBJECT_TITLE: "Chọn môn học",
  CLASS_SUBJECT_EMPTY: "Khối này chưa có môn nào có lớp đang mở",
  CLASS_LIST_TITLE: "Lớp phù hợp",
  CLASS_LIST_DESC: (grade: number) => `Các lớp đang mở cho khối ${grade}, xếp theo lịch cố định`,
  CLASS_FULL: "Đã đủ sĩ số",
  CLASS_CONFLICT: "Trùng lịch",
  CLASS_CONFLICT_ALERT_TITLE: "Lớp này trùng lịch học của con",
  CLASS_CONFLICT_ALERT_DESC: (className: string) =>
    `Con đang học lớp ${className} cùng khung giờ. Bạn vẫn có thể đăng ký nếu phụ huynh đồng ý.`,
  CLASS_NO_OPTION_TITLE: "Chưa có lớp phù hợp",
  CLASS_NO_OPTION_DESC:
    "Không có lớp nào đang mở cho môn và khối đã chọn. Hãy chọn môn khác hoặc nhờ quản lý trung tâm tạo lớp mới.",

  // Bước 4
  MONTHS_TITLE: "Số tháng đăng ký",
  MONTHS_HINT: `Từ ${BUSINESS_RULES.ENROLLMENT_MONTHS_MIN} đến ${BUSINESS_RULES.ENROLLMENT_MONTHS_MAX} tháng`,
  MONTHS_UNIT: (months: number) => `${months} tháng`,
  TUITION_TITLE: "Học phí",
  TUITION_PER_MONTH: "Học phí / tháng",
  TUITION_MONTHS: "Số tháng",
  TUITION_PERIOD: "Thời gian",
  TUITION_TOTAL: "Tổng cộng",
  PAYMENT_CONFIRM_TITLE: "Xác nhận thanh toán",
  PAYMENT_CONFIRM_CHECKBOX: (amount: string) => `Tôi đã nhận đủ ${amount} từ phụ huynh`,
  PAYMENT_CONFIRM_NOTE:
    "Thu trực tiếp tại trung tâm (không phân biệt tiền mặt hay chuyển khoản). Thao tác không thể hoàn tác.",
  PAYMENT_CONFIRM_ACTION: "Xác nhận thanh toán",

  // Bước 5
  DONE_TITLE: "Đăng ký thành công",
  DONE_DESC: (studentName: string) =>
    `Đã tạo thanh toán và đăng ký học cho ${studentName}. Lịch học đã hiện trên app của phụ huynh.`,
  RECEIPT_TITLE: "Biên lai",
  RECEIPT_VIEW: "Xem biên lai",
  RECEIPT_PRINT: "In",
  EMAIL_TITLE: "Email biên lai",
  EMAIL_SENT_TO: (email: string) => `Đã gửi tới ${email}`,
  EMAIL_RESEND: "Gửi lại",
  EMAIL_FAILED_ALERT_TITLE: "Đã xác nhận thanh toán nhưng gửi email thất bại",
  EMAIL_FAILED_ALERT_DESC:
    "Thanh toán và đăng ký đã được lưu. Bấm Gửi lại để gửi biên lai tới phụ huynh.",
  DONE_VIEW_STUDENT: "Xem hồ sơ học sinh",
  DONE_NEW_ENROLLMENT: "Đăng ký học mới",

  // Tóm tắt
  SUMMARY_TITLE: "Tóm tắt đăng ký",
  SUMMARY_STEP: (current: number, total: number) => `Bước ${current}/${total}`,
  SUMMARY_PARENT: "Phụ huynh",
  SUMMARY_STUDENT: "Học sinh",
  SUMMARY_CLASS: "Môn & lớp đăng ký",
  SUMMARY_SCHEDULE: "Lịch học cố định",
  SUMMARY_EMPTY: "Chưa có thông tin",
  SUMMARY_NO_CLASS: "0 môn đã chọn",
  SUMMARY_TUITION_TITLE: "Tạm tính học phí",
  SUMMARY_TUITION_EXPECTED: "Tiền học phí dự kiến",
  SUMMARY_DISCOUNT: "Ưu đãi áp dụng",
  SUMMARY_TOTAL: "Tổng thanh toán",
  SUMMARY_TOTAL_NOTE: "Thu sau khi xếp lớp",
  SUMMARY_HELP_TITLE: "Cần trợ giúp hồ sơ?",
  SUMMARY_HELP_DESC: "Liên hệ tư vấn viên học vụ nội bộ qua hotline 1900 8899",

  // Footer
  CANCEL: "Hủy đăng ký",
  CANCEL_NOTE: "Dữ liệu tạm sẽ được giải phóng nếu thoát",
  SAVE_DRAFT: "Lưu nháp",
  NEXT_CHILD: "Tiếp tục: Chọn hồ sơ con",
  NEXT_CLASS: "Tiếp tục: Chọn khối, môn & lớp",
  NEXT_PAYMENT: "Tiếp tục: Học phí",

  // Kết quả
  CREATE_SUCCESS: "Đăng ký học thành công",
  CREATE_SUCCESS_EMAIL_FAILED: "Đã lưu đăng ký nhưng gửi email thất bại",
  DRAFT_SAVED: "Đã lưu nháp đăng ký",
  CANCELLED: "Đã hủy đăng ký",
} as const
