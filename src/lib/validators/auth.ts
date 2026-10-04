import { z } from "zod";
import { FIELD_LIMITS, REGEX } from "@/constants/validation";
import { VALIDATION_MSG } from "@/constants/messages/validation";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(
      FIELD_LIMITS.EMAIL_MAX,
      VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX),
    )
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
  password: z
    .string()
    .min(1, VALIDATION_MSG.REQUIRED)
    .min(
      FIELD_LIMITS.PASSWORD_MIN,
      VALIDATION_MSG.MIN_LENGTH(FIELD_LIMITS.PASSWORD_MIN),
    )
    .max(
      FIELD_LIMITS.PASSWORD_MAX,
      VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.PASSWORD_MAX),
    )
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Mật khẩu tối đa 72 byte UTF-8.",
    ),
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(
      FIELD_LIMITS.EMAIL_MAX,
      VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX),
    )
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Matches POST /auth/register: parent chooses email and password. */
export const registerParentSchema = z
  .object({
    email: forgotPasswordSchema.shape.email.toLowerCase(),
    password: z
      .string()
      .min(8, VALIDATION_MSG.MIN_LENGTH(8))
      .max(128, VALIDATION_MSG.MAX_LENGTH(128))
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Mật khẩu tối đa 72 byte UTF-8.",
      ),
  })
  .strict();
export type RegisterParentInput = z.infer<typeof registerParentSchema>;
