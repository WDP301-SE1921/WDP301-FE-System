import { z } from "zod"
import { REGEX } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/** Field name khớp `ParentAccount` — chỉ `phone` sửa được trên web (email là định danh đăng nhập). */
export const parentContactSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    // Số điện thoại hiển thị có dấu cách ("0912 345 678") nên bỏ khoảng trắng trước khi kiểm tra.
    .refine((value) => REGEX.PHONE_VN.test(value.replace(/\s/g, "")), VALIDATION_MSG.INVALID_PHONE),
})

export type ParentContactFormInput = z.infer<typeof parentContactSchema>
