import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { accountApi } from "@/features/auth/api";
import { apiRequest } from "@/lib/api/client";
import {
  parseStoredUser,
  readStoredUserRaw,
  updateStoredUser,
} from "@/lib/auth/session";
import { toAvatarAccess } from "@/lib/storage/signed-url";
import type { AuthUser } from "@/types/auth";
import type { AvatarAccess } from "@/types/storage";

export const avatarKey = (id?: string) => ["auth-avatar", id ?? null] as const;
const imageRetries = new WeakMap<QueryClient, Set<string>>();

export function avatarQueryOptions(user: AuthUser | null) {
  return queryOptions({
    queryKey: avatarKey(user?.id),
    enabled: user?.hasAvatar === true,
    queryFn: async ({ signal }): Promise<AvatarAccess> =>
      toAvatarAccess(await accountApi.getAvatar(signal), Date.now()),
    retry: false,
    staleTime: 30_000,
    gcTime: 900_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      const expiresAt = query.state.data?.expiresAt;
      return !query.state.error && expiresAt
        ? Math.max(1000, expiresAt - Date.now() - 30_000)
        : false;
    },
  });
}

export function isCurrentAvatarUser(user: AuthUser): boolean {
  return parseStoredUser(readStoredUserRaw())?.id === user.id;
}

export function commitAvatarAccess(
  client: QueryClient,
  user: AuthUser,
  access: AvatarAccess,
) {
  if (!isCurrentAvatarUser(user)) return;
  const current = client.getQueryData<AuthUser>(["auth-me"]);
  const profile = {
    ...(current?.id === user.id ? current : user),
    hasAvatar: access.url !== null,
  };
  client.setQueryData(avatarKey(user.id), access);
  client.setQueryData(["auth-me"], profile);
  updateStoredUser(profile);
}

export async function reconcileAvatar(client: QueryClient, user: AuthUser) {
  const profile = await apiRequest<AuthUser>("auth/me");
  if (profile.id !== user.id || !isCurrentAvatarUser(user)) return;
  const value = profile.hasAvatar
    ? await accountApi.getAvatar()
    : { url: null, expiresIn: null };
  if (!isCurrentAvatarUser(user)) return;
  client.setQueryData(["auth-me"], profile);
  commitAvatarAccess(client, profile, toAvatarAccess(value, Date.now()));
}

/** Header and profile share one automatic recovery attempt for the same image. */
export function claimAvatarImageRetry(
  client: QueryClient,
  id: string,
): boolean {
  let users = imageRetries.get(client);
  if (!users) imageRetries.set(client, (users = new Set()));
  if (users.has(id)) return false;
  users.add(id);
  return true;
}

export function resetAvatarImageRetry(client: QueryClient, id: string) {
  imageRetries.get(client)?.delete(id);
}
