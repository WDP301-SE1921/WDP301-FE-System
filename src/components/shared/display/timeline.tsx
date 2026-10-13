import * as React from "react"
import { cn } from "cn"

export type TimelineVariant = "default" | "success" | "warning" | "danger" | "info"

export interface TimelineItem {
  id: string
  label: string
  description?: string
  timestamp?: string
  variant?: TimelineVariant
  icon?: React.ReactNode
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const variantDotMap: Record<TimelineVariant, string> = {
  default: "bg-muted-foreground ring-border",
  success: "bg-emerald-500 ring-emerald-200 dark:ring-emerald-800",
  warning: "bg-amber-500 ring-amber-200 dark:ring-amber-800",
  danger: "bg-red-500 ring-red-200 dark:ring-red-800",
  info: "bg-blue-500 ring-blue-200 dark:ring-blue-800",
}

/**
 * Vertical timeline — used for activity logs, payment history, audit trails.
 * Each item has a colored dot, label, optional description and timestamp.
 */
function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("relative flex flex-col", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const variant = item.variant ?? "default"

        return (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
            )}

            {/* Dot / Icon */}
            <div
              className={cn(
                "relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ring-2",
                item.icon ? "size-5 bg-muted ring-border [&>svg]:size-3" : variantDotMap[variant]
              )}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                {item.timestamp && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Timeline }
