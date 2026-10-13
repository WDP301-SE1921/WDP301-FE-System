"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WORK_CREDIT_MSG } from "@/constants/messages/events/work-credit"
import { CURRENT_WORK_CREDIT_MONTH, getWorkCreditMonths } from "@/features/work-credits/selectors"

/** Tháng đang xem, đồng bộ URL qua nuqs (`?month=YYYY-MM`), mặc định tháng hiện tại của bộ mock. */
export function useWorkCreditMonth() {
  const [month, setMonth] = useQueryState("month", parseAsString.withDefault(CURRENT_WORK_CREDIT_MONTH))
  return [month, (next: string | null) => setMonth(next === CURRENT_WORK_CREDIT_MONTH ? null : next)] as const
}

export interface WorkCreditMonthSelectProps {
  month: string
  onChange: (month: string) => void
}

function WorkCreditMonthSelect({ month, onChange }: WorkCreditMonthSelectProps) {
  const items = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        getWorkCreditMonths().map((value) => [value, WORK_CREDIT_MSG.MONTH_LABEL(value)])
      ),
    []
  )

  return (
    <Select items={items} value={month} onValueChange={(value) => onChange(String(value))}>
      <SelectTrigger className="w-44 rounded-xl">
        <SelectValue placeholder={WORK_CREDIT_MSG.FILTER_MONTH_PLACEHOLDER} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { WorkCreditMonthSelect }
