/**
 * Regex và giới hạn độ dài field dùng chung cho Zod schema trong
 * `src/lib/validators/`. Message tương ứng nằm ở `messages/validation.ts`.
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_VN: /^(0|\+84)(3|5|7|8|9)\d{8}$/,
  /** Mật khẩu phải có đủ chữ hoa, chữ thường và số. */
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
} as const

export const FIELD_LIMITS = {
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  /** BE nhận 8–72 ký tự và bcrypt chỉ đọc 72 byte UTF-8; schema còn kiểm thêm số byte. */
  PASSWORD_MAX: 72,
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 100,
} as const
