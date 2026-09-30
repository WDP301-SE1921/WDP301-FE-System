"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getStaffAccounts,
  getStaffTotals,
  type StaffTotals,
} from "@/features/system/selectors"
import {
  mockDeactivateStaff,
  mockInviteStaff,
  mockResendStaffInvite,
  type DeactivateStaffInput,
  type InviteStaffInput,
} from "@/mocks/data/system"
import type { StaffAccount } from "@/types/system"

export interface StaffAccountsData {
  rows: StaffAccount[]
  totals: StaffTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useStaffAccounts() {
  return useQuery<StaffAccountsData>({
    queryKey: ["staff-accounts"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getStaffAccounts()
        return { rows, totals: getStaffTotals(rows) }
      }),
  })
}

export function useInviteStaff() {
  const queryClient = useQueryClient()

  return useMutation<StaffAccount, Error, InviteStaffInput>({
    mutationFn: (input) => mockMutation(input, mockInviteStaff),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] })
    },
  })
}

export function useResendStaffInvite() {
  const queryClient = useQueryClient()

  return useMutation<StaffAccount, Error, string>({
    mutationFn: (id) => mockMutation(id, mockResendStaffInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] })
    },
  })
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient()

  return useMutation<StaffAccount, Error, DeactivateStaffInput>({
    mutationFn: (input) => mockMutation(input, mockDeactivateStaff),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] })
    },
  })
}
