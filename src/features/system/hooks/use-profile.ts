"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import { getStaffAccount } from "@/features/system/selectors"
import { useCurrentUser } from "@/hooks/use-current-role"
import {
  mockChangePassword,
  mockUpdateStaffProfile,
  type ChangePasswordInput,
  type UpdateStaffProfileInput,
} from "@/mocks/data/system"
import type { StaffAccount } from "@/types/system"

/** Hồ sơ nhân sự của người đang đăng nhập — id lấy từ phiên. Chữ ký giữ nguyên khi nối backend. */
export function useCurrentStaff() {
  const user = useCurrentUser()
  const userId = user?.id ?? ""

  return useQuery<StaffAccount | undefined>({
    queryKey: ["staff-accounts", "current", userId],
    queryFn: () => mockQuery(() => getStaffAccount(userId)),
    enabled: userId.length > 0,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<StaffAccount, Error, UpdateStaffProfileInput>({
    mutationFn: (input) => mockMutation(input, mockUpdateStaffProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] })
    },
  })
}

export function useChangePassword() {
  return useMutation<{ success: true }, Error, ChangePasswordInput>({
    mutationFn: (input) => mockMutation(input, mockChangePassword),
  })
}
