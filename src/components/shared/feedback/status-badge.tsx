import * as React from "react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { STATUS_MAP } from "@/constants/status"

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  category: keyof typeof STATUS_MAP
  status: string
  fallbackLabel?: string
}

function StatusBadge({
  category,
  status,
  fallbackLabel,
  className,
  ...props
}: StatusBadgeProps) {
  const categoryMap = STATUS_MAP[category]
  const config = categoryMap?.[status]

  const label = config?.label || fallbackLabel || status
  const variant = config?.variant || "secondary"

  return (
    <Badge variant={variant} className={className} {...props}>
      {label}
    </Badge>
  )
}

export { StatusBadge }
