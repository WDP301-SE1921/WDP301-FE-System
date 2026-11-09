"use client";

import { useState } from "react";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { accountApi } from "@/features/auth/api";
import {
  avatarKey,
  avatarQueryOptions,
  claimAvatarImageRetry,
  commitAvatarAccess,
  isCurrentAvatarUser,
  reconcileAvatar,
  resetAvatarImageRetry,
} from "@/features/auth/avatar-state";
import { ApiError } from "@/lib/api/client";
import { useCurrentUser } from "@/hooks/use-current-role";
import { toAvatarAccess } from "@/lib/storage/signed-url";
import type { AuthUser } from "@/types/auth";
import type { AvatarAccess, AvatarUrlResponse } from "@/types/storage";

export function useCurrentAvatar(user: AuthUser | null) {
  const currentUser = useCurrentUser();
  const active = !!user && currentUser?.id === user.id;
  const client = useQueryClient();
  const busy = useIsMutating({ mutationKey: avatarKey(user?.id) }) > 0;
  const query = useQuery({
    ...avatarQueryOptions(user),
    enabled: active && user?.hasAvatar === true && !busy,
  });
  const [failedAccess, setFailedAccess] = useState<AvatarAccess>();
  const hasImageError = !!query.data && query.data === failedAccess;
  const refresh = async () => {
    if (!active) return;
    if (user) resetAvatarImageRetry(client, user.id);
    await query.refetch();
  };
  const onImageStatus = (status: "idle" | "loading" | "loaded" | "error") => {
    if (!active || !user || !query.data?.url || busy) return;
    if (status === "loaded") resetAvatarImageRetry(client, user.id);
    if (status !== "error") return;
    setFailedAccess(query.data);
    if (claimAvatarImageRetry(client, user.id)) void query.refetch();
  };
  return {
    ...query,
    url:
      active && user?.hasAvatar && !query.isError && !hasImageError
        ? (query.data?.url ?? undefined)
        : undefined,
    hasImageError,
    refresh,
    onImageStatus,
  };
}

export function useAvatarMutations(user: AuthUser) {
  const client = useQueryClient();
  const assertCurrent = () => {
    if (!isCurrentAvatarUser(user))
      throw new ApiError(
        "AVATAR_SESSION_CHANGED",
        "Tài khoản đã thay đổi. Tải lại trang trước khi đổi ảnh.",
        409,
      );
  };
  const cancelReads = async () => {
    await Promise.all([
      client.cancelQueries({ queryKey: avatarKey(user.id) }),
      client.cancelQueries({ queryKey: ["auth-me"] }),
    ]);
  };
  const before = async () => {
    assertCurrent();
    await cancelReads();
  };
  const success = async (response: AvatarUrlResponse) => {
    await cancelReads();
    resetAvatarImageRetry(client, user.id);
    commitAvatarAccess(client, user, toAvatarAccess(response, Date.now()));
    if (isCurrentAvatarUser(user))
      await client.invalidateQueries({ queryKey: ["auth-me"] });
  };
  const onError = async () => {
    if (isCurrentAvatarUser(user))
      await reconcileAvatar(client, user).catch(() => undefined);
  };
  const upload = useMutation({
    mutationKey: avatarKey(user.id),
    retry: false,
    mutationFn: (file: File) => {
      assertCurrent();
      return accountApi.uploadAvatar(file);
    },
    onMutate: before,
    onSuccess: success,
    onError,
  });
  const remove = useMutation({
    mutationKey: avatarKey(user.id),
    retry: false,
    mutationFn: () => {
      assertCurrent();
      return accountApi.deleteAvatar();
    },
    onMutate: before,
    onSuccess: () => success({ url: null, expiresIn: null }),
    onError,
  });
  return { upload, remove };
}
