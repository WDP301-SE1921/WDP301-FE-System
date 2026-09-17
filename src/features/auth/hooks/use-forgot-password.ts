"use client"

import { useMutation } from "@tanstack/react-query"
import { mockRequestPasswordReset } from "@/mocks/data/auth"
import { mockMutation } from "@/mocks/utils/mock-query"
import type { ForgotPasswordInput } from "@/lib/validators/auth"

/** Gửi link đặt lại mật khẩu. Đổi `mutationFn` khi có endpoint thật. */
export function useForgotPassword() {
  return useMutation<{ email: string }, Error, ForgotPasswordInput>({
    mutationFn: (input) => mockMutation(input, mockRequestPasswordReset),
  })
}
