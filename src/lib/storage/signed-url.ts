import type {
  AvatarAccess,
  AvatarUrlResponse,
  FileAccess,
  SignedAccessUrl,
} from "@/types/storage";

export function toAvatarAccess(
  value: AvatarUrlResponse,
  receivedAt: number,
): AvatarAccess {
  return value.url === null || value.expiresIn === null
    ? { url: null, expiresAt: null }
    : { url: value.url, expiresAt: receivedAt + value.expiresIn * 1000 };
}

export function toFileAccess(
  value: SignedAccessUrl,
  receivedAt: number,
): FileAccess {
  return { url: value.url, expiresAt: receivedAt + value.expiresIn * 1000 };
}

export function isAccessFresh(
  value: AvatarAccess | FileAccess | undefined,
  now: number,
  bufferMs: number,
): boolean {
  return !!(
    value?.url &&
    value.expiresAt !== null &&
    now < value.expiresAt - bufferMs
  );
}
