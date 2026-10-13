export const SYSTEM_MSG = {
  // ---------- Nhân sự trung tâm (PROMPT 14) ----------
  STAFF_TITLE: "Nhân sự trung tâm",
  STAFF_DESC: "Tài khoản đăng nhập web của quản lý trung tâm, thiết kế giáo trình và nhân viên",
  STAFF_BADGE: (active: number, pending: number) =>
    `${active} đang hoạt động · ${pending} chờ kích hoạt`,
  SEARCH_PLACEHOLDER: "Tìm theo tên, email...",
  FILTER_ALL_ROLES: "Vai trò: Tất cả",

  COL_STAFF: "Nhân sự",
  COL_ROLE: "Vai trò",
  COL_EMAIL: "Email",
  COL_STATUS: "Trạng thái",
  COL_JOINED: "Ngày tham gia",

  YOU_BADGE: "Bạn",

  ACTION_INVITE: "Mời nhân sự",
  ACTION_RESEND_INVITE: "Gửi lại lời mời",
  ACTION_DEACTIVATE: "Vô hiệu hóa",

  RESEND_INVITE_SUCCESS: (email: string) => `Đã gửi lại lời mời tới ${email}`,
  DEACTIVATE_SUCCESS: (name: string) => `Đã vô hiệu hóa tài khoản ${name}`,

  DEACTIVATE_CONFIRM_TITLE: "Vô hiệu hóa tài khoản nhân sự?",
  DEACTIVATE_CONFIRM_DESC: (name: string) =>
    `${name} sẽ không thể đăng nhập vào hệ thống cho đến khi được kích hoạt lại.`,

  CANNOT_DEACTIVATE_SELF: "Không thể tự vô hiệu hóa tài khoản của chính mình",
  INVITE_EMAIL_EXISTS: (email: string) =>
    `Email ${email} đã tồn tại trong danh sách nhân sự`,
  INVITE_ROLE_FORBIDDEN: "Bạn không có quyền mời tài khoản với vai trò này",

  // Modal mời nhân sự
  INVITE_MODAL_TITLE: "Mời nhân sự",
  INVITE_MODAL_DESC:
    "Gửi lời mời qua email để nhân sự mới tự kích hoạt tài khoản EduGrade. Vai trò quyết định các màn hình được truy cập.",
  INVITE_FIELD_EMAIL: "Email nhân sự",
  INVITE_FIELD_NAME: "Họ và tên",
  INVITE_FIELD_ROLE: "Vai trò",
  INVITE_FIELD_ROLE_PLACEHOLDER: "Chọn vai trò",
  INVITE_SUBMIT: "Gửi lời mời",
  INVITE_SUCCESS: (email: string) => `Đã gửi lời mời tới ${email}`,

  // ---------- Lịch sử thay đổi (PROMPT 14B) ----------
  AUDIT_TITLE: "Lịch sử thay đổi",
  AUDIT_DESC: "Theo dõi toàn bộ thao tác quan trọng của nhân sự trung tâm trên hệ thống",
  AUDIT_SEARCH_PLACEHOLDER: "Tìm theo tên đối tượng...",
  AUDIT_FILTER_ALL_ACTIONS: "Tất cả loại thao tác",
  AUDIT_FILTER_ALL_ACTORS: "Tất cả người thực hiện",
  AUDIT_FILTER_ACTION_TYPE: "Loại thao tác",
  AUDIT_FILTER_ACTOR: "Người thực hiện",

  AUDIT_COL_TIME: "Thời gian",
  AUDIT_COL_ACTOR: "Người thực hiện",
  AUDIT_COL_ACTION: "Hành động",
  AUDIT_COL_TARGET: "Đối tượng",
  AUDIT_COL_CHANGE: "Thay đổi",

  AUDIT_EXPAND: "Xem chi tiết",
  AUDIT_DETAIL_REASON: "Lý do",
  AUDIT_DETAIL_EFFECTIVE_DATE: "Ngày áp dụng",
  AUDIT_DETAIL_IP: "IP",

  AUDIT_EMPTY_TITLE: "Chưa có lịch sử thay đổi",
  AUDIT_EMPTY_DESC: "Chưa ghi nhận thao tác nào phù hợp với bộ lọc hiện tại",

  // ---------- Tài khoản cá nhân (PROMPT 15) ----------
  PROFILE_TITLE: "Tài khoản",
  TAB_INFO: "Thông tin cá nhân",
  TAB_PASSWORD: "Đổi mật khẩu",

  CHANGE_PHOTO: "Đổi ảnh",
  FIELD_NAME: "Họ tên",
  FIELD_EMAIL: "Email",
  FIELD_PHONE: "Số điện thoại",
  EMAIL_DISABLED_HINT: "Email đăng nhập không thể thay đổi",
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
