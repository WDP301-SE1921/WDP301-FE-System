"use client"

import { useMutation } from "@tanstack/react-query"
import { STORAGE_KEYS } from "@/constants/storage-keys"
import { mockLogin } from "@/mocks/data/auth"
import { mockMutation } from "@/mocks/utils/mock-query"
import type { LoginInput } from "@/lib/validators/auth"
import type { LoginResult } from "@/types/auth"

/** Số ngày giữ phiên khi người dùng tick "Ghi nhớ đăng nhập". */
const REMEMBER_ME_DAYS = 30

function persistSession(result: LoginResult, rememberMe: boolean) {
  const maxAge = rememberMe ? REMEMBER_ME_DAYS * 24 * 60 * 60 : undefined

  // Giai đoạn mock: proxy.ts chặn route theo cookie role, chưa có JWT thật.
  document.cookie = [
    `${STORAGE_KEYS.ROLE_COOKIE}=${result.user.role}`,
    "path=/",
    "samesite=lax",
    maxAge ? `max-age=${maxAge}` : "",
  ]
    .filter(Boolean)
    .join("; ")

  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user))
}

/**
 * Chữ ký hook giữ nguyên khi nối backend thật — chỉ đổi `mutationFn` từ
 * `mockLogin` sang lời gọi API.
 */
export function useLogin() {
  return useMutation<LoginResult, Error, LoginInput>({
    mutationFn: (input) => mockMutation(input, mockLogin),
    onSuccess: (result, input) => persistSession(result, input.rememberMe),
  })
}
