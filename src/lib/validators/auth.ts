import { z } from "zod"
import { FIELD_LIMITS, REGEX } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.EMAIL_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX))
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
  password: z
    .string()
    .min(1, VALIDATION_MSG.REQUIRED)
    .min(
      FIELD_LIMITS.PASSWORD_MIN,
      VALIDATION_MSG.MIN_LENGTH(FIELD_LIMITS.PASSWORD_MIN)
    )
    .max(
      FIELD_LIMITS.PASSWORD_MAX,
      VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.PASSWORD_MAX)
    ),
  rememberMe: z.boolean(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.EMAIL_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX))
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const activateAccountSchema = z
  .object({
    /** Token của lời mời, lấy từ query string — không hiển thị ra UI. */
    token: z.string().min(1, VALIDATION_MSG.REQUIRED),
    fullName: z
      .string()
      .trim()
      .min(1, VALIDATION_MSG.REQUIRED)
      .min(
        FIELD_LIMITS.FULL_NAME_MIN,
        VALIDATION_MSG.MIN_LENGTH(FIELD_LIMITS.FULL_NAME_MIN)
      )
      .max(
        FIELD_LIMITS.FULL_NAME_MAX,
        VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)
      ),
    password: z
      .string()
      .min(1, VALIDATION_MSG.REQUIRED)
      .min(FIELD_LIMITS.PASSWORD_MIN, VALIDATION_MSG.PASSWORD_WEAK)
      .max(
        FIELD_LIMITS.PASSWORD_MAX,
        VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.PASSWORD_MAX)
      )
      .regex(REGEX.PASSWORD_STRONG, VALIDATION_MSG.PASSWORD_WEAK),
    confirmPassword: z.string().min(1, VALIDATION_MSG.REQUIRED),
    hasAcceptedTerms: z
      .boolean()
      .refine((value) => value, VALIDATION_MSG.TERMS_REQUIRED),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: VALIDATION_MSG.PASSWORD_NOT_MATCH,
  })

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
