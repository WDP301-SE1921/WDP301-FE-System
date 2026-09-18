import { z } from "zod"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { FIELD_LIMITS, REGEX } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Ba luồng đăng ký theo `.claude/skills/enrollment-flow` — A1 con đầu tiên,
 * A2 thêm con cho phụ huynh đã có, A3 thêm môn cho con cũ. Một schema chung, các
 * field bắt buộc khác nhau theo `registrationType` (kiểm tra ở `superRefine`).
 */
export const REGISTRATION_TYPE = {
  FIRST_CHILD: "first_child",
  ADDITIONAL_CHILD: "additional_child",
  ADDITIONAL_SUBJECT: "additional_subject",
} as const

export type RegistrationType =
  (typeof REGISTRATION_TYPE)[keyof typeof REGISTRATION_TYPE]

export const enrollmentSchema = z
  .object({
    registrationType: z.enum([
      REGISTRATION_TYPE.FIRST_CHILD,
      REGISTRATION_TYPE.ADDITIONAL_CHILD,
      REGISTRATION_TYPE.ADDITIONAL_SUBJECT,
    ]),

    // A1 + A2 — hồ sơ con mới
    studentName: z.string().trim().max(FIELD_LIMITS.FULL_NAME_MAX),
    grade: z.string(),

    // A1 — phụ huynh mới
    parentEmail: z.string().trim().max(FIELD_LIMITS.EMAIL_MAX),
    parentPhone: z.string().trim(),

    // A2 — phụ huynh đã có
    parentAccountId: z.string(),

    // A3 — học sinh đã có hồ sơ
    studentProfileId: z.string(),

    // Bước 3
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
  .superRefine((values, ctx) => {
    const requireStudentName = () => {
      if (values.studentName.length < FIELD_LIMITS.FULL_NAME_MIN) {
        ctx.addIssue({
          code: "custom",
          path: ["studentName"],
          message: VALIDATION_MSG.REQUIRED,
        })
      }
      if (!values.grade) {
        ctx.addIssue({ code: "custom", path: ["grade"], message: VALIDATION_MSG.REQUIRED })
      }
    }

    if (values.registrationType === REGISTRATION_TYPE.FIRST_CHILD) {
      requireStudentName()

      if (!REGEX.EMAIL.test(values.parentEmail)) {
        ctx.addIssue({
          code: "custom",
          path: ["parentEmail"],
          message: values.parentEmail
            ? VALIDATION_MSG.INVALID_EMAIL
            : VALIDATION_MSG.REQUIRED,
        })
      }

      if (!REGEX.PHONE_VN.test(values.parentPhone.replace(/\s/g, ""))) {
        ctx.addIssue({
          code: "custom",
          path: ["parentPhone"],
          message: values.parentPhone
            ? VALIDATION_MSG.INVALID_PHONE
            : VALIDATION_MSG.REQUIRED,
        })
      }
    }

    if (values.registrationType === REGISTRATION_TYPE.ADDITIONAL_CHILD) {
      requireStudentName()

      if (!values.parentAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["parentAccountId"],
          message: VALIDATION_MSG.REQUIRED,
        })
      }
    }

    if (values.registrationType === REGISTRATION_TYPE.ADDITIONAL_SUBJECT) {
      if (!values.studentProfileId) {
        ctx.addIssue({
          code: "custom",
          path: ["studentProfileId"],
          message: VALIDATION_MSG.REQUIRED,
        })
      }
    }
  })

export type EnrollmentInput = z.infer<typeof enrollmentSchema>

/** Field cần validate ở từng bước, dùng cho `trigger()` của react-hook-form. */
export const ENROLLMENT_STEP_FIELDS: Record<number, (keyof EnrollmentInput)[]> = {
  0: ["registrationType"],
  1: [
    "studentName",
    "grade",
    "parentEmail",
    "parentPhone",
    "parentAccountId",
    "studentProfileId",
  ],
  2: ["subjectId", "classId"],
  3: ["months", "hasReceivedPayment"],
}
