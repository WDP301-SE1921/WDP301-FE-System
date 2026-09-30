import { BUSINESS_RULES } from "@/constants/business-rules"
import { FIELD_LIMITS } from "@/constants/validation"

export const AUTH_MSG = {
  // ---------- Chung cho panel trái (AuthLayout) ----------
  BRAND_TITLE_LEAD: "Quản lý trung tâm dạy thêm",
  BRAND_TITLE_HIGHLIGHT: "dễ dàng hơn",
  TERMS_OF_SERVICE: "Điều khoản dịch vụ",
  SUPPORT_CENTER: "Trung tâm hỗ trợ",

  // ---------- Đăng nhập ----------
  LOGIN_TITLE: "Đăng nhập",
  LOGIN_DESC: "Dành cho nhân sự trung tâm và Giáo viên",
  LOGIN_BRAND_TITLE: "Quản lý trung tâm dạy thêm dễ dàng hơn",
  LOGIN_BRAND_DESC:
    "Nền tảng số hóa toàn diện cho nhân sự trung tâm và Giáo viên: quản trị lớp học, điều phối phòng học, quản lý phụ huynh & học sinh trong một cổng.",
  LOGIN_ILLUSTRATION_BADGE: "Đăng nhập tự động",
  LOGIN_ILLUSTRATION_TITLE: "Vận hành thông minh & chính xác",
  LOGIN_ILLUSTRATION_DESC:
    "Mọi buổi học, điểm danh và kết quả học tập được ghi nhận tập trung, truy xuất bất cứ lúc nào.",

  // ---------- Quên mật khẩu ----------
  FORGOT_TITLE: "Quên mật khẩu",
  FORGOT_DESC: "Nhập email để nhận link đặt lại mật khẩu",
  FORGOT_BRAND_DESC:
    "Hệ thống bảo mật đa lớp giúp khôi phục tài khoản nhân sự nhanh chóng, tránh gián đoạn các ca học và sổ điểm danh.",
  FORGOT_ILLUSTRATION_BADGE: "Bảo mật tài khoản một cổng",
  FORGOT_ILLUSTRATION_TITLE: "Khôi phục quyền truy cập nhanh",
  FORGOT_ILLUSTRATION_DESC: `Link đặt lại mật khẩu có thời hạn ${BUSINESS_RULES.PASSWORD_RESET_EXPIRY_MINUTES} phút và chỉ gửi tới email chính thức.`,
  FORGOT_EMAIL_LABEL: "Email tài khoản đã đăng ký",
  FORGOT_EMAIL_HINT: "Nhập chính xác email bạn dùng để đăng nhập trung tâm.",
  FORGOT_SUBMIT: "Gửi link đặt lại mật khẩu",
  FORGOT_RESUBMIT: "Gửi lại link đặt lại mật khẩu",
  FORGOT_SENT_TITLE: (email: string) => `Đã gửi email đặt lại mật khẩu tới ${email}`,
  FORGOT_SENT_DESC: `Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác) và làm theo hướng dẫn để thiết lập mật khẩu mới trong vòng ${BUSINESS_RULES.PASSWORD_RESET_EXPIRY_MINUTES} phút.`,
  FORGOT_EMAIL_NOT_FOUND: "Email này chưa được đăng ký trong hệ thống",

  // ---------- Kích hoạt tài khoản ----------
  ACTIVATE_TITLE: "Kích hoạt tài khoản",
  ACTIVATE_BADGE: "Lời mời tham gia thành viên",
  /** Dùng khi vai trò render thành Badge tách rời phần chữ. */
  ACTIVATE_INVITED_PREFIX: "Bạn được mời tham gia EduGrade với vai trò",
  ACTIVATE_BRAND_DESC:
    "Kích hoạt tài khoản chỉ trong 1 phút để tiếp nhận bàn giao lịch biểu, danh sách lớp học và hồ sơ phụ huynh.",
  ACTIVATE_ILLUSTRATION_BADGE: "Kích hoạt tài khoản thành viên",
  ACTIVATE_ILLUSTRATION_TITLE: "Chào mừng bạn đến với EduGrade",
  ACTIVATE_ILLUSTRATION_DESC:
    "Hoàn tất thiết lập thông tin bảo mật để truy cập quản lý các phân hệ lớp học & học sinh.",
  ACTIVATE_EMAIL_LABEL: "Email tài khoản",
  ACTIVATE_EMAIL_LOCKED: "Không thể sửa",
  ACTIVATE_FULL_NAME_LABEL: "Họ và tên",
  ACTIVATE_FULL_NAME_PLACEHOLDER: "Nguyễn Thị Lan",
  ACTIVATE_NEW_PASSWORD_LABEL: "Mật khẩu mới",
  ACTIVATE_NEW_PASSWORD_PLACEHOLDER: "Tạo mật khẩu an toàn",
  ACTIVATE_PASSWORD_HINT: `Gợi ý: Tối thiểu ${FIELD_LIMITS.PASSWORD_MIN} ký tự (bao gồm chữ hoa, chữ thường và số)`,
  ACTIVATE_CONFIRM_PASSWORD_LABEL: "Xác nhận mật khẩu",
  ACTIVATE_CONFIRM_PASSWORD_PLACEHOLDER: "Nhập lại mật khẩu mới",
  ACTIVATE_TERMS_PREFIX: "Tôi đồng ý với",
  ACTIVATE_TERMS_PRIVACY: "Điều khoản bảo mật",
  ACTIVATE_TERMS_CONJUNCTION: "và",
  ACTIVATE_TERMS_POLICY: "Quy chế nội bộ",
  ACTIVATE_TERMS_SUFFIX: "của EduGrade.",
  ACTIVATE_SUBMIT: "Kích hoạt tài khoản",
  ACTIVATE_SUCCESS: "Kích hoạt tài khoản thành công",
  ACTIVATE_ALREADY_DONE: "Đã kích hoạt trước đó?",
  ACTIVATE_GO_TO_LOGIN: "Đến trang Đăng nhập",
  ACTIVATE_INVALID_TOKEN_TITLE: "Lời mời không hợp lệ",
  ACTIVATE_INVALID_TOKEN_DESC:
    "Lời mời không tồn tại hoặc đã được sử dụng. Vui lòng liên hệ Quản trị viên để được gửi lại.",
  ACTIVATE_EXPIRED_TITLE: "Lời mời đã hết hạn",
  ACTIVATE_EXPIRED_DESC: `Link kích hoạt chỉ có hiệu lực trong ${BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS} ngày. Vui lòng liên hệ Quản trị viên để được gửi lại lời mời mới.`,

  // ---------- Label & placeholder field dùng chung ----------
  EMAIL_LABEL: "Địa chỉ Email",
  EMAIL_PLACEHOLDER: "lan.nguyen@edugrade.vn",
  PASSWORD_LABEL: "Mật khẩu",
  PASSWORD_PLACEHOLDER: "Nhập mật khẩu",
  PASSWORD_HINT: `Tối thiểu ${FIELD_LIMITS.PASSWORD_MIN} ký tự`,
  REMEMBER_ME: "Ghi nhớ đăng nhập",
  FORGOT_PASSWORD: "Quên mật khẩu?",
  SHOW_PASSWORD: "Hiện mật khẩu",
  HIDE_PASSWORD: "Ẩn mật khẩu",

  // ---------- Hành động ----------
  LOGIN_ACTION: "Đăng nhập",
  BACK_TO_LOGIN: "Quay lại đăng nhập",

  // ---------- Kết quả ----------
  LOGIN_SUCCESS: "Đăng nhập thành công",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng",
  ACCOUNT_DISABLED:
    "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Trưởng ban quản trị EduGrade",

  // ---------- Hỗ trợ ----------
  SUPPORT_HINT: "Bạn chưa có tài khoản hoặc cần đặt lại mật khẩu?",
  SUPPORT_CONTACT: "Vui lòng liên hệ Trưởng ban quản trị EduGrade: 0913 345 678",

  // ---------- Phiên đăng nhập hết hạn (overlay) ----------
  SESSION_EXPIRED_TITLE: "Phiên đăng nhập đã hết hạn",
  SESSION_EXPIRED_DESC: "Đăng nhập lại để tiếp tục, dữ liệu đang nhập sẽ được giữ.",
} as const
