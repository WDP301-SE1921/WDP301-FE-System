"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import { getCurrentManager } from "@/features/system/selectors"
import {
  mockChangeManagerPassword,
  mockUpdateManagerProfile,
  type ChangeManagerPasswordInput,
  type UpdateManagerProfileInput,
} from "@/mocks/data/system"
import type { ManagerAccount } from "@/types/system"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useCurrentManager() {
  return useQuery<ManagerAccount | undefined>({
    queryKey: ["managers", "current"],
    queryFn: () => mockQuery(() => getCurrentManager()),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<ManagerAccount, Error, UpdateManagerProfileInput>({
    mutationFn: (input) => mockMutation(input, mockUpdateManagerProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] })
    },
  })
}

export function useChangeManagerPassword() {
  return useMutation<{ success: true }, Error, ChangeManagerPasswordInput>({
    mutationFn: (input) => mockMutation(input, mockChangeManagerPassword),
  })
}
