import * as React from "react"
import { cn } from "cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-muted/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
