/**
 * Message cho 4 màn thuộc cổng thông tin Giáo viên (Dashboard, Lịch dạy, Lớp của
 * tôi + Chi tiết lớp, Điểm danh) — gộp chung 1 file theo đúng tiền lệ `teacher.ts`
 * (dài, nhiều màn cùng domain giáo viên).
 */

export const TEACHER_DASHBOARD_MSG = {
  TITLE: "Dashboard",
  DESC: (todayLabel: string) => `Xin chào Trần Văn Minh, ${todayLabel}`,

  KPI_SESSIONS_TODAY: "Buổi dạy hôm nay",
  KPI_CLASSES: "Lớp phụ trách",
  KPI_PENDING_GRADING: "Bài chờ chấm",
  KPI_PENDING_AI: "Bài AI chờ duyệt",

  TODAY_SESSIONS_TITLE: "Lịch dạy hôm nay",
  TODAY_SESSIONS_EMPTY_TITLE: "Hôm nay không có buổi dạy",
  TODAY_SESSIONS_EMPTY_DESC: "Bạn không có buổi học nào được xếp lịch hôm nay.",
  COL_TIME: "Giờ học",
  COL_CLASS: "Lớp",
  COL_LESSON: "Bài học",
  COL_ROOM: "Phòng",
  COL_STUDENTS: "Sĩ số",
  COL_STATUS: "Trạng thái",
  ATTENDANCE_MARKED: "Đã điểm danh",
  ATTENDANCE_UNMARKED: "Chưa điểm danh",
  ACTION_TAKE_ATTENDANCE: "Điểm danh",

  TASKS_TITLE: "Cần xử lý",
  TASK_PENDING_AI: "Bài AI chờ duyệt",
  TASK_PENDING_AI_DESC: "Cần kiểm tra trước khi công bố cho phụ huynh",
  TASK_UNMARKED: "Buổi chưa điểm danh",
  TASK_UNMARKED_DESC: "Cần điểm danh trước cuối ngày",
  TASK_DUE_SOON: "Bài tập sắp hết hạn nộp",
  TASK_DUE_SOON_DESC: "Học sinh sắp hết hạn nộp bài",

  RECENT_SUBMISSIONS_TITLE: "Bài nộp gần đây",
  COL_STUDENT: "Học sinh",
  COL_ASSIGNMENT: "Bài tập",
  COL_SUBMITTED_AT: "Thời gian nộp",
} as const

export const TEACHER_SCHEDULE_MSG = {
  TITLE: "Lịch dạy",
  DESC: "Lịch dạy cá nhân",
  FILTER_ALL_CLASSES: "Tất cả lớp",
} as const

export const TEACHER_CLASS_MSG = {
  // Danh sách
  LIST_TITLE: "Lớp của tôi",
  LIST_DESC: (count: number) => `${count} lớp đang phụ trách`,
  CARD_ATTENDANCE_RATE: "Tỷ lệ đi học TB",
  CARD_PROGRESS: (done: number, total: number) => `Bài ${done}/${total}`,
  ACTION_VIEW_CLASS: "Xem lớp",

  // Chi tiết
  DETAIL_BACK: "Lớp của tôi",
  TAB_STUDENTS: "Học sinh",
  TAB_SESSIONS: "Buổi học",
  TAB_ATTENDANCE_RATE: "Tỷ lệ đi học",

  COL_STUDENT: "Học sinh",
  COL_ATTENDANCE_RATE: "Tỷ lệ đi học",
  COL_AVG_SCORE: "Điểm trung bình",
  COL_STATUS: "Trạng thái",
  AVG_SCORE_UNAVAILABLE: "—",
  QUICKVIEW_GRADE_LABEL: (grade: number) => `Khối ${grade}`,

  SESSION_COL_SESSION: "Buổi",
  SESSION_COL_DATE: "Ngày",
  SESSION_COL_LESSON: "Bài học",
  SESSION_COL_STATUS: "Trạng thái điểm danh",
  SESSION_COL_ACTION: "Thao tác",
  SESSION_MARKED: "Đã điểm danh",
  SESSION_UNMARKED: "Chưa điểm danh",
  ACTION_TAKE_ATTENDANCE: "Điểm danh",
  ACTION_VIEW: "Xem",

  WEEKLY_CHART_TITLE: "Tỷ lệ đi học theo tuần",

  NOT_FOUND_TITLE: "Không tìm thấy lớp học",
  NOT_FOUND_DESC: "Lớp học này không tồn tại hoặc bạn không phụ trách lớp này.",
} as const

