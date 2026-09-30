export const TEACHER_MSG = {
  // Danh sách
  LIST_TITLE: "Giáo viên",
  LIST_DESC: "Quản lý hồ sơ, phân công bộ môn và theo dõi khối lượng giảng dạy của đội ngũ giáo viên",
  LIST_BADGE: (count: number) => `Tổng số ${count} giáo viên`,
  SEARCH_PLACEHOLDER: "Tìm theo tên GV, email, số điện thoại...",
  INVITE: "Mời giáo viên",
  EXPORT: "Xuất Excel",

  // KPI
  KPI_HOURS: "Tổng giờ dạy / tuần",
  KPI_HOURS_UNIT: (hours: number) => `${hours} giờ`,
  KPI_HOURS_SUB: "+8% so với tuần trước",
  KPI_CLASSES: "Lớp đang vận hành",
  KPI_CLASSES_UNIT: (count: number) => `${count} lớp`,
  KPI_CLASSES_SUB: (grades: string) => `6 khối lớp (${grades})`,
  KPI_ATTENDANCE: "Tỷ lệ chuyên cần",
  KPI_ATTENDANCE_SUB: "Chưa phát sinh nghỉ",
  KPI_RATING: "Đánh giá trung bình",
  KPI_RATING_UNIT: (rating: number) => `${rating} / 5.0`,
  KPI_RATING_SUB: (count: number) => `Từ ${count} lượt phụ huynh`,

  // Tabs & filter
  TAB_ACTIVE: "Đang hoạt động",
  TAB_INACTIVE: "Ngưng hoạt động",
  FILTER_ALL_SUBJECTS: "Tất cả môn dạy",
  FILTER_ALL_CLASSES: "Số lớp phụ trách",
  FILTER_CLASS_RANGE: (from: number, to: number) => `${from} – ${to} lớp`,

  // Cột bảng
  COL_TEACHER: "Giáo viên",
  COL_SUBJECTS: "Môn dạy",
  COL_CLASS_COUNT: "Số lớp phụ trách",
  COL_WEEK_SESSIONS: "Số buổi tuần này",
  COL_STATUS: "Trạng thái",
  CLASS_COUNT_UNIT: (count: number) => `${count} lớp`,
  STUDENT_COUNT_UNIT: (count: number) => `${count} học sinh`,
  SESSION_COUNT_UNIT: (count: number) => `${count} buổi`,
  SESSION_PER_WEEK: "/ tuần",
  HEAD_TEACHER_BADGE: "Tổ trưởng",

  ACTION_VIEW_DETAIL: "Xem chi tiết hồ sơ",
  ACTION_ASSIGN_CLASS: "Phân công lớp",
  ACTION_DEACTIVATE: "Ngưng hoạt động",
  ACTION_REACTIVATE: "Kích hoạt lại",
  DEACTIVATE_SUCCESS: "Đã ngưng hoạt động giáo viên",
  REACTIVATE_SUCCESS: "Đã kích hoạt lại giáo viên",
  EXPORT_SUCCESS: "Đã xuất danh sách giáo viên",

  // Chi tiết
  DETAIL_EDIT: "Chỉnh sửa hồ sơ",
  TAB_WORK_CREDITS: "Công",
  EDIT_MODAL_TITLE: "Chỉnh sửa hồ sơ giáo viên",
  EDIT_MODAL_DESC: "Cập nhật liên hệ, chuyên môn và môn dạy. Email là định danh đăng nhập nên không đổi được.",
  EDIT_FIELD_SPECIALTY: "Chuyên môn",
  EDIT_FIELD_SPECIALTY_PLACEHOLDER: "Toán học (THCS & Luyện thi Chuyên)",
  EDIT_SUCCESS: "Đã cập nhật hồ sơ giáo viên",
  DETAIL_ASSIGN: "Phân công lớp",
  DETAIL_SYNC_NOTE: (time: string) => `Đồng bộ lịch học: Hôm nay lúc ${time}`,
  STAT_CLASSES: "Lớp quản lý",
  STAT_WORKLOAD: "Khối lượng chuẩn",
  STAT_SUBSTITUTE: "Dạy thay tháng",
  STAT_SUBSTITUTE_UNIT: (count: number) => `${count} lần`,
  STAT_SUBSTITUTE_SUB: "Đã duyệt",

  TAB_CLASSES: "Lớp phụ trách",
  TAB_SCHEDULE: "Lịch dạy",
  TAB_SUBSTITUTE: "Lịch sử dạy thay",
  TAB_REVIEW: "Đánh giá & Nhật ký",

  CLASSES_SECTION_TITLE: (count: number) => `Danh sách ${count} lớp phụ trách trực tiếp`,
  CLASSES_SECTION_DESC:
    "Thông tin chi tiết tiến độ, phòng học và sĩ số các lớp do giáo viên đảm nhiệm",
  CLASSES_TOTAL_STUDENTS: (count: number) => `Tổng số học sinh: ${count}`,
  CLASS_PROGRESS: "Tiến độ giảng dạy",
  CLASS_PROGRESS_VALUE: (done: number, total: number, percent: number) =>
    `${done}/${total} buổi (${percent}%)`,
  CLASS_SEATS: (enrolled: number, capacity: number) => `Sĩ số: ${enrolled}/${capacity}`,
  CLASS_SEATS_FULL: "Đủ chỉ tiêu",
  CLASS_SEATS_LEFT: (left: number) => `Còn ${left} chỗ`,

  SCHEDULE_TAB_DESC: "Lịch dạy trong tuần hiện tại của giáo viên",
  SUBSTITUTE_TAB_EMPTY: "Giáo viên chưa có lượt dạy thay nào",
  REVIEW_TAB_EMPTY: "Đánh giá từ phụ huynh và nhật ký hoạt động sẽ hiển thị tại đây",
  CLASSES_TAB_EMPTY: "Giáo viên chưa được phân công lớp nào",

  NOT_FOUND_TITLE: "Không tìm thấy giáo viên",
  NOT_FOUND_DESC: "Hồ sơ giáo viên này không tồn tại hoặc đã bị xóa khỏi hệ thống.",

  // Lời mời & duyệt
  INVITATION_TITLE: "Lời mời & duyệt giáo viên",
  INVITATION_DESC:
    "Xử lý hồ sơ giáo viên mới đăng ký tham gia giảng dạy và quản lý các liên kết mời thành viên",
  INVITATION_KPI_PENDING: "Hồ sơ chờ phê duyệt",
  INVITATION_KPI_PENDING_SUB: (count: number) => `${count} ứng viên`,
  INVITATION_KPI_SENT: "Lời mời đang chờ kích hoạt",
  INVITATION_KPI_SENT_SUB: (count: number) => `${count} liên kết`,
  INVITATION_KPI_JOINED: "Đã tiếp nhận tháng này",
  INVITATION_KPI_JOINED_SUB: (count: number) => `${count} giáo viên`,
  INVITATION_KPI_RATE: "Tỷ lệ duyệt đạt chuẩn",

  TAB_PENDING: "Chờ duyệt",
  TAB_SENT: "Lời mời đã gửi",
  INVITATION_SEARCH_PLACEHOLDER: "Lọc theo tên, SĐT, môn...",
  INVITATION_FILTER_SUBJECT: "Môn học",
  INVITATION_SORT_NEWEST: "Mới nhất",

  INVITATION_GRADES: (grades: string) => `Lớp ${grades}`,
  INVITATION_EXPERIENCE: "Kinh nghiệm",
  INVITATION_VIEW_CV: "Xem",
  INVITATION_APPROVE: "Duyệt hồ sơ",
  INVITATION_REJECT: "Từ chối",
  INVITATION_RESEND: "Gửi lại lời mời",
  INVITATION_REVOKE: "Thu hồi lời mời",
  APPROVE_SUCCESS: (name: string) => `Đã duyệt hồ sơ ${name}`,
  REJECT_SUCCESS: (name: string) => `Đã từ chối hồ sơ ${name}`,
  RESEND_SUCCESS: "Đã gửi lại lời mời",
  PENDING_EMPTY: "Không có hồ sơ nào chờ duyệt",
  SENT_EMPTY: "Chưa gửi lời mời nào",

  // Modal mời giáo viên
  INVITE_MODAL_TITLE: "Mời giáo viên",
  INVITE_MODAL_DESC: "Gửi lời mời qua email để giáo viên tự kích hoạt tài khoản EduGrade",
  INVITE_FIELD_EMAIL: "Email giáo viên",
  INVITE_FIELD_NAME: "Họ và tên",
  INVITE_FIELD_PHONE: "Số điện thoại",
  INVITE_FIELD_SUBJECTS: "Môn dạy",
  INVITE_FIELD_SUBJECTS_HINT: "Chọn ít nhất một môn",
  INVITE_SUBMIT: "Gửi lời mời",
  INVITE_SUCCESS: (email: string) => `Đã gửi lời mời tới ${email}`,

  // Dạy thay
  SUBSTITUTE_TITLE: "Xếp giáo viên dạy thay",
  SUBSTITUTE_DESC:
    "Điều phối giáo viên cùng bộ môn giảng dạy thay thế khi giáo viên chính thức báo bận hoặc nghỉ phép đột xuất",
  SUBSTITUTE_PENDING_BADGE: (count: number) => `${count} ca cần xử lý`,
  SUBSTITUTE_RULE_BADGE: "Quy chuẩn tải lao",

  SESSION_PICKER_TITLE: "Chọn buổi học cần dạy thay",
  SESSION_TAB_NEEDS: (count: number) => `Cần dạy thay (${count})`,
  SESSION_TAB_ALL: (count: number) => `Tất cả buổi học (${count})`,
  SESSION_NO_TEACHER: "Chưa có GV",
  SESSION_HAS_SUBSTITUTE: "Đã xếp dạy thay",
  SESSION_MAIN_TEACHER: "GV chính",
  SESSION_STUDENT_COUNT: (count: number) => `Sĩ số: ${count} HS`,
  SESSION_PICKER_NOTE:
    "Giáo viên dạy thay được cấp quyền hồ sơ lớp 1 lần và tự động cập nhật nhật ký điểm danh trên tài khoản của người dạy thay.",

  CANDIDATE_TITLE: (subject: string) => `Đề xuất giáo viên bộ môn ${subject}`,
  CANDIDATE_DESC: "Sắp xếp theo độ tương thích chuyên môn và khoảng cách ca học",
  CANDIDATE_SAME_SUBJECT: "Cùng môn",
  CANDIDATE_NO_CONFLICT: "Không trùng lịch",
  CANDIDATE_TODAY_LOAD: (count: number) => `Hôm nay: ${count} buổi`,
  CANDIDATE_RATING: (rating: number) => `Đánh giá: ${rating}/5.0`,
  CANDIDATE_CONFLICT: "Trùng giờ",
  CANDIDATE_SELECT: "Chọn thay",
  CANDIDATE_SELECTED: "Đang chọn",
  CANDIDATE_EMPTY: "Không có giáo viên nào phù hợp cho buổi này",

  CONFIRM_TITLE: "Thông tin xác nhận điều phối",
  FIELD_REASON: "Lý do điều phối dạy thay",
  FIELD_REASON_PLACEHOLDER:
    "Vd: Giáo viên chính báo nghỉ ốm đột xuất, cần xếp người thay trong ngày.",
  NOTIFY_TEACHER: "Tự động gửi thông báo SMS & Email cho giáo viên dạy thay",
  NOTIFY_TEACHER_HINT: "Gửi kèm giáo án điện tử lộ trình bài giảng của buổi học",
  NOTIFY_PARENTS: "Thông báo đến Phụ huynh / Học sinh lớp",
  NOTIFY_PARENTS_HINT: "Hiển thị trên giao diện phụ trách buổi học trên ứng dụng EduGrade",
  CANCEL: "Hủy bỏ",
  PRINT_HANDOVER: "In phiếu bàn giao",
  CONFIRM_SUBMIT: "Xác nhận xếp dạy thay",
  ASSIGN_SUCCESS: (teacherName: string) => `Đã xếp ${teacherName} dạy thay buổi này`,
  SELECT_SESSION_FIRST: "Chọn buổi học trước khi xếp dạy thay",

  HISTORY_TITLE: "Lịch sử dạy thay gần đây",
  HISTORY_DESC: "Danh sách ghi nhận các ca đổi, dạy thay trong 30 ngày qua",
  HISTORY_SEARCH_PLACEHOLDER: "Tìm theo lớp, GV...",
  HISTORY_COL_SESSION: "Buổi học",
  HISTORY_COL_MAIN: "Giáo viên chính thức",
  HISTORY_COL_SUBSTITUTE: "Giáo viên dạy thay",
  HISTORY_COL_REASON: "Lý do dạy thay",
  HISTORY_COL_ASSIGNER: "Người xếp lịch",
  HISTORY_COL_TIME: "Thời gian",
  HISTORY_COL_STATUS: "Trạng thái",
  HISTORY_STATUS_CONFIRMED: "Đã hoàn thành",
  HISTORY_STATUS_PENDING: "Đã xác nhận",
  HISTORY_STATUS_CANCELLED: "Đã hủy",
  HISTORY_EMPTY: "Chưa có lượt dạy thay nào",
  SUBSTITUTE_BADGE: "GV dạy thay",

  // Đổi giáo viên phụ trách (modal trên Chi tiết lớp)
  CHANGE_MODAL_TITLE: (className: string) => `Đổi giáo viên phụ trách – Lớp ${className}`,
  CHANGE_MODAL_DESC: "Cập nhật thể xế phân công giảng dạy dài hạn",
  CHANGE_CURRENT_LABEL: "Giáo viên phụ trách hiện tại",
  CHANGE_CURRENT_SINCE: (subject: string, date: string) => `Môn ${subject} · Từ ${date}`,
  CHANGE_FIELD_TEACHER: "Chọn giáo viên thay thế dài hạn cho lớp",
  CHANGE_FIELD_TEACHER_PLACEHOLDER: "Chọn giáo viên",
  CHANGE_AVAILABILITY_TITLE: "Khả năng tiếp nhận lịch: Phù hợp",
  CHANGE_AVAILABILITY_OK: (teacher: string, schedule: string) =>
    `${teacher} hoàn toàn KHÔNG bị trùng lịch với khung ${schedule}. Giáo viên đủ điều kiện nhận lớp.`,
  CHANGE_AVAILABILITY_CONFLICT_TITLE: "Cảnh báo trùng lịch giảng dạy",
  CHANGE_AVAILABILITY_CONFLICT: (teacher: string, schedule: string) =>
    `${teacher} đang có lớp trùng khung ${schedule}. Cần điều chỉnh lịch trước khi bàn giao.`,
  CHANGE_FIELD_DATE: "Ngày bắt đầu áp dụng",
  CHANGE_FIELD_DATE_HINT: (count: number) =>
    `Tất cả ${count} buổi học từ ngày này trở đi sẽ do giáo viên mới phụ trách điểm danh.`,
  CHANGE_FIELD_REASON: "Lý do thay đổi giáo viên",
  CHANGE_FIELD_REASON_PLACEHOLDER:
    "Vd: Giáo viên chính tập trung bồi dưỡng đội tuyển học sinh giỏi Khối 9, bàn giao lớp đến hết học kỳ I.",
  CHANGE_NOTIFY_TEACHER: "Tự động gửi email thông báo bàn giao tiến độ và danh sách học sinh cho giáo viên mới",
  CHANGE_NOTIFY_PARENTS: "Gửi tin nhắn thông báo cập nhật thời khóa biểu và giáo viên mới tới phụ huynh",
  CHANGE_SUBMIT: "Xác nhận đổi giáo viên",
  CHANGE_SUCCESS: (teacher: string, count: number) =>
    `Đã bàn giao lớp cho ${teacher}, cập nhật ${count} buổi học`,

  // Gán giáo viên cho lớp CHƯA có giáo viên (cùng modal, chế độ "assign")
  CLASS_ASSIGN_MODAL_TITLE: (className: string) => `Gán giáo viên phụ trách – Lớp ${className}`,
  CLASS_ASSIGN_MODAL_DESC: "Lớp chưa có giáo viên. Chọn giáo viên phù hợp với lịch cố định của lớp — giáo viên sẽ dạy đúng các buổi này, không tự chọn lịch.",
  CLASS_ASSIGN_CURRENT_EMPTY: "Chưa có giáo viên phụ trách",
  CLASS_ASSIGN_FIELD_TEACHER: "Chọn giáo viên phụ trách lớp",
  CLASS_ASSIGN_FIELD_DATE: "Bắt đầu dạy từ ngày",
  CLASS_ASSIGN_FIELD_DATE_HINT: (count: number) =>
    `Tất cả ${count} buổi học từ ngày này trở đi sẽ do giáo viên này phụ trách và điểm danh.`,
  CLASS_ASSIGN_DEFAULT_REASON: "Gán giáo viên phụ trách lần đầu",
  CLASS_ASSIGN_NOTIFY_TEACHER: "Gửi email thông báo lịch dạy và danh sách học sinh cho giáo viên",
  CLASS_ASSIGN_SUBMIT: "Xác nhận gán giáo viên",
  CLASS_ASSIGN_SUCCESS: (teacher: string, count: number) =>
    `Đã gán ${teacher} phụ trách lớp, cập nhật ${count} buổi học`,
} as const
