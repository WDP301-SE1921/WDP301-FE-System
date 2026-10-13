import * as React from "react"
import { formatDate, formatDateTime, formatRelativeDate } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "cn"

export type DateTextFormat = "date" | "datetime" | "relative"

export interface DateTextProps {
  value: Date | string | number | null | undefined
  format?: DateTextFormat
  /**
   * When using "relative" format, show the absolute date as a tooltip.
   * Defaults to true.
   */
  tooltip?: boolean
  fallback?: string
  className?: string
}

/**
 * Renders a date in a consistent, locale-aware format.
 * - "date"     → "12/09/2025"
 * - "datetime" → "08:00 - 12/09/2025"
 * - "relative" → "3 giờ trước" (with tooltip showing absolute date)
 */
function DateText({
  value,
  format = "date",
  tooltip = true,
  fallback = "—",
  className,
}: DateTextProps) {
  if (value === null || value === undefined) {
    return <span className={cn("text-muted-foreground text-sm", className)}>{fallback}</span>
  }

  const formatted =
    format === "relative"
      ? formatRelativeDate(value)
      : format === "datetime"
        ? formatDateTime(value)
        : formatDate(value)

  if (!formatted) {
    return <span className={cn("text-muted-foreground text-sm", className)}>{fallback}</span>
  }

  const textNode = (
    <span className={cn("text-sm text-foreground", className)}>{formatted}</span>
  )

  if (format === "relative" && tooltip) {
    return (
      <Tooltip>
        {/* Base UI Trigger: no asChild — children render inside trigger natively */}
        <TooltipTrigger>
          {textNode}
        </TooltipTrigger>
        {/* Base UI TooltipContent: positioning controlled by Positioner inside — no `side` prop here */}
        <TooltipContent>{formatDateTime(value)}</TooltipContent>
      </Tooltip>
    )
  }

  return textNode
}

export { DateText }
