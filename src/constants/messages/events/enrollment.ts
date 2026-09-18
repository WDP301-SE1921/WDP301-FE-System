import { BUSINESS_RULES } from "@/constants/business-rules"

export const ENROLLMENT_MSG = {
  TITLE: "Đăng ký học",
  DESC: "Tạo học phí, lớp học và mã liên kết phụ huynh trong một quy trình thống nhất",
  TERM_BADGE: "Kỳ học mới 2026 – 2027",

  // Stepper
  STEP_TYPE: "Loại đăng ký",
  STEP_TYPE_SUB: "Đang thực hiện",
  STEP_INFO: "Thông tin",
  STEP_INFO_SUB: "Học sinh & PH",
  STEP_CLASS: "Môn & lớp",
  STEP_CLASS_SUB: "Xếp lịch đào tạo",
  STEP_PAYMENT: "Học phí",
  STEP_PAYMENT_SUB: "Thanh toán",
  STEP_DONE: "Hoàn tất",
  STEP_DONE_SUB: "Cấp mã kích hoạt",

  // Bước 1
  TYPE_TITLE: "Chọn đối tượng đăng ký",
  TYPE_DESC: "Hệ thống sẽ tự động tùy biến các bước tiếp theo dựa trên lựa chọn này.",
  TYPE_REQUIRED_BADGE: "Bắt buộc chọn 1",
  TYPE_FIRST_CHILD: "Con đầu tiên",
  TYPE_FIRST_CHILD_BADGE: "Phụ huynh mới",
  TYPE_FIRST_CHILD_DESC:
    "Phụ huynh chưa từng có tài khoản trên hệ thống. Hệ thống sẽ tự động tạo hồ sơ phụ huynh mới, hồ sơ học sinh và sinh mã liên kết gửi qua email.",
  TYPE_FIRST_CHILD_NOTE_1: "Tự động cấp mã QR & Portal phụ huynh",
  TYPE_FIRST_CHILD_NOTE_2: "Nhận báo cáo điểm danh & học phí tức thời",
  TYPE_ADDITIONAL_CHILD: "Thêm con cho phụ huynh đã có",
  TYPE_ADDITIONAL_CHILD_BADGE: "Hồ sơ liên kết",
  TYPE_ADDITIONAL_CHILD_DESC:
    "Phụ huynh đã có tài khoản, nay đăng ký thêm cho bé thứ 2, thứ 3… Toàn bộ hồ sơ con sẽ được gom chung dưới cùng một tài khoản phụ huynh.",
  TYPE_ADDITIONAL_CHILD_NOTE_1: "Tìm kiếm nhanh qua email hoặc số điện thoại",
  TYPE_ADDITIONAL_CHILD_NOTE_2: "Đồng bộ thông báo trên ứng dụng di động",
  TYPE_ADDITIONAL_SUBJECT: "Đăng ký thêm môn cho con cũ",
  TYPE_ADDITIONAL_SUBJECT_BADGE: "Học sinh đang theo học",
  TYPE_ADDITIONAL_SUBJECT_DESC:
    "Học sinh đang có hồ sơ tại trung tâm, nay muốn mở rộng thêm môn học mới. Không tạo trùng lặp hồ sơ.",
  TYPE_ADDITIONAL_SUBJECT_NOTE_1: "Áp dụng chính sách chiết khấu đa môn",
  TYPE_ADDITIONAL_SUBJECT_NOTE_2: "Bảo lưu điểm số và mã định danh duy nhất",

  ACCOUNT_RULE_TITLE: "Lưu ý bảo mật & Định danh tài khoản",
  ACCOUNT_RULE_DESC:
    "Mỗi học sinh chỉ gắn với duy nhất 1 số điện thoại và email phụ huynh làm định danh chính để gửi hóa đơn và học phí định kỳ.",

  // Bước 2
  INFO_STUDENT_TITLE: "Thông tin học sinh",
  INFO_PARENT_TITLE: "Thông tin phụ huynh",
  FIELD_STUDENT_NAME: "Họ tên con",
  FIELD_STUDENT_NAME_PLACEHOLDER: "Nguyễn Minh Khang",
  FIELD_GRADE: "Khối lớp",
  FIELD_GRADE_PLACEHOLDER: "Chọn khối",
  FIELD_PARENT_EMAIL: "Email phụ huynh",
  FIELD_PARENT_EMAIL_HINT: "Email này dùng để đăng nhập và nhận thông báo",
  FIELD_PARENT_PHONE: "Số điện thoại",
  FIELD_PARENT_PHONE_HINT: "Chỉ dùng để liên hệ",
  FIELD_EXISTING_PARENT: "Chọn phụ huynh đã có",
  FIELD_EXISTING_PARENT_PLACEHOLDER: "Tìm theo email hoặc số điện thoại",
  FIELD_EXISTING_STUDENT: "Chọn học sinh đã có hồ sơ",
  FIELD_EXISTING_STUDENT_PLACEHOLDER: "Tìm theo tên hoặc mã học sinh",
  EMAIL_EXISTS_TITLE: "Email này đã có tài khoản phụ huynh",
  EMAIL_EXISTS_DESC: 'Chuyển sang "Thêm con cho phụ huynh đã có" để gom hồ sơ về cùng một tài khoản.',
  EMAIL_EXISTS_ACTION: "Chuyển",

  // Bước 3
  CLASS_SUBJECT_TITLE: "Chọn môn học",
  CLASS_LIST_TITLE: "Lớp phù hợp",
  CLASS_LIST_DESC: (grade: number) => `Các lớp đang mở cho khối ${grade}`,
  CLASS_FULL: "Đã đủ sĩ số",
  CLASS_NO_OPTION_TITLE: "Chưa có lớp phù hợp",
  CLASS_NO_OPTION_DESC:
    "Không có lớp nào đang mở cho môn và khối đã chọn. Hãy chọn môn khác hoặc tạo lớp mới trước.",

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
    "Không phân biệt tiền mặt hay chuyển khoản. Thao tác không thể hoàn tác.",
  PAYMENT_CONFIRM_ACTION: "Xác nhận thanh toán",

  // Bước 5
  DONE_TITLE: "Đăng ký thành công",
  DONE_DESC: (studentName: string) =>
    `Đã tạo thanh toán và đăng ký học cho ${studentName}`,
  RECEIPT_TITLE: "Biên lai",
  RECEIPT_VIEW: "Xem biên lai",
  RECEIPT_PRINT: "In",
  LINK_TITLE: "Link / mã liên kết",
  LINK_EXPIRES: (date: string) =>
    `Hết hạn sau ${BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS} ngày (${date})`,
  EMAIL_TITLE: "Email thông báo",
  EMAIL_SENT_TO: (email: string) => `Đã gửi tới ${email}`,
  EMAIL_RESEND: "Gửi lại",
  EMAIL_FAILED_ALERT_TITLE: "Đã xác nhận thanh toán nhưng gửi email thất bại",
  EMAIL_FAILED_ALERT_DESC:
    "Thanh toán và hồ sơ đã được lưu. Hãy đọc mã liên kết cho phụ huynh hoặc bấm Gửi lại email.",
  DONE_VIEW_STUDENT: "Xem hồ sơ học sinh",
  DONE_NEW_ENROLLMENT: "Đăng ký học mới",

  // Tóm tắt
  SUMMARY_TITLE: "Tóm tắt đăng ký",
  SUMMARY_STEP: (current: number, total: number) => `Bước ${current}/${total}`,
  SUMMARY_TYPE: "Loại hồ sơ đăng ký",
  SUMMARY_PARENT: "Thông tin phụ huynh",
  SUMMARY_STUDENT: "Thông tin học sinh",
  SUMMARY_CLASS: "Môn & lớp đăng ký",
  SUMMARY_EMPTY: "Chưa có thông tin",
  SUMMARY_NO_CLASS: "0 môn đã chọn",
  SUMMARY_TUITION_TITLE: "Tạm tính học phí",
  SUMMARY_TUITION_EXPECTED: "Tiền học phí dự kiến",
  SUMMARY_DISCOUNT: "Ưu đãi áp dụng",
  SUMMARY_TOTAL: "Tổng thanh toán",
  SUMMARY_TOTAL_NOTE: "Thanh toán sau khi xếp lớp",
  SUMMARY_HELP_TITLE: "Cần trợ giúp hồ sơ?",
  SUMMARY_HELP_DESC: "Liên hệ tư vấn viên học vụ nội bộ qua hotline 1900 8899",

  // Footer
  CANCEL: "Hủy đăng ký",
  CANCEL_NOTE: "Dữ liệu tạm sẽ được giải phóng nếu thoát",
  SAVE_DRAFT: "Lưu nháp",
  NEXT_INFO: "Tiếp tục: Nhập thông tin",
  NEXT_CLASS: "Tiếp tục: Chọn môn & lớp",
  NEXT_PAYMENT: "Tiếp tục: Học phí",

  // Kết quả
  CREATE_SUCCESS: "Đăng ký học thành công",
  CREATE_SUCCESS_EMAIL_FAILED: "Đã lưu đăng ký nhưng gửi email thất bại",
  DRAFT_SAVED: "Đã lưu nháp đăng ký",
  CANCELLED: "Đã hủy đăng ký",
} as const
