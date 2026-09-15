"use client"

import * as React from "react"
import { cn } from "cn"

export interface CodeDisplayProps {
  /** The code/identifier string to display */
  value: string
  /** Optional label above */
  label?: string
  /** Monospace font-weight */
  bold?: boolean
  /** Show a subtle border box */
  boxed?: boolean
  className?: string
}

/**
 * Displays a code, identifier, or reference number in a monospace style.
 * Used for student codes, link codes, invoice numbers etc.
 */
function CodeDisplay({ value, label, bold = true, boxed = false, className }: CodeDisplayProps) {
  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <span
        className={cn(
          "font-mono text-sm tracking-wider text-foreground",
          bold && "font-semibold",
          boxed &&
            "rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs"
        )}
      >
        {value}
      </span>
    </div>
  )
}

export { CodeDisplay }
