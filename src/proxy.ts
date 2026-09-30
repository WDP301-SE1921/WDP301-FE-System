import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { canAccessPath } from "@/constants/role-access"
import { ROUTES } from "@/constants/routes"
import { STORAGE_KEYS } from "@/constants/storage-keys"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Role đọc từ cookie (mock — chưa có session thật). Không có role mặc định: thiếu cookie
  // thì phải đăng nhập, giá trị lạ hoặc role không được vào khu này thì trả 403.
  const roleCookie = request.cookies.get(STORAGE_KEYS.ROLE_COOKIE)?.value

  if (!roleCookie) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.AUTH.LOGIN
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (!canAccessPath(roleCookie, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/403"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/manager/:path*", "/teacher/:path*"],
}
