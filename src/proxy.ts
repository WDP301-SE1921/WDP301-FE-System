import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPath, ROLE_HOME_ROUTE } from "@/constants/role-access";
import { ROUTES } from "@/constants/routes";
import {
  backendError,
  backendFetch,
  BackendRequestError,
  browserRedirectUrl,
  clearSessionCookies,
  readBackend,
  SESSION_COOKIES,
  VERIFIED_ROLE_HEADER,
  webUser,
} from "@/lib/api/server";
import type { BackendUser } from "@/types/backend";

/** A valid session reopening /login (Back, typed URL) goes to its home instead of the form. */
async function redirectSignedIn(request: NextRequest) {
  const access = request.cookies.get(SESSION_COOKIES.ACCESS)?.value;
  const form = NextResponse.next();
  form.headers.set("Cache-Control", "no-store");
  if (!access) return form;
  try {
    const upstream = await backendFetch("auth/me", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const user = webUser(await readBackend<BackendUser>(upstream));
    return NextResponse.redirect(
      browserRedirectUrl(request, ROLE_HOME_ROUTE[user.role]),
    );
  } catch {
    // Expired, revoked or unreachable: keep the login form usable.
    return form;
  }
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === ROUTES.AUTH.LOGIN)
    return redirectSignedIn(request);
  try {
    const access = request.cookies.get(SESSION_COOKIES.ACCESS)?.value;
    if (!access)
      throw backendError(401, "AUTH_UNAUTHORIZED", "Vui lòng đăng nhập.");
    const upstream = await backendFetch("auth/me", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const user = webUser(await readBackend<BackendUser>(upstream));
    if (!canAccessPath(user.role, request.nextUrl.pathname)) {
      // Rewriting to a normal /403 page is rendered as HTTP 200 by Next. Respond directly.
      return new NextResponse(
        `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>403 — Không có quyền truy cập</title></head><body style="min-height:100vh;margin:0;display:grid;place-items:center;font-family:system-ui"><main style="max-width:32rem;margin:1.5rem;padding:2rem;border:1px solid;border-radius:1.5rem"><p>403</p><h1>Không có quyền truy cập</h1><p>Tài khoản của bạn không được phép mở chức năng này.</p><a href="${ROLE_HOME_ROUTE[user.role]}" style="display:inline-block;margin-top:1rem;padding:.75rem 1.25rem;border:1px solid;border-radius:999px;color:inherit">Về trang chủ</a></main></body></html>`,
        {
          status: 403,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }
    const headers = new Headers(request.headers);
    headers.set(VERIFIED_ROLE_HEADER, user.role);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 429)
      return new NextResponse(
        "Thao tác quá nhiều lần. Vui lòng tải lại trang sau một phút.",
        {
          status: 429,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        },
      );
    if (
      error instanceof BackendRequestError &&
      error.status === 401 &&
      request.cookies.get(SESSION_COOKIES.REFRESH)?.value
    ) {
      const query = new URLSearchParams({
        returnTo: request.nextUrl.pathname + request.nextUrl.search,
      });
      return NextResponse.redirect(
        browserRedirectUrl(request, `/api/auth/restore?${query}`),
      );
    }
    if (error instanceof BackendRequestError && error.status >= 500)
      return new NextResponse(
        "Không kết nối được máy chủ. Vui lòng tải lại trang sau.",
        { status: 503 },
      );
    const response = NextResponse.redirect(
      browserRedirectUrl(request, ROUTES.AUTH.LOGIN),
    );
    clearSessionCookies(response);
    return response;
  }
}

export const config = {
  matcher: ["/login", "/manager/:path*", "/staff/:path*", "/teacher/:path*"],
};
