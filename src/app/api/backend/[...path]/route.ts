import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import {
  acceptInvitationPayloadSchema,
  changePasswordPayloadSchema,
  forgotPasswordSchema,
  loginSchema,
  registerParentSchema,
  resetPasswordPayloadSchema,
} from "@/lib/validators/auth";
import { parentSearchSchema } from "@/features/registration-flow/schemas";
import { avatarFileSchema } from "@/lib/validators/storage";
import { ROLE_HOME_ROUTE } from "@/constants/role-access";
import { backendRule } from "@/lib/api/backend-permissions";
import {
  authorizedBackendFetch,
  backendError,
  backendFetch,
  BackendRequestError,
  clearSessionCookies,
  forgetRefreshSession,
  isSameOriginRequest,
  readBackend,
  realtimePublicUrl,
  SESSION_COOKIES,
  setSessionCookies,
  webUser,
} from "@/lib/api/server";
import type { BackendAuth, BackendUser } from "@/types/backend";

export const runtime = "nodejs";
const PUBLIC_COMMANDS: Record<string, z.ZodType | undefined> = {
  "auth/forgot-password": forgotPasswordSchema,
  "auth/reset-password": resetPasswordPayloadSchema,
  "account-invitations/accept": acceptInvitationPayloadSchema,
};
async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  let roleRenewal: BackendAuth | undefined;
  try {
    const { path: segments } = await context.params;
    if (segments.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part)))
      throw backendError(404, "NOT_FOUND", "API không được hỗ trợ.");
    const path = segments.join("/");
    const rule = backendRule(request.method, path);
    if (!rule) throw backendError(404, "NOT_FOUND", "API không được hỗ trợ.");
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
    const publicSchema = PUBLIC_COMMANDS[path];
    if (publicSchema) {
      // No session exists yet (forgot/reset password, accepting an invitation).
      const parsed = publicSchema.safeParse(await request.json());
      if (!parsed.success)
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Kiểm tra lại thông tin đã nhập.",
        );
      const upstream = await backendFetch(path, {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      const response = new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      });
      const retryAfter = upstream.headers.get("retry-after");
      if (retryAfter) response.headers.set("Retry-After", retryAfter);
      return response;
    }
    if (path === "auth/change-password") {
      const parsed = changePasswordPayloadSchema.safeParse(
        await request.json(),
      );
      if (!parsed.success)
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Kiểm tra lại mật khẩu đã nhập.",
        );
      const { response: upstream, renewed } = await authorizedBackendFetch(
        request,
        path,
        {
          method: "POST",
          body: JSON.stringify(parsed.data),
        },
      );
      const response = new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
        },
      });
      if (renewed)
        setSessionCookies(
          response,
          renewed,
          request.cookies.get(SESSION_COOKIES.REMEMBER)?.value === "1",
        );
      response.headers.set("Cache-Control", "no-store");
      if (upstream.status === 401) clearSessionCookies(response);
      return response;
    }
    const permittedRoles = rule.roles;
    if (permittedRoles) {
      const session = await authorizedBackendFetch(request, "auth/me");
      roleRenewal = session.renewed;
      const user = webUser(await readBackend<BackendUser>(session.response));
      if (!permittedRoles.includes(user.role))
        throw backendError(
          403,
          "FORBIDDEN",
          "Tài khoản không có quyền truy cập dữ liệu này.",
        );
    }
    const init: RequestInit = { method: request.method };
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
    if (path === "auth/me/avatar" && request.method === "PUT") {
      const data = await request.formData();
      const parsed = avatarFileSchema.safeParse(data.get("file"));
      if (
        !parsed.success ||
        data.getAll("file").length !== 1 ||
        [...data.keys()].some((field) => field !== "file")
      )
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Chọn một ảnh PNG hoặc JPG, dung lượng lớn hơn 0 và tối đa 5 MiB.",
        );
      init.body = data;
    } else if (path === "academic/assignments/import-preview") {
      const data = await request.formData();
      const file = data.get("file");
      const classId = data.get("classId");
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 5 * 1024 * 1024 ||
        !/\.(csv|docx|pdf)$/i.test(file.name) ||
        typeof classId !== "string" ||
        !classId.trim() ||
        classId.length > 191 ||
        data.getAll("file").length !== 1 ||
        data.getAll("classId").length !== 1 ||
        [...data.keys()].some(
          (field) => field !== "file" && field !== "classId",
        )
      )
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Chọn lớp và một file CSV, DOCX hoặc PDF tối đa 5 MiB.",
        );
      init.body = data;
    } else if (path.endsWith("/import-preview")) {
      const data = await request.formData();
      const file = data.get("file");
      const mode = data.get("mode");
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 5 * 1024 * 1024 ||
        !["APPEND", "REPLACE"].includes(String(mode)) ||
        data.getAll("file").length !== 1 ||
        data.getAll("mode").length !== 1 ||
        [...data.keys()].some((field) => field !== "file" && field !== "mode")
      )
        throw backendError(
          400,
          "VALIDATION_ERROR",
          "Chọn file CSV tối đa 5 MiB và chế độ nhập hợp lệ.",
        );
      init.body = data;
    } else if (request.method !== "GET") init.body = await request.text();
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
    else if (path === "auth/realtime-ticket" && upstream.ok)
      // Kèm địa chỉ socket để trình duyệt không cần biết cấu hình BE lúc build.
      response = NextResponse.json({
        success: true,
        data: {
          ...(await readBackend<{ token: string; expiresIn: number }>(
            upstream,
          )),
          url: realtimePublicUrl(),
        },
      });
    else {
      const headers = new Headers({
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      });
      const disposition = upstream.headers.get("content-disposition");
      if (disposition) headers.set("Content-Disposition", disposition);
      response = new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers,
      });
    }
    const sessionRenewal = renewed ?? roleRenewal;
    if (sessionRenewal)
      setSessionCookies(
        response,
        sessionRenewal,
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
    if (roleRenewal)
      setSessionCookies(
        response,
        roleRenewal,
        request.cookies.get(SESSION_COOKIES.REMEMBER)?.value === "1",
      );
    if (failure.status === 401) clearSessionCookies(response);
    return response;
  }
}
export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as PUT,
  handle as DELETE,
};
