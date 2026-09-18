import { BUSINESS_RULES } from "@/constants/business-rules"

export const LINK_CODE_MSG = {
  TITLE: "Link / mã liên kết",
  DESC: `Phụ huynh dùng link/mã để tạo tài khoản hoặc liên kết hồ sơ con. Mỗi mã dùng 1 lần, hết hạn sau ${BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS} ngày.`,
  PENDING_BADGE: (count: number) => `${count} mã còn lại`,
  CREATE: "Tạo link / mã mới",
  SEARCH_PLACEHOLDER: "Tìm mã, tên con, email, SĐT...",
  AUTO_RENEW_NOTE: "Tự động làm mới sau mỗi 60 giây",

  // KPI
  KPI_TOTAL: "Tổng mã đã phát hành",
  KPI_TOTAL_SUB: "mã tích lũy",
  KPI_UNUSED: "Chưa dùng (theo dõi)",
  KPI_UNUSED_SUB: "Cần nhắc",
  KPI_UNUSED_NOTE: (days: number) => `Mã sắp chạm mốc ${days} ngày`,
  KPI_ACTIVATED: "Đã kích hoạt",
  KPI_ACTIVATED_SUB: (percent: number) => `${percent}% tỷ lệ`,
  KPI_EXPIRED: (days: number) => `Đã quá hạn ${days} ngày`,
  KPI_EXPIRED_SUB: "Cần cấp mới",
  KPI_EXPIRED_NOTE: "Phụ huynh chưa mở mã liên kết",

  // Tabs
  TAB_UNUSED: "Chưa dùng",
  TAB_USED: "Đã dùng",
  TAB_EXPIRED: "Hết hạn",
  TAB_ALL: "Tất cả",

  // Cột bảng
  COL_CODE: "Mã liên kết",
  COL_STUDENT: "Học sinh",
  COL_PARENT: "Phụ huynh liên hệ",
  COL_SUBJECT: "Môn / Lớp",
  COL_CREATED_AT: "Ngày tạo",
  COL_EXPIRES: "Thời hạn",
  COL_STATUS: "Trạng thái",

  STATUS_PENDING_ACTIVATION: "Chờ kích hoạt",
  STATUS_SENT_EMAIL: "Đã gửi email",
  EXPIRED_TODAY: "Hết hạn hôm nay",

  // Hành động
  ACTION_COPY: "Sao chép mã",
  ACTION_RESEND: "Gửi lại email",
  ACTION_REGENERATE: "Tạo mã mới",
  RESEND_SUCCESS: "Đã gửi lại email chứa mã liên kết",
  REGENERATE_SUCCESS: "Đã tạo mã liên kết mới",
  CREATE_SUCCESS: "Đã tạo link / mã liên kết",
  EXPORT_SUCCESS: "Đã xuất danh sách mã liên kết",

  // Ghi chú cuối trang
  NOTE_TITLE: "Quy trình bảo mật mã kích hoạt một lần (One-Time Token)",
  NOTE_1_TITLE: "1. Xác thực độc quyền 1:1",
  NOTE_1_DESC:
    "Mỗi mã sinh ra chỉ khớp đúng 1 học sinh và 1 thông tin phụ huynh. Sau khi phụ huynh hoàn tất kích hoạt, mã lập tức vô hiệu.",
  NOTE_2_TITLE: (days: number) => `2. Giới hạn ${days} ngày lưu hành`,
  NOTE_2_DESC:
    "Nếu phụ huynh không kích hoạt trong thời hạn, mã tự động đưa vào trạng thái Hết hạn và quản lý cần cấp lại mã mới.",
  NOTE_3_TITLE: "3. Đăng nhập nhanh qua QR Portal",
  NOTE_3_DESC:
    "Phụ huynh có thể quét mã QR trên điện thoại để truy cập tự động vào cổng thông tin, không cần nhập tay mã liên kết.",
} as const
