import { NextResponse, type NextRequest } from "next/server";
import { loginSchema, registerParentSchema } from "@/lib/validators/auth";
import { parentSearchSchema } from "@/features/registration-flow/schemas";
import { ROLE_HOME_ROUTE } from "@/constants/role-access";
import { academicRoles } from "@/lib/api/backend-permissions";
import {
  authorizedBackendFetch,
  backendError,
  backendFetch,
  BackendRequestError,
  clearSessionCookies,
  forgetRefreshSession,
  isSameOriginRequest,
  readBackend,
  SESSION_COOKIES,
  setSessionCookies,
  webUser,
} from "@/lib/api/server";
import type { BackendAuth, BackendUser } from "@/types/backend";

export const runtime = "nodejs";
const ALLOWED = [
  {
    method: "GET",
    path: /^(auth\/me|parents(?:\/(lookup|search))?|students|programs|classes(?:\/[^/]+)?|registrations\/[^/]+(?:\/(receipt|bill))?|academic\/(?:curriculum-units(?:\/[^/]+)?|scheduled-sessions))$/,
  },
  {
    method: "POST",
    path: /^(auth\/(login|logout|register)|programs|classes|classes\/[^/]+\/schedules|registrations(?:\/[^/]+\/(cancel|confirm-payment))?|academic\/(?:curriculum-units(?:\/[^/]+\/(?:lessons|monthly-tests|approve|revisions))?|classes\/[^/]+\/(?:session-preview|session-generations)))$/,
  },
  {
    method: "PATCH",
    path: /^(classes\/[^/]+|academic\/curriculum-units\/[^/]+(?:\/lessons\/[^/]+)?)$/,
  },
];
async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await context.params;
    if (segments.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part)))
      throw backendError(404, "NOT_FOUND", "API không được hỗ trợ.");
    const path = segments.join("/");
    if (
      !ALLOWED.some(
        (item) => item.method === request.method && item.path.test(path),
      )
    )
      throw backendError(404, "NOT_FOUND", "API không được hỗ trợ.");
    if (request.method !== "GET") {
      if (!isSameOriginRequest(request))
        throw backendError(403, "FORBIDDEN", "Nguồn yêu cầu không hợp lệ.");
    }
    if (path === "auth/register") {
      const parsed = registerParentSchema.safeParse(await request.json());
      if (!parsed.success)
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Kiểm tra lại email và mật khẩu.",
        );
      const auth = await readBackend<BackendAuth>(
        await backendFetch(path, {
          method: "POST",
          body: JSON.stringify(parsed.data),
        }),
      );
      // Registration is self-service; the parent continues in the mobile app.
      // Revoke the session returned by BE and never expose its tokens to this web form.
      await backendFetch("auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
      }).catch(() => {});
      return NextResponse.json(
        { success: true, data: { email: auth.user.email } },
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    if (path === "auth/login") {
      const parsed = loginSchema.safeParse(await request.json());
      if (!parsed.success)
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Kiểm tra lại email và mật khẩu.",
        );
      const { email, password, rememberMe } = parsed.data;
      const auth = await readBackend<BackendAuth>(
        await backendFetch(path, {
          method: "POST",
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        }),
      );
      let user;
      try {
        user = webUser(auth.user);
      } catch (error) {
        await backendFetch("auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
        }).catch(() => {});
        throw error;
      }
      const response = NextResponse.json({
        success: true,
        data: { user, redirectTo: ROLE_HOME_ROUTE[user.role] },
      });
      setSessionCookies(response, auth, rememberMe);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (/^registrations(?:\/|$)|^parents\/search$/.test(path)) {
      const session = await authorizedBackendFetch(request, "auth/me");
      const user = webUser(await readBackend<BackendUser>(session.response));
      if (user.role !== "staff")
        throw backendError(
          403,
          "FORBIDDEN",
          "Chỉ nhân viên được đăng ký và xác nhận học phí.",
        );
      if (
        path === "parents/search" &&
        !parentSearchSchema.safeParse({
          email: request.nextUrl.searchParams.get("email"),
        }).success
      )
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Nhập từ 2 đến 255 ký tự email để tìm phụ huynh.",
        );
    }
    const permittedRoles =
      path === "parents" || path === "students"
        ? (["center_manager", "staff"] as const)
        : academicRoles(request.method, path);
    if (permittedRoles) {
      const session = await authorizedBackendFetch(request, "auth/me");
      const user = webUser(await readBackend<BackendUser>(session.response));
      if (!permittedRoles.includes(user.role))
        throw backendError(
          403,
          "FORBIDDEN",
          "Tài khoản không có quyền truy cập dữ liệu này.",
        );
    }
    const init: RequestInit = { method: request.method };
    if (request.method !== "GET") init.body = await request.text();
    const key = request.headers.get("idempotency-key");
    if (key) init.headers = { "Idempotency-Key": key };
    const { response: upstream, renewed } = await authorizedBackendFetch(
      request,
      path + request.nextUrl.search,
      init,
    );
    let response: NextResponse;
    if (path === "auth/me")
      response = NextResponse.json({
        success: true,
        data: webUser(await readBackend<BackendUser>(upstream)),
      });
    else
      response = new NextResponse(await upstream.text(), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    if (renewed)
      setSessionCookies(
        response,
        renewed,
        request.cookies.get(SESSION_COOKIES.REMEMBER)?.value === "1",
      );
    if (path === "auth/logout" && upstream.ok) {
      forgetRefreshSession(request.cookies.get(SESSION_COOKIES.REFRESH)?.value);
      if (renewed) forgetRefreshSession(renewed.tokens.refreshToken);
      clearSessionCookies(response);
    }
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) response.headers.set("Retry-After", retryAfter);
    response.headers.set("Cache-Control", "no-store");
    if (upstream.status === 401) clearSessionCookies(response);
    return response;
  } catch (error) {
    const failure =
      error instanceof BackendRequestError
        ? error
        : backendError(400, "INVALID_REQUEST", "Yêu cầu không hợp lệ.");
    const response = NextResponse.json(failure.body, {
      status: failure.status,
      headers: { "Cache-Control": "no-store" },
    });
    if (failure.status === 401) clearSessionCookies(response);
    return response;
  }
}
export { handle as GET, handle as POST, handle as PATCH };
