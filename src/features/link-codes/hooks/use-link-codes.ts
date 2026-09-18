"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getLinkCodeRows,
  getLinkCodeTotals,
  type LinkCodeRow,
  type LinkCodeTotals,
} from "@/features/payments/selectors"

export interface LinkCodesData {
  rows: LinkCodeRow[]
  totals: LinkCodeTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useLinkCodes() {
  return useQuery<LinkCodesData>({
    queryKey: ["link-codes"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getLinkCodeRows()
        return { rows, totals: getLinkCodeTotals(rows) }
      }),
  })
}
