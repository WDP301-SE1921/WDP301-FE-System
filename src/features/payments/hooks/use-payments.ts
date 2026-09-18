"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getPaymentRows,
  getPaymentTotals,
  type PaymentRow,
  type PaymentTotals,
} from "@/features/payments/selectors"

export interface PaymentsData {
  rows: PaymentRow[]
  totals: PaymentTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function usePayments() {
  return useQuery<PaymentsData>({
    queryKey: ["payments"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getPaymentRows()
        return { rows, totals: getPaymentTotals(rows) }
      }),
  })
}
