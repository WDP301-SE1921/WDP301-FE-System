export const PARENT_MSG = {
  // Danh sách
  LIST_TITLE: "Phụ huynh",
  LIST_DESC: "Mỗi tài khoản phụ huynh quản lý một hoặc nhiều hồ sơ con",
  SEARCH_PLACEHOLDER: "Tìm email, số điện thoại phụ huynh...",

  // KPI
  KPI_TOTAL: "Tổng phụ huynh",
  KPI_TOTAL_SUB: "Tài khoản quản lý hệ thống",
  KPI_ACTIVATED: "Đã kích hoạt",
  KPI_ACTIVATED_SUB: "Sử dụng EduGrade Portal",
  KPI_DISABLED: "Đã khóa",
  KPI_DISABLED_SUB: "Trung tâm đã khóa tài khoản",
  KPI_RATIO: "Tỷ lệ con / PH",
  KPI_RATIO_SUB: (total: number) => `Tổng cộng ${total} học sinh`,

  // Cột bảng
  COL_EMAIL: "Email tài khoản",
  COL_PHONE: "Số điện thoại",
  COL_CHILDREN: "Số con & danh sách hồ sơ con",
  COL_STATUS: "Trạng thái",
  COL_CREATED_AT: "Ngày tạo",
  CHILD_COUNT: (count: number) => `${count} con`,

  // Bộ lọc
  FILTER_ALL_STATUS: "Trạng thái: Tất cả",
  FILTER_ALL_CHILD_COUNT: "Số lượng con: Tất cả",
  FILTER_CHILD_COUNT: (count: number) => `${count} con`,
  FILTER_CHILD_COUNT_MANY: "3 con trở lên",

  // Hành động
  ACTION_VIEW_DETAIL: "Xem chi tiết hồ sơ",
  ACTION_ENROLL: "Đăng ký học",
  ACTION_LOCK_ACCOUNT: "Khóa tài khoản",
  ACTION_UNLOCK_ACCOUNT: "Mở khóa tài khoản",
  ACTION_EDIT_CONTACT: "Sửa liên hệ",

  // Chi tiết
  DETAIL_TITLE: "Chi tiết phụ huynh",
  DETAIL_DESC: "Quản lý tài khoản phụ huynh, hồ sơ các con và lịch sử giao tiếp",
  ACTION_EDIT: "Chỉnh sửa thông tin",

  INFO_EMAIL: "Hộp thư liên hệ",
  INFO_PHONE: "Số điện thoại",
  INFO_STATUS: "Trạng thái tài khoản",
  INFO_ACTIVATED_AT: "Thời gian kích hoạt",
  INFO_CHILD_COUNT: "Số con liên kết",

  CHILDREN_SECTION_TITLE: "Hồ sơ con",
  CHILDREN_SECTION_DESC:
    "Các học sinh đang theo học tại trung tâm thuộc quyền quản lý của tài khoản này",
  CHILD_VIEW_PROFILE: "Xem hồ sơ học sinh",
  CHILD_GRADE: (grade: number) => `Khối ${grade}`,

  EMAIL_SECTION_TITLE: "Lịch sử thông báo & Email gần đây",
  EMAIL_SECTION_DESC: "Ghi nhận thông báo gửi tự động từ hệ thống và giáo viên",
  EMAIL_SEND: "Gửi email",
  EMAIL_RESEND: "Gửi lại",

  RULE_NOTE_TITLE: "Quy tắc tài khoản phụ huynh",
  RULE_NOTE_DESC:
    "Phụ huynh tự đăng ký tài khoản và tạo hồ sơ con trên ứng dụng EduGrade — trung tâm không tạo tài khoản hay đặt mật khẩu thay phụ huynh. Mỗi phụ huynh dùng duy nhất 01 email làm định danh; số điện thoại chỉ để liên hệ, không cần duy nhất. Khi trung tâm đăng ký lớp cho một hồ sơ con, lịch học và biên lai tự đồng bộ lên ứng dụng.",

  // Sửa liên hệ / khóa tài khoản (admin, quản lý trung tâm)
  CONTACT_MODAL_TITLE: "Sửa thông tin liên hệ",
  CONTACT_MODAL_DESC: "Chỉ số điện thoại sửa được trên web — email là định danh đăng nhập do phụ huynh tự quản lý trên ứng dụng.",
  CONTACT_EMAIL_HINT: "Email không thể thay đổi",
  CONTACT_UPDATE_SUCCESS: "Đã cập nhật thông tin liên hệ",
  LOCK_CONFIRM_TITLE: "Khóa tài khoản phụ huynh?",
  LOCK_CONFIRM_DESC: (email: string) =>
    `${email} sẽ không thể được đăng ký học mới cho đến khi mở khóa. Các lớp đang học không bị ảnh hưởng.`,
  LOCK_SUCCESS: (email: string) => `Đã khóa tài khoản ${email}`,
  UNLOCK_CONFIRM_TITLE: "Mở khóa tài khoản phụ huynh?",
  UNLOCK_CONFIRM_DESC: (email: string) => `${email} sẽ có thể được đăng ký học mới trở lại.`,
  UNLOCK_SUCCESS: (email: string) => `Đã mở khóa tài khoản ${email}`,

  NOT_FOUND_TITLE: "Không tìm thấy phụ huynh",
  NOT_FOUND_DESC: "Tài khoản phụ huynh này không tồn tại hoặc đã bị xóa khỏi hệ thống.",

  EXPORT_SUCCESS: "Đã xuất danh sách phụ huynh",
} as const
