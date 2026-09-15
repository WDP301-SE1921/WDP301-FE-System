import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"

export interface SectionCardProps {
  title: string
  description?: string
  /** Slot for header actions (e.g. edit button) */
  action?: React.ReactNode
  /** Show a separator between header and content */
  divider?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * A section wrapper card used in detail pages and settings-style layouts.
 * Composes ui/card primitives with optional action slot.
 */
function SectionCard({
  title,
  description,
  action,
  divider = true,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader className={cn(divider && "border-b border-border pb-4")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
          </div>
          {action && <CardAction>{action}</CardAction>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export { SectionCard }
