"use client"

import * as React from "react"
import { canAccessPath } from "@/constants/role-access"
import type { WebRole } from "@/constants/roles"
import { parseStoredUser, readRoleCookie, readStoredUserRaw, SESSION_CHANGED_EVENT } from "@/lib/auth/session"
import type { AuthUser } from "@/types/auth"

/** Synchronize profile changes within this tab and between tabs. */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(SESSION_CHANGED_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(SESSION_CHANGED_EVENT, onChange)
  }
}

/** Role hiện tại ở client (snapshot server = `null` để khớp SSR). */
export function useCurrentRole(): WebRole | null {
  return React.useSyncExternalStore(subscribe, readRoleCookie, () => null)
}

/** Hồ sơ người dùng đã lưu lúc đăng nhập (`null` trước khi hydrate hoặc khi chưa đăng nhập). */
export function useCurrentUser(): AuthUser | null {
  const raw = React.useSyncExternalStore(subscribe, readStoredUserRaw, () => null)
  return React.useMemo(() => parseStoredUser(raw), [raw])
}

/**
 * Dùng để ẩn nút/link dẫn tới màn mà role hiện tại không vào được (thay vì để bấm rồi nhận
 * 403). Trước khi hydrate `role` là `null` nên `canAccess` trả `false` — nút chỉ hiện sau
 * khi biết chắc role.
 */
export function useRoleAccess() {
  const role = useCurrentRole()
  return {
    role,
    canAccess: (href: string) => canAccessPath(role, href),
  }
}
