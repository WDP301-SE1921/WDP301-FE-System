"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import { getParentRows, toParentRow, type ParentRow } from "@/features/parents/selectors"
import { findParent } from "@/mocks/data/parents"

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
