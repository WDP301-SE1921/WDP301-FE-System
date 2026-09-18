import { BUSINESS_RULES } from "@/constants/business-rules"

export const CLASS_MSG = {
  // Danh sách
  LIST_TITLE: "Lớp học",
  LIST_DESC: "Quản lý danh sách lớp, lịch cố định và giáo viên phụ trách",
  SEARCH_PLACEHOLDER: "Tìm tên lớp, mã lớp...",
  CREATE: "Tạo lớp mới",
  EXPORT: "Xuất danh sách",
  AUTO_REFRESH_NOTE: "Tự động cập nhật mỗi 2 phút trước",

  // KPI
  KPI_TOTAL: "Tổng số lớp học",
  KPI_TOTAL_SUB: "khóa mở",
  KPI_OPEN: "Đang mở giảng dạy",
  KPI_OPEN_SUB: (percent: number) => `Tỷ lệ ${percent}%`,
  KPI_FULL: "Đầy sĩ số (lưu ý)",
  KPI_FULL_SUB: "Khóa ghi danh",
  KPI_STUDENTS: "Học sinh đang theo học",
  KPI_STUDENTS_SUB: (average: number) => `Trung bình ${average}/lớp`,

  // Bộ lọc
  FILTER_ALL_SUBJECTS: "Môn: Tất cả",
  FILTER_ALL_GRADES: "Khối: Tất cả",
  FILTER_ALL_PROGRAMS: "Chương trình: Tất cả",
  FILTER_ALL_TEACHERS: "Giáo viên: Tất cả",
  FILTER_ALL_STATUS: "Trạng thái: Tất cả",

  // Cột bảng
  COL_NAME: "Tên lớp",
  COL_SUBJECT: "Môn",
  COL_GRADE: "Khối",
  COL_PROGRAM: "Chương trình",
  COL_SCHEDULE: "Lịch cố định",
  COL_TEACHER: "Giáo viên",
  COL_ROOM: "Phòng",
  COL_CAPACITY: "Sĩ số",
  COL_PROGRESS: "Tiến độ",
  NO_TEACHER: "Chưa phân công",
  PROGRESS_LABEL: (done: number, total: number) => `Bài ${done}/${total}`,

  // Hành động trên dòng
  ACTION_VIEW_DETAIL: "Xem chi tiết lớp",
  ACTION_EDIT: "Sửa lớp",
  ACTION_CHANGE_TEACHER: "Đổi giáo viên",
  ACTION_CLOSE: "Kết thúc lớp",

  LIST_NOTE_TITLE: "Quy chuẩn tổ chức lớp học & sĩ số tối đa",
  LIST_NOTE_DESC:
    "Mỗi lớp giới hạn tối đa 20 học viên để đảm bảo chất lượng giảng dạy. Khi lớp đạt 20/20 sĩ số, hệ thống sẽ tự động khóa ghi danh mới và gửi cảnh báo đến bộ phận tư vấn tuyển sinh để mở thêm phân lớp mới tương đương.",

  // Tạo lớp
  CREATE_TITLE: "Tạo lớp mới",
  CREATE_DESC:
    "Thiết lập thông tin khóa học, lịch học định kỳ và tự động sinh lịch các buổi học chi tiết",
  CREATE_DRAFT_BADGE: "Đang soạn thảo tự động",
  STEP_INFO: "Bước 1/3",
  STEP_SCHEDULE: "Bước 2/3",
  STEP_ASSIGN: "Bước 3/3",

  SECTION_INFO_TITLE: "Thông tin lớp học",
  SECTION_INFO_DESC: "Tên định danh, môn học và khung chương trình giảng dạy",
  SECTION_SCHEDULE_TITLE: "Lịch học cố định & Thời gian",
  SECTION_SCHEDULE_DESC: "Chọn buổi học trong tuần, hệ thống sẽ tự động sinh lịch tự động",
  SECTION_ASSIGN_TITLE: "Phân công giáo viên & Phòng học",
  SECTION_ASSIGN_DESC: "Chọn nhân sự phụ trách giảng dạy và cơ sở vật chất phòng học",

  FIELD_NAME: "Tên lớp học",
  FIELD_NAME_PLACEHOLDER: "Toán 8A – Nâng cao bứt phá điểm số",
  FIELD_SUBJECT: "Môn học",
  FIELD_SUBJECT_PLACEHOLDER: "Chọn môn",
  FIELD_GRADE: "Khối lớp",
  FIELD_GRADE_PLACEHOLDER: "Chọn khối",
  FIELD_CAPACITY: "Sĩ số tối đa",
  FIELD_CAPACITY_UNIT: "học sinh",
  FIELD_PROGRAM: "Chương trình đào tạo áp dụng",
  FIELD_PROGRAM_PLACEHOLDER: "Chọn chương trình",
  FIELD_PROGRAM_LESSONS: (count: number) => `${count} bài học theo khung chuẩn`,
  FIELD_WEEKDAYS: "Chọn các ngày học trong tuần",
  FIELD_WEEKDAYS_SELECTED: (count: number, days: string) =>
    `${count} buổi / tuần (${days})`,
  FIELD_START_TIME: "Giờ bắt đầu",
  FIELD_END_TIME: "Giờ kết thúc",
  FIELD_DURATION: (minutes: number) => `${minutes} phút / buổi`,
  FIELD_START_DATE: "Ngày bắt đầu học",
  FIELD_TEACHER: "Giáo viên phụ trách",
  FIELD_TEACHER_PLACEHOLDER: "Chọn giáo viên",
  FIELD_ROOM: "Phòng học",
  FIELD_ROOM_PLACEHOLDER: "Chọn phòng",
  ROOM_CAPACITY: (capacity: number) => `Sức chứa ${capacity} chỗ`,

  CAPACITY_HINT: `Quy chuẩn tối đa ${BUSINESS_RULES.CLASS_CAPACITY_MAX} học sinh/lớp của EduGrade nhằm tối ưu tương tác giáo viên – học sinh.`,
  SCHEDULE_HINT:
    "Khung giờ học cố định sẽ được nhân bản tự động cho các tuần theo khung chương trình.",

  ROOM_CONFLICT_BADGE: "Xung đột",
  ROOM_CONFLICT_TITLE: "Cảnh báo trùng lịch phòng học",
  ROOM_CONFLICT_DESC: (room: string, className: string, slot: string) =>
    `Phòng ${room} đã có lớp ${className} vào ${slot}. Vui lòng chọn phòng học khác.`,
  ROOM_CONFLICT_SUGGEST: "Gợi ý phòng trống cùng khung:",

  PREVIEW_TITLE: (count: number) => `Sẽ sinh ${count} buổi học`,
  PREVIEW_AUTO: "Tự động",
  PREVIEW_RANGE: (from: string, to: string) => `Dự kiến: ${from} – ${to}`,
  PREVIEW_HOLIDAY_NOTE: "Đã tự động bỏ qua các ngày nghỉ lễ theo lịch Bộ GD",
  PREVIEW_TOTAL_HOURS: "Tổng thời lượng",
  PREVIEW_HOURS_UNIT: (hours: number) => `${hours} giờ học`,
  PREVIEW_FREQUENCY: "Tần suất học",
  PREVIEW_FREQUENCY_UNIT: (count: number) => `${count} buổi / tuần`,
  PREVIEW_LIST_TITLE: "Lịch trình chi tiết các buổi học đầu tiên",
  PREVIEW_EMPTY: "Chọn chương trình và lịch cố định để xem trước buổi học",
  PREVIEW_FOOTER: "Giáo trình điện tử EduGrade",
  PREVIEW_FOOTER_SUB: "Đã đính kèm sẵn bài giảng",

  CANCEL: "Hủy bỏ",
  SAVE_DRAFT: "Lưu bản nháp",
  SUBMIT: (count: number) => `Tạo lớp & sinh ${count} buổi học`,
  CREATE_SUCCESS: (count: number) =>
    `Tạo lớp thành công, đã sinh ${count} buổi học`,
  DRAFT_SAVED: "Đã lưu bản nháp lớp học",

  // Chi tiết
  DETAIL_DESC: (program: string, term: string) => `Chương trình: ${program} · ${term}`,
  DETAIL_TERM: "Học kỳ I (2026 - 2027)",
  BADGE_ACTIVE: "Đang hoạt động",
  BADGE_NEW: "Toán học",
  INFO_SCHEDULE: "Lịch cố định",
  INFO_TEACHER: "Giáo viên phụ trách",
  INFO_ROOM: "Phòng học & Sĩ số",
  INFO_PROGRESS: "Tiến độ khóa",
  INFO_PROGRESS_VALUE: (percent: number, done: number, total: number) =>
    `${percent}% (${done}/${total} buổi)`,
  INFO_REMAINING: (count: number) => `Còn lại ${count} buổi học`,
  INFO_LESSON_DONE: (order: number) => `Bài ${order} đã tới`,

  TAB_STUDENTS: "Học sinh",
  TAB_SESSIONS: "Buổi học",
  TAB_TEACHERS: "Giáo viên",
  TAB_HISTORY: "Lịch sử & Nhật ký",

  SESSION_SEARCH_PLACEHOLDER: "Tìm theo tên bài học, mã buổi...",
  SESSION_FILTER_ALL: (count: number) => `Tất cả (${count})`,
  SESSION_FILTER_MARKED: (count: number) => `Đã điểm danh (${count})`,
  SESSION_FILTER_TODAY: (count: number) => `Hôm nay (${count})`,
  SESSION_FILTER_UPCOMING: (count: number) => `Sắp tới (${count})`,
  SESSION_EXPORT: "Xuất lịch học",
  SESSION_ADD: "Thêm buổi phát sinh",

  COL_SESSION: "Buổi",
  COL_DATE: "Ngày & Thứ",
  COL_LESSON: "Bài học & Nội dung giảng dạy",
  COL_SESSION_TEACHER: "Giáo viên phụ trách",
  COL_STATUS: "Trạng thái",
  COL_MAKEUP: "Học bù đến",
  COL_SESSION_ACTIONS: "Thao tác",
  SESSION_NUMBER: (order: number) => `Buổi ${order}`,
  SESSION_TODAY_BADGE: "Hôm nay",
  SESSION_FOCUS_BADGE: "Trọng tâm",
  SESSION_SUBSTITUTE_BADGE: "Dạy thay",
  SESSION_MAKEUP_COUNT: (count: number) => `+${count} học sinh`,
  SESSION_MARKED: "Đã điểm danh",
  SESSION_UNMARKED: "Chưa điểm danh",
  SESSION_UPCOMING: "Sắp diễn ra",
  SESSION_VIEW: "Chi tiết",
  SESSION_TAKE_ATTENDANCE: "Điểm danh",
  SESSION_SUMMARY: (done: number, total: number) =>
    `${total} buổi học (Hoàn thành: ${done} buổi)`,

  STUDENTS_TAB_EMPTY: "Danh sách học sinh của lớp sẽ hiển thị tại đây",
  TEACHERS_TAB_EMPTY: "Thông tin giáo viên phụ trách và dạy thay sẽ hiển thị tại đây",
  HISTORY_TAB_EMPTY: "Nhật ký thay đổi của lớp sẽ hiển thị tại đây",

  NOT_FOUND_TITLE: "Không tìm thấy lớp học",
  NOT_FOUND_DESC: "Lớp học này không tồn tại hoặc đã bị xóa khỏi hệ thống.",
  EXPORT_SUCCESS: "Đã xuất danh sách lớp học",
} as const
