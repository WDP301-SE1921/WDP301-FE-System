"use client"

import { useMutation } from "@tanstack/react-query"
import { persistSession } from "@/lib/auth/session"
import { mockLogin } from "@/mocks/data/auth"
import { mockMutation } from "@/mocks/utils/mock-query"
import type { LoginInput } from "@/lib/validators/auth"
import type { LoginResult } from "@/types/auth"

/**
 * Chữ ký hook giữ nguyên khi nối backend thật — chỉ đổi `mutationFn` từ
 * `mockLogin` sang lời gọi API.
 */
export function useLogin() {
  return useMutation<LoginResult, Error, LoginInput>({
    mutationFn: (input) => mockMutation(input, mockLogin),
    onSuccess: (result, input) => persistSession(result.user, input.rememberMe),
  })
}
