import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "cn"

export interface ProgressStatProps {
  /** Current value */
  value: number
  /** Maximum value (defaults to 100 for percentage) */
  max?: number
  /** Label displayed above the bar */
  label?: string
  /** Custom formatted text for current/total (e.g. "12/20 buổi") */
  description?: string
  /** Color override: "success" | "warning" | "danger" | "default" */
  color?: "default" | "success" | "warning" | "danger"
  className?: string
}

const colorMap: Record<NonNullable<ProgressStatProps["color"]>, string> = {
  default: "",
  success: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
  warning: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  danger: "[&_[data-slot=progress-indicator]]:bg-red-500",
}

/**
 * A compact statistic widget: label + progress bar + percentage/description.
 * Used for attendance rates, payment completion, etc.
 */
function ProgressStat({
  value,
  max = 100,
  label,
  description,
  color = "default",
  className,
}: ProgressStatProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const autoColor =
    color === "default"
      ? percentage >= 80
        ? "success"
        : percentage >= 60
          ? "warning"
          : "danger"
      : color

  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      {(label || description !== undefined) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <span className="text-xs text-muted-foreground truncate">{label}</span>}
          <span className="text-xs font-medium tabular-nums ml-auto shrink-0">
            {description ?? `${percentage}%`}
          </span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn("h-1.5", colorMap[autoColor])}
      />
    </div>
  )
}

export { ProgressStat }
