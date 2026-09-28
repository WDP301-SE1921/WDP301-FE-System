import { z } from "zod"
import { FIELD_LIMITS, REGEX } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

export const inviteManagerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.EMAIL_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX))
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.FULL_NAME_MIN, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
})

export type InviteManagerFormInput = z.infer<typeof inviteManagerSchema>

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.FULL_NAME_MIN, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  phone: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .regex(REGEX.PHONE_VN, VALIDATION_MSG.INVALID_PHONE),
})

export type UpdateProfileFormInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MSG.REQUIRED),
    newPassword: z
      .string()
      .min(FIELD_LIMITS.PASSWORD_MIN, VALIDATION_MSG.PASSWORD_WEAK)
      .max(FIELD_LIMITS.PASSWORD_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.PASSWORD_MAX))
      .regex(REGEX.PASSWORD_STRONG, VALIDATION_MSG.PASSWORD_WEAK),
    confirmPassword: z.string().min(1, VALIDATION_MSG.REQUIRED),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: VALIDATION_MSG.PASSWORD_NOT_MATCH,
  })

export type ChangePasswordFormInput = z.infer<typeof changePasswordSchema>
