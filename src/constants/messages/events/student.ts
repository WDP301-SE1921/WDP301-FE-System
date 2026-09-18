export const STUDENT_MSG = {
  // Danh sách
  LIST_TITLE: "Học sinh",
  LIST_DESC: "Quản lý hồ sơ học sinh theo tài khoản phụ huynh và tiến trình đào tạo",
  SEARCH_PLACEHOLDER: "Tìm tên học sinh, email phụ huynh...",
  ADD_ENROLLMENT: "Đăng ký học",

  // Nhãn KPI
  KPI_TOTAL: "Tổng học sinh",
  KPI_ACTIVE: "Đang theo học",
  KPI_EXPIRING: "Sắp hết gói",
  KPI_PENDING_LINK: "Chờ liên kết PH",

  // Cột bảng
  COL_STUDENT: "Học sinh",
  COL_PARENT: "Phụ huynh",
  COL_SUBJECTS: "Môn đang học",
  COL_ATTENDANCE: "Tỷ lệ đi học",
  COL_PACKAGE: "Gói học phí",
  COL_STATUS: "Trạng thái",

  // Bộ lọc
  FILTER_ALL_SUBJECTS: "Tất cả môn",
  FILTER_ALL_GRADES: "Tất cả khối",
  FILTER_ALL_CLASSES: "Tất cả lớp",
  GRADE_LABEL: (grade: number) => `Khối ${grade}`,

  // Hành động trên dòng
  ACTION_VIEW_DETAIL: "Xem chi tiết hồ sơ",
  ACTION_ADD_SUBJECT: "Đăng ký thêm môn",
  ACTION_REPORT_ABSENCE: "Báo nghỉ buổi",
  ACTION_LONG_LEAVE: "Nghỉ dài hạn",
  ACTION_WITHDRAW: "Nghỉ môn / Nghỉ hẳn",

  // Chi tiết
  DETAIL_TITLE: "Chi tiết học sinh",
  DETAIL_DESC: "Hồ sơ học tập, điểm danh và lịch sử thay đổi của học sinh",
  TAB_OVERVIEW: "Tổng quan",
  TAB_SCHEDULE: "Lịch học",
  TAB_ATTENDANCE: "Điểm danh",
  TAB_PAYMENTS: "Thanh toán",
  TAB_HISTORY: "Lịch sử",

  META_SUBJECT_COUNT: (count: number) => `${count} môn đang học`,
  META_ATTENDANCE_RATE: (rate: number) => `Tỷ lệ đi học ${rate}%`,
  META_PACKAGE_EXPIRY: "Gói học phí gần nhất hết hạn",
  PARENT_SECTION_TITLE: "Thông tin phụ huynh",

  ENROLLMENT_SECTION_TITLE: "Môn đang theo học",
  ENROLLMENT_SECTION_DESC: "Mỗi thẻ là một gói đăng ký đang hoạt động của học sinh",
  ENROLLMENT_PROGRESS: (done: number, total: number) => `Bài ${done}/${total}`,
  ENROLLMENT_PACKAGE: (months: number) => `${months} tháng`,
  ENROLLMENT_TEACHER: "Giáo viên",
  ENROLLMENT_ROOM: "Phòng",
  ACTION_MAKEUP: "Học bù",
  ACTION_CHANGE_SCHEDULE: "Đổi lịch",
  ACTION_DROP_SUBJECT: "Nghỉ môn",

  ATTENDANCE_SECTION_TITLE: "Lịch sử điểm danh",
  ATTENDANCE_FILTER_ALL: "Tất cả môn",
  ATTENDANCE_RATE_LABEL: "Tỷ lệ chuyên cần",
  COL_DATE: "Ngày",
  COL_CLASS: "Lớp",
  COL_LESSON: "Bài học",
  COL_NOTE: "Ghi chú",

  HISTORY_SECTION_TITLE: "Lịch sử thay đổi",
  HISTORY_SECTION_DESC: "Toàn bộ thao tác đã thực hiện trên hồ sơ học sinh này",

  SCHEDULE_TAB_EMPTY: "Lịch học chi tiết sẽ hiển thị tại đây khi màn Lịch học tổng hoàn tất",
  PAYMENTS_TAB_EMPTY: "Lịch sử thanh toán của học sinh sẽ hiển thị tại đây",

  NOT_FOUND_TITLE: "Không tìm thấy học sinh",
  NOT_FOUND_DESC: "Hồ sơ học sinh này không tồn tại hoặc đã bị xóa khỏi hệ thống.",

  EXPORT_SUCCESS: "Đã xuất danh sách học sinh",
} as const