export const TEACHER_ATTENDANCE_MSG = {
  LIST_TITLE: "Điểm danh",
  TAB_TODAY: (count: number) => `Hôm nay (${count})`,
  TAB_UNMARKED: (count: number) => `Chưa điểm danh (${count})`,
  TAB_MARKED: "Đã điểm danh",
  STATUS_MARKED: "Đã điểm danh",
  STATUS_UNMARKED: "Chưa điểm danh",

  COL_TIME: "Giờ",
  COL_CLASS: "Lớp",
  COL_LESSON: "Bài học",
  COL_ROOM: "Phòng",
  COL_CAPACITY: "Sĩ số",
  COL_STATUS: "Trạng thái",
  COL_ACTION: "Thao tác",
  COL_STUDENT: "Học sinh",
  ACTION_TAKE_ATTENDANCE: "Điểm danh",
  ACTION_VIEW_AGAIN: "Xem lại",

  SESSION_NOT_FOUND_TITLE: "Không tìm thấy buổi học",
  SESSION_NOT_FOUND_DESC: "Buổi học này không tồn tại hoặc không thuộc lớp bạn phụ trách.",

  STUDENT_COUNT: (count: number) => `${count} học sinh`,
  SELECTED_PRESENT_COUNT: (count: number) => `Đã chọn: ${count} Có mặt`,
  NOTE_PLACEHOLDER: "Ghi chú (tuỳ chọn)",
  SAVE_ATTENDANCE: "Lưu điểm danh",
  FOOTER_NOTE: "Phụ huynh sẽ nhận email sau khi lưu",
  SAVE_SUCCESS: "Đã lưu điểm danh",
} as const

/**
 * Tài khoản cá nhân của giáo viên (PROMPT T8) — cùng bộ khóa với `SYSTEM_MSG`
 * (phần "Tài khoản cá nhân") ở `messages/events/system.ts`, thêm field readonly
 * "Môn dạy".
 */
export const TEACHER_PROFILE_MSG = {
  PROFILE_TITLE: "Tài khoản",
  TAB_INFO: "Thông tin cá nhân",
  TAB_PASSWORD: "Đổi mật khẩu",

  CHANGE_PHOTO: "Đổi ảnh",
  FIELD_NAME: "Họ tên",
  FIELD_EMAIL: "Email",
  FIELD_PHONE: "Số điện thoại",
  EMAIL_DISABLED_HINT: "Email đăng nhập không thể thay đổi",
  FIELD_SUBJECTS: "Môn dạy",
  SUBJECTS_DISABLED_HINT: "Môn dạy do Quản lý phân công, không tự sửa được",
  SAVE_PROFILE: "Lưu thay đổi",
  UPDATE_PROFILE_SUCCESS: "Cập nhật thông tin thành công",

  FIELD_CURRENT_PASSWORD: "Mật khẩu hiện tại",
  FIELD_NEW_PASSWORD: "Mật khẩu mới",
  FIELD_CONFIRM_PASSWORD: "Xác nhận mật khẩu mới",
  PASSWORD_STRENGTH_WEAK: "Yếu",
  PASSWORD_STRENGTH_MEDIUM: "Trung bình",
  PASSWORD_STRENGTH_STRONG: "Mạnh",
  CHANGE_PASSWORD_SUBMIT: "Đổi mật khẩu",
  CHANGE_PASSWORD_SUCCESS: "Đổi mật khẩu thành công",
} as const
