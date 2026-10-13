import * as React from "react"
import { cn } from "cn"

// Schedule day-of-week abbreviations (Monday–Sunday)
const DAY_LABELS: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
}

export interface ScheduleTextProps {
  /**
   * Days of week as ISO day numbers (0=Sunday … 6=Saturday),
   * or common day abbreviations like ["T2","T4","T6"].
   */
  days?: (number | string)[]
  /** "08:00" or "08:00–10:00" */
  time?: string
  /** Optional room label */
  room?: string
  className?: string
}

/**
 * Compact schedule descriptor: "T2, T4, T6 · 08:00–10:00 · P.301"
 * Used in table cells and detail views.
 */
function ScheduleText({ days, time, room, className }: ScheduleTextProps) {
  const dayStr =
    days && days.length > 0
      ? days
          .map((d) => (typeof d === "number" ? DAY_LABELS[d] ?? String(d) : d))
          .join(", ")
      : null

  const parts = [dayStr, time, room].filter(Boolean)

  if (parts.length === 0) {
    return <span className={cn("text-muted-foreground text-sm", className)}>—</span>
  }

  return (
    <span className={cn("text-sm text-foreground", className)}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-1 text-muted-foreground">·</span>}
          {part}
        </React.Fragment>
      ))}
    </span>
  )
}

export { ScheduleText }
