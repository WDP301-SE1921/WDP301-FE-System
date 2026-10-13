import * as React from "react"
import { cn } from "cn"

export interface AttendanceSummaryProps {
  present: number
  absent: number
  makeup?: number
  permittedLeave?: number
  total: number
  /** Compact single-row display mode */
  compact?: boolean
  className?: string
}

const statConfig = [
  { key: "present", label: "Có mặt", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  { key: "absent", label: "Vắng", color: "text-red-600 dark:text-red-400", bg: "bg-red-500" },
  { key: "makeup", label: "Học bù", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  { key: "permittedLeave", label: "Có phép", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-400" },
] as const

/**
 * Attendance breakdown widget.
 * Shows present/absent/makeup/permitted-leave counts with a proportional bar.
 */
function AttendanceSummary({
  present,
  absent,
  makeup = 0,
  permittedLeave = 0,
  total,
  compact = false,
  className,
}: AttendanceSummaryProps) {
  const counts: Record<string, number> = { present, absent, makeup, permittedLeave }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Proportional bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {statConfig.map(({ key, bg }) => {
          const count = counts[key] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={key}
              className={cn("h-full transition-all", bg)}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>

      {/* Stats */}
      <div className={cn("flex gap-3", compact ? "flex-row flex-wrap" : "flex-col gap-1.5")}>
        {statConfig.map(({ key, label, color }) => {
          const count = counts[key] ?? 0
          if (count === 0 && key !== "present") return null
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("text-sm font-semibold tabular-nums", color)}>{count}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          )
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-sm font-semibold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">tổng số buổi</span>
        </div>
      </div>
    </div>
  )
}

export { AttendanceSummary }
