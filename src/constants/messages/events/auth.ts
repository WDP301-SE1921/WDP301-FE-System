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

  // ---------- Phụ huynh tự đăng ký ----------
  REGISTER_TITLE: "Đăng ký tài khoản phụ huynh",
  REGISTER_DESC: "Tự tạo tài khoản bằng email và mật khẩu, sau đó tạo hồ sơ con trên ứng dụng.",
  REGISTER_SUBMIT: "Đăng ký tài khoản",
  REGISTER_SUCCESS: "Đã tạo tài khoản phụ huynh",
  REGISTER_NEXT: "Mở ứng dụng EduGrade, đăng nhập bằng tài khoản vừa tạo và tạo hồ sơ con. Kiểm tra email để xác minh tài khoản trước khi tạo hồ sơ theo yêu cầu của máy chủ.",

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
