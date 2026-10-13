import { apiRequest } from "@/lib/api/client";
import {
  acceptInvitationPayloadSchema,
  changePasswordPayloadSchema,
  forgotPasswordSchema,
  profileSchema,
  resetPasswordPayloadSchema,
} from "@/lib/validators/auth";
import type { AuthUser } from "@/types/auth";

/** Self-service account commands. Public ones go through the BFF without a session. */
export const accountApi = {
  updateProfile: (body: unknown) =>
    apiRequest<AuthUser>("auth/me", {
      method: "PATCH",
      body: profileSchema.parse(body),
    }),
  changePassword: (body: unknown) =>
    apiRequest<{ changed: true }>("auth/change-password", {
      method: "POST",
      body: changePasswordPayloadSchema.parse(body),
    }),
  forgotPassword: (body: unknown) =>
    apiRequest<{ accepted: true }>("auth/forgot-password", {
      method: "POST",
      body: forgotPasswordSchema.parse(body),
    }),
  resetPassword: (body: unknown) =>
    apiRequest<{ reset: true }>("auth/reset-password", {
      method: "POST",
      body: resetPasswordPayloadSchema.parse(body),
    }),
  acceptInvitation: (body: unknown) =>
    apiRequest<{ id: string; email: string; status: string }>(
      "account-invitations/accept",
      { method: "POST", body: acceptInvitationPayloadSchema.parse(body) },
    ),
};
