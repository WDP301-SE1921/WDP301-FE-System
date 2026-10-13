import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "cn"

export type KpiTrend = "up" | "down" | "neutral"

export interface KpiCardProps {
  title: string
  value: string | number
  /** Optional sub-label below value */
  sub?: string
  /** Trend direction */
  trend?: KpiTrend
  /** Trend label, e.g. "+12% so với tháng trước" */
  trendLabel?: string
  /** Icon slot — any ReactNode (e.g. a Hugeicons icon) */
  icon?: React.ReactNode
  /** Accent color theme for the icon background */
  color?: "blue" | "green" | "amber" | "red" | "purple" | "cyan"
  className?: string
}

const colorMap: Record<NonNullable<KpiCardProps["color"]>, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
}

const trendColorMap: Record<KpiTrend, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
}

const trendArrow: Record<KpiTrend, string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
}

/**
 * Summary statistic card — used in dashboard overview grids.
 * Shows a metric value with optional icon, trend indicator and sub-label.
 */
function KpiCard({
  title,
  value,
  sub,
  trend,
  trendLabel,
  icon,
  color = "blue",
  className,
}: KpiCardProps) {
  return (
    <Card size="sm" className={cn("gap-3", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-0">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && trendLabel && (
            <p className={cn("text-xs font-medium", trendColorMap[trend])}>
              {trendArrow[trend]} {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5",
              colorMap[color]
            )}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { KpiCard }
