import { apiRequest, ApiError } from "@/lib/api/client";
import {
  avatarFileSchema,
  avatarUrlResponseSchema,
} from "@/lib/validators/storage";
import {
  acceptInvitationPayloadSchema,
  changePasswordPayloadSchema,
  forgotPasswordSchema,
  profileSchema,
  resetPasswordPayloadSchema,
} from "@/lib/validators/auth";
import type { AuthUser } from "@/types/auth";
import type { AvatarUrlResponse } from "@/types/storage";

async function avatarRequest(
  options: Parameters<typeof apiRequest>[1] = {},
): Promise<AvatarUrlResponse> {
  const result = await avatarCommand<unknown>(options);
  const parsed = avatarUrlResponseSchema.safeParse(result);
  if (!parsed.success)
    throw new ApiError(
      "INVALID_API_RESPONSE",
      "Không đọc được ảnh đại diện. Vui lòng thử lại.",
      502,
    );
  return parsed.data;
}

async function avatarCommand<T>(
  options: Parameters<typeof apiRequest>[1],
): Promise<T> {
  try {
    return await apiRequest<T>("auth/me/avatar", options);
  } catch (error) {
    if (error instanceof ApiError && [413, 503].includes(error.status))
      throw new ApiError(
        error.status === 413
          ? "AVATAR_FILE_TOO_LARGE"
          : "AVATAR_STORAGE_UNAVAILABLE",
        error.status === 413
          ? "Ảnh vượt quá dung lượng tối đa 5 MiB. Chọn ảnh nhỏ hơn."
          : "Dịch vụ lưu ảnh đang gián đoạn. Vui lòng thử lại sau.",
        error.status,
      );
    throw error;
  }
}

/** Self-service account commands. Public ones go through the BFF without a session. */
export const accountApi = {
  getAvatar: (signal?: AbortSignal) => avatarRequest({ signal }),
  uploadAvatar: (file: File) => {
    const body = new FormData();
    body.set("file", avatarFileSchema.parse(file));
    return avatarRequest({ method: "PUT", body });
  },
  deleteAvatar: () => avatarCommand<{ deleted: true }>({ method: "DELETE" }),
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
