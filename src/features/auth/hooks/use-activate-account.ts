"use client"

import { useMutation } from "@tanstack/react-query"
import { mockActivateAccount } from "@/mocks/data/auth"
import { mockMutation } from "@/mocks/utils/mock-query"
import type { ActivateAccountInput } from "@/lib/validators/auth"

/** Kích hoạt tài khoản từ lời mời. Đổi `mutationFn` khi có endpoint thật. */
export function useActivateAccount() {
  return useMutation<{ email: string }, Error, ActivateAccountInput>({
    mutationFn: (input) => mockMutation(input, mockActivateAccount),
  })
}
