import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ROLES } from "@/constants/roles"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Retrieve user role from cookie or header (mock fallback for dev)
  const roleCookie = request.cookies.get("edugrade_role")?.value || ROLES.MANAGER

  if (pathname.startsWith("/manager") && roleCookie !== ROLES.MANAGER) {
    const url = request.nextUrl.clone()
    url.pathname = "/403"
    return NextResponse.rewrite(url)
  }

  if (pathname.startsWith("/teacher") && roleCookie !== ROLES.TEACHER) {
    const url = request.nextUrl.clone()
    url.pathname = "/403"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/manager/:path*", "/teacher/:path*"],
}
