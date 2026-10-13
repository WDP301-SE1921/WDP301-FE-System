"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export interface CountdownBadgeProps {
  /** Target date/time */
  target: Date | string | number
  /**
   * Thresholds (in hours) for color changes.
   * Defaults: < 24h → warning, < 1h → danger, already passed → neutral
   */
  dangerHours?: number
  warningHours?: number
  className?: string
}

function msToDisplay(ms: number): string {
  if (ms <= 0) return "Đã qua"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) return `${days} ngày ${hours}g`
  if (hours > 0) return `${hours}g ${minutes}p`
  return `${minutes} phút`
}

/**
 * Live-updating countdown displayed as a badge.
 * Changes variant automatically as deadline approaches:
 *   - > warningHours   → info
 *   - ≤ warningHours   → warning
 *   - ≤ dangerHours    → danger
 *   - expired          → neutral
 */
function CountdownBadge({
  target,
  dangerHours = 1,
  warningHours = 24,
  className,
}: CountdownBadgeProps) {
  const targetMs = new Date(target).getTime()
  const [remaining, setRemaining] = React.useState<number>(
    () => targetMs - Date.now()
  )

  React.useEffect(() => {
    const tick = () => setRemaining(targetMs - Date.now())
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [targetMs])

  const hours = remaining / 1000 / 3600
  const variant =
    remaining <= 0
      ? "neutral"
      : hours <= dangerHours
        ? "danger"
        : hours <= warningHours
          ? "warning"
          : "info"

  return (
    <Badge variant={variant} className={cn(className)}>
      {msToDisplay(remaining)}
    </Badge>
  )
}

export { CountdownBadge }
