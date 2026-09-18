export const PARENT_MSG = {
  // Danh sách
  LIST_TITLE: "Phụ huynh",
  LIST_DESC: "Mỗi tài khoản phụ huynh quản lý một hoặc nhiều hồ sơ con",
  SEARCH_PLACEHOLDER: "Tìm email, số điện thoại phụ huynh...",
  ADD_PARENT: "Thêm phụ huynh",

  // KPI
  KPI_TOTAL: "Tổng phụ huynh",
  KPI_TOTAL_SUB: "Tài khoản quản lý hệ thống",
  KPI_ACTIVATED: "Đã kích hoạt",
  KPI_ACTIVATED_SUB: "Sử dụng EduGrade Portal",
  KPI_PENDING: "Chờ liên kết",
  KPI_PENDING_SUB: "Chưa quét mã hoặc xác thực",
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
  ACTION_RESEND_ACTIVATION: "Gửi lại mã kích hoạt",
  ACTION_ADD_CHILD: "Thêm hồ sơ con",
  ACTION_LOCK_ACCOUNT: "Khóa tài khoản",

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

  LINK_SECTION_TITLE: "Link & Mã liên kết tài khoản",
  LINK_SECTION_DESC: "Dùng để phụ huynh quét hoặc nhập vào ứng dụng di động",
  LINK_COL_CODE: "Mã liên kết",
  LINK_COL_CHILD: "Học sinh / Lớp",
  LINK_COL_EXPIRES: "Hết hạn",
  LINK_COL_STATUS: "Trạng thái",
  LINK_RESEND: "Gửi lại",
  LINK_NOTE_TITLE: "Tự động đồng bộ ứng dụng",
  LINK_NOTE_DESC:
    "Khi phụ huynh kích hoạt tài khoản bằng mã này, toàn bộ dữ liệu chuyên cần và điểm thi sẽ tự động thông báo qua ứng dụng EduGrade Parent.",

  EMAIL_SECTION_TITLE: "Lịch sử thông báo & Email gần đây",
  EMAIL_SECTION_DESC: "Ghi nhận thông báo gửi tự động từ hệ thống và giáo viên",
  EMAIL_SEND: "Gửi email",
  EMAIL_RESEND: "Gửi lại",

  RULE_NOTE_TITLE: "Quy tắc định danh tài khoản phụ huynh",
  RULE_NOTE_DESC:
    "Mỗi phụ huynh sử dụng duy nhất 01 email để làm mã định danh trên cổng thông tin EduGrade. Số điện thoại chỉ dùng để liên hệ, không cần duy nhất. Khi phụ huynh kích hoạt tài khoản qua đường dẫn email hoặc quét mã QR trung tâm cung cấp, toàn bộ hồ sơ của các con sẽ tự động liên kết đồng bộ lịch học, bảng điểm và biên lai học phí từng tháng.",

  NOT_FOUND_TITLE: "Không tìm thấy phụ huynh",
  NOT_FOUND_DESC: "Tài khoản phụ huynh này không tồn tại hoặc đã bị xóa khỏi hệ thống.",

  EXPORT_SUCCESS: "Đã xuất danh sách phụ huynh",
} as const
