"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import { getParentRows, toParentRow, type ParentRow } from "@/features/parents/selectors"
import {
  findParent,
  mockSetParentStatus,
  mockUpdateParentContact,
  type SetParentStatusInput,
  type UpdateParentContactInput,
} from "@/mocks/data/parents"
import type { ParentAccount } from "@/types/student"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useParents() {
  return useQuery<ParentRow[]>({
    queryKey: ["parents"],
    queryFn: () => mockQuery(getParentRows),
  })
}

export function useParent(parentAccountId: string) {
  return useQuery<ParentRow | null>({
    queryKey: ["parents", parentAccountId],
    queryFn: () =>
      mockQuery(() => {
        const parent = findParent(parentAccountId)
        return parent ? toParentRow(parent) : null
      }),
    enabled: parentAccountId.length > 0,
  })
}

export function useUpdateParentContact() {
  const queryClient = useQueryClient()

  return useMutation<ParentAccount, Error, UpdateParentContactInput>({
    mutationFn: (input) => mockMutation(input, mockUpdateParentContact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
    },
  })
}

export function useSetParentStatus() {
  const queryClient = useQueryClient()

  return useMutation<ParentAccount, Error, SetParentStatusInput>({
    mutationFn: (input) => mockMutation(input, mockSetParentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] })
    },
  })
}
