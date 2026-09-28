"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getManagerAccounts,
  getManagerTotals,
  type ManagerTotals,
} from "@/features/system/selectors"
import {
  mockDeactivateManager,
  mockInviteManager,
  mockResendManagerInvite,
  type InviteManagerInput,
} from "@/mocks/data/system"
import type { ManagerAccount } from "@/types/system"

export interface ManagersData {
  rows: ManagerAccount[]
  totals: ManagerTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useManagers() {
  return useQuery<ManagersData>({
    queryKey: ["managers"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getManagerAccounts()
        return { rows, totals: getManagerTotals(rows) }
      }),
  })
}

export function useInviteManager() {
  const queryClient = useQueryClient()

  return useMutation<ManagerAccount, Error, InviteManagerInput>({
    mutationFn: (input) => mockMutation(input, mockInviteManager),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] })
    },
  })
}

export function useResendManagerInvite() {
  const queryClient = useQueryClient()

  return useMutation<ManagerAccount, Error, string>({
    mutationFn: (id) => mockMutation(id, mockResendManagerInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] })
    },
  })
}

export function useDeactivateManager() {
  const queryClient = useQueryClient()

  return useMutation<ManagerAccount, Error, string>({
    mutationFn: (id) => mockMutation(id, mockDeactivateManager),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] })
    },
  })
}
