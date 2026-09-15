import * as React from "react"
import { formatMoney } from "@/lib/format"
import { cn } from "cn"

export interface MoneyTextProps {
  amount: number
  /** When true renders in a muted/dimmed style (e.g. original price struck through) */
  muted?: boolean
  /** When true renders with line-through decoration */
  strikethrough?: boolean
  className?: string
}

/**
 * Formats a number as Vietnamese VND currency using Intl.NumberFormat.
 * Example: 1500000 → "1.500.000 ₫"
 */
function MoneyText({ amount, muted, strikethrough, className }: MoneyTextProps) {
  return (
    <span
      className={cn(
        "tabular-nums text-sm font-medium",
        muted && "text-muted-foreground",
        strikethrough && "line-through",
        className
      )}
    >
      {formatMoney(amount)}
    </span>
  )
}

export { MoneyText }
