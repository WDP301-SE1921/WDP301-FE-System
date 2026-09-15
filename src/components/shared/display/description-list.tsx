import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"

export interface DescriptionItem {
  label: string
  value: React.ReactNode
  /** Span full width (useful for long text) */
  fullWidth?: boolean
}

export interface DescriptionListProps {
  items: DescriptionItem[]
  /** Number of columns in grid layout */
  cols?: 1 | 2 | 3
  /** Show horizontal separators between rows */
  dividers?: boolean
  className?: string
}

const colsMap: Record<NonNullable<DescriptionListProps["cols"]>, string> = {
  1: "grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
}

/**
 * Key-value description list for detail panels.
 * Renders as a responsive grid with optional separators.
 */
function DescriptionList({
  items,
  cols = 2,
  dividers = false,
  className,
}: DescriptionListProps) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4", colsMap[cols], className)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {dividers && i > 0 && <Separator className="col-span-full" />}
          <div className={cn("flex flex-col gap-0.5", item.fullWidth && "col-span-full")}>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {item.label}
            </dt>
            <dd className="text-sm text-foreground">{item.value ?? "—"}</dd>
          </div>
        </React.Fragment>
      ))}
    </dl>
  )
}

export { DescriptionList }
