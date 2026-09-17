import { FIELD_LIMITS } from "@/constants/validation"

export const VALIDATION_MSG = {
  REQUIRED: "Trường này là bắt buộc",
  INVALID_EMAIL: "Email không hợp lệ",
  INVALID_PHONE: "Số điện thoại không hợp lệ",
  MIN_LENGTH: (min: number) => `Tối thiểu ${min} ký tự`,
  MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự`,
  PASSWORD_WEAK: `Mật khẩu tối thiểu ${FIELD_LIMITS.PASSWORD_MIN} ký tự, gồm chữ hoa, chữ thường và số`,
  PASSWORD_NOT_MATCH: "Mật khẩu xác nhận không khớp",
  TERMS_REQUIRED: "Bạn cần đồng ý với điều khoản trước khi tiếp tục",
} as const
