import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, ROLE_HOME_ROUTE } from "@/constants/role-access";
import { ROUTES } from "@/constants/routes";
import {
  authorizedBackendFetch,
  BackendRequestError,
  browserRedirectUrl,
  clearSessionCookies,
  readBackend,
  SESSION_COOKIES,
  setSessionCookies,
  webUser,
} from "@/lib/api/server";
import type { BackendUser } from "@/types/backend";

export const runtime = "nodejs";

// Keep every rotation inside Route Handlers. Proxy may run in a separate execution context.
export async function GET(request: NextRequest) {
  try {
    const { response: upstream, renewed } = await authorizedBackendFetch(
      request,
      "auth/me",
    );
    const user = webUser(await readBackend<BackendUser>(upstream));
    const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "";
    let destination = ROLE_HOME_ROUTE[user.role];
    if (
      /^\/(manager|staff|teacher)\//.test(returnTo) &&
      !returnTo.includes("\\")
    ) {
      const target = new URL(returnTo, request.url);
      if (canAccessPath(user.role, target.pathname))
        destination = target.pathname + target.search;
    }
    const response = NextResponse.redirect(
      browserRedirectUrl(request, destination),
    );
    if (renewed)
      setSessionCookies(
        response,
        renewed,
        request.cookies.get(SESSION_COOKIES.REMEMBER)?.value === "1",
      );
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
