import * as React from "react"
import { cn } from "cn"

export interface ChangeDiffProps {
  label?: string
  before: React.ReactNode
  after: React.ReactNode
  className?: string
}

/**
 * Renders a before → after change diff inline.
 * Used in audit logs and confirmation dialogs showing what will change.
 */
function ChangeDiff({ label, before, after, className }: ChangeDiffProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-red-700 line-through dark:bg-red-950/40 dark:text-red-400">
          {before}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          {after}
        </span>
      </div>
    </div>
  )
}

export { ChangeDiff }
