import { z } from "zod"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Luồng đăng ký duy nhất theo `.claude/skills/enrollment-flow`: nhân viên tra email phụ
 * huynh → chọn hồ sơ con (phụ huynh đã tạo sẵn trên mobile) → khối → môn → lớp → thu tiền.
 * Web không tạo phụ huynh hay hồ sơ con.
 */
export const enrollmentSchema = z.object({
  // Bước 1 — chọn phụ huynh từ kết quả tìm email.
  parentAccountId: z.string().min(1, VALIDATION_MSG.PARENT_LOOKUP_REQUIRED),

  // Bước 2 — hồ sơ con của phụ huynh
  studentProfileId: z.string().min(1, VALIDATION_MSG.CHILD_REQUIRED),

  // Bước 3 — khối (select nên là chuỗi), môn, lớp
  grade: z.string().min(1, VALIDATION_MSG.REQUIRED),
  subjectId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  classId: z.string().min(1, VALIDATION_MSG.REQUIRED),

  // Bước 4
  months: z
    .number()
    .int()
    .min(BUSINESS_RULES.ENROLLMENT_MONTHS_MIN, VALIDATION_MSG.MONTHS_RANGE)
    .max(BUSINESS_RULES.ENROLLMENT_MONTHS_MAX, VALIDATION_MSG.MONTHS_RANGE),
  hasReceivedPayment: z
    .boolean()
    .refine((value) => value, VALIDATION_MSG.PAYMENT_CONFIRM_REQUIRED),
})

export type EnrollmentInput = z.infer<typeof enrollmentSchema>

/** Field cần validate ở từng bước, dùng cho `trigger()` của react-hook-form. */
export const ENROLLMENT_STEP_FIELDS: Record<number, (keyof EnrollmentInput)[]> = {
  0: ["parentAccountId"],
  1: ["studentProfileId"],
  2: ["grade", "subjectId", "classId"],
  3: ["months", "hasReceivedPayment"],
}
