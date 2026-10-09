import { NextResponse, type NextRequest } from "next/server";
import {
  BACKEND_ROLE_MAP,
  type ApiEnvelope,
  type BackendAuth,
  type BackendUser,
} from "@/types/backend";

export const SESSION_COOKIES = {
  ACCESS: "edugrade_access",
  REFRESH: "edugrade_refresh",
  REMEMBER: "edugrade_remember",
} as const;
export const VERIFIED_ROLE_HEADER = "x-edugrade-verified-role";

export function browserRedirectUrl(request: NextRequest, path: string) {
  const url = new URL(path, request.url);
  const host = request.headers.get("host");
  if (host) url.host = host;
  return url;
}

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    // Next normalizes loopback origins in nextUrl. Compare the browser-facing Host.
    return (
      source.origin === origin &&
      source.host === (request.headers.get("host") ?? request.nextUrl.host) &&
      (source.protocol === "http:" || source.protocol === "https:")
    );
  } catch {
    return false;
  }
}

export class BackendRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiEnvelope<never>,
  ) {
    super(body.error?.message ?? "Backend request failed");
  }
}
export function backendError(status: number, code: string, message: string) {
  return new BackendRequestError(status, {
    success: false,
    error: { code, message },
  });
}
export async function backendFetch(path: string, init: RequestInit = {}) {
  const base = (
    process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1"
  ).replace(/\/$/, "");
  try {
    return await fetch(`${base}/${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
      headers: {
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    throw backendError(
      503,
      "BACKEND_UNAVAILABLE",
      "Không kết nối được máy chủ. Vui lòng thử lại.",
    );
  }
}
export async function readBackend<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T>;
  try {
    body = await response.json();
  } catch {
    throw backendError(
      502,
      "INVALID_API_RESPONSE",
      "Máy chủ trả về dữ liệu không hợp lệ.",
    );
  }
  if (!response.ok || !body.success || body.data === undefined)
    throw new BackendRequestError(
      response.status || 502,
      body as ApiEnvelope<never>,
    );
  return body.data;
}
interface RefreshEntry {
  expiresAt: number;
  promise: Promise<BackendAuth>;
}
// Share rotation between Route Handlers and Proxy, including concurrent tabs in this process.
const runtime = globalThis as typeof globalThis & {
  edugradeRefreshes?: Map<string, RefreshEntry>;
};
const refreshes = (runtime.edugradeRefreshes ??= new Map<
  string,
  RefreshEntry
>());
export async function refreshSession(
  refreshToken: string,
): Promise<BackendAuth> {
  const now = Date.now();
  for (const [key, entry] of refreshes)
    if (entry.expiresAt < now) refreshes.delete(key);
  const previous = refreshes.get(refreshToken);
  if (previous) return previous.promise;
  const promise = backendFetch("auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  }).then(readBackend<BackendAuth>);
  refreshes.set(refreshToken, { expiresAt: now + 60_000, promise });
  try {
    return await promise;
  } catch (error) {
    if (!(error instanceof BackendRequestError) || error.status !== 401)
      refreshes.delete(refreshToken);
    throw error;
  }
}
export function forgetRefreshSession(refreshToken?: string) {
  for (const [key, entry] of refreshes) {
    if (key === refreshToken) refreshes.delete(key);
    else
      void entry.promise
        .then((auth) => {
          if (auth.tokens.refreshToken === refreshToken) refreshes.delete(key);
        })
        .catch(() => {});
  }
}
export async function authorizedBackendFetch(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
) {
  let access = request.cookies.get(SESSION_COOKIES.ACCESS)?.value;
  const refresh = request.cookies.get(SESSION_COOKIES.REFRESH)?.value;
  if (!access && !refresh)
    throw backendError(401, "AUTH_UNAUTHORIZED", "Vui lòng đăng nhập lại.");
  let renewed: BackendAuth | undefined;
  const send = () =>
    backendFetch(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${access ?? ""}` },
    });
  let response = access ? await send() : undefined;
  if (!response || response.status === 401) {
    if (!refresh)
      throw backendError(
        401,
        "AUTH_UNAUTHORIZED",
        "Phiên đăng nhập đã hết hạn.",
      );
    renewed = await refreshSession(refresh);
    access = renewed.tokens.accessToken;
    response = await send();
  }
  return { response, renewed };
}
function refreshLifetime(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    return Math.max(
      1,
      Math.min(30 * 86400, (payload.exp ?? 0) - Math.floor(Date.now() / 1000)),
    );
  } catch {
    return 30 * 86400;
  }
}
export function setSessionCookies(
  response: NextResponse,
  auth: BackendAuth,
  remember: boolean,
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  const lifetime = remember
    ? { maxAge: refreshLifetime(auth.tokens.refreshToken) }
    : {};
  response.cookies.set(SESSION_COOKIES.ACCESS, auth.tokens.accessToken, {
    ...options,
    ...lifetime,
  });
  response.cookies.set(SESSION_COOKIES.REFRESH, auth.tokens.refreshToken, {
    ...options,
    ...lifetime,
  });
  response.cookies.set(SESSION_COOKIES.REMEMBER, remember ? "1" : "0", {
    ...options,
    ...lifetime,
  });
}
export function clearSessionCookies(response: NextResponse) {
  for (const name of [...Object.values(SESSION_COOKIES), "edugrade_role"])
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
}
export function webUser(user: BackendUser) {
  const role = BACKEND_ROLE_MAP[user.role];
  if (!role)
    throw backendError(
      403,
      "WEB_ROLE_UNSUPPORTED",
      "Tài khoản phụ huynh sử dụng ứng dụng di động. Vai trò này chưa được hỗ trợ trên web.",
    );
  if (user.status !== "ACTIVE")
    throw backendError(403, "ACCOUNT_DISABLED", "Tài khoản đã bị khóa.");
  return {
    id: user.id,
    email: user.email,
    name: user.displayName || user.email,
    role,
    emailVerifiedAt: user.emailVerifiedAt,
    status: user.status,
  };
}
