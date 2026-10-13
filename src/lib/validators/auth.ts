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

/** BE accepts 8–72 characters and bcrypt reads at most 72 UTF-8 bytes. */
const accountPassword = z
  .string()
  .min(8, VALIDATION_MSG.MIN_LENGTH(8))
  .max(72, VALIDATION_MSG.MAX_LENGTH(72))
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Mật khẩu tối đa 72 byte UTF-8.",
  );
const displayName = z
  .string()
  .trim()
  .min(1, VALIDATION_MSG.REQUIRED)
  .max(255, VALIDATION_MSG.MAX_LENGTH(255));
const oneTimeToken = z
  .string()
  .trim()
  .min(1, VALIDATION_MSG.REQUIRED)
  .max(512, VALIDATION_MSG.MAX_LENGTH(512));
const matchingPassword = (field: "newPassword" | "password") => ({
  check: (value: Record<string, unknown>) =>
    value[field] === value.confirmPassword,
  issue: {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp.",
  },
});

/** PATCH /auth/me for web staff: only the display name (phone belongs to parents). */
export const profileSchema = z.object({ displayName }).strict();
export const changePasswordPayloadSchema = z
  .object({ currentPassword: accountPassword, newPassword: accountPassword })
  .strict();
export const changePasswordSchema = z
  .object({
    currentPassword: accountPassword,
    newPassword: accountPassword,
    confirmPassword: z.string(),
  })
  .refine(
    matchingPassword("newPassword").check,
    matchingPassword("newPassword").issue,
  )
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  });
export const resetPasswordPayloadSchema = z
  .object({ token: oneTimeToken, newPassword: accountPassword })
  .strict();
export const resetPasswordSchema = z
  .object({
    token: oneTimeToken,
    newPassword: accountPassword,
    confirmPassword: z.string(),
  })
  .refine(
    matchingPassword("newPassword").check,
    matchingPassword("newPassword").issue,
  );
export const acceptInvitationPayloadSchema = z
  .object({ token: oneTimeToken, displayName, password: accountPassword })
  .strict();
export const acceptInvitationSchema = z
  .object({
    token: oneTimeToken,
    displayName,
    password: accountPassword,
    confirmPassword: z.string(),
  })
  .refine(
    matchingPassword("password").check,
    matchingPassword("password").issue,
  );

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
