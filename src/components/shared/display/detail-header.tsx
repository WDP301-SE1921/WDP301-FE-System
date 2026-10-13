import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export interface DetailHeaderProps {
  name: string
  avatarUrl?: string
  /** Primary identifier shown below name, e.g. student code */
  code?: string
  /** Status badge */
  statusLabel?: string
  statusVariant?: "success" | "warning" | "danger" | "info" | "neutral" | "secondary"
  /** Contextual meta items, e.g. "Lớp 10A", "Toán" */
  meta?: Array<{ icon?: React.ReactNode; label: string }>
  /** Slot for action buttons */
  actions?: React.ReactNode
  className?: string
}

/**
 * Full-width hero header for entity detail pages (student, teacher, class…).
 * Shows large avatar, name, code, status, meta tags, and action buttons.
 */
function DetailHeader({
  name,
  avatarUrl,
  code,
  statusLabel,
  statusVariant = "secondary",
  meta = [],
  actions,
  className,
}: DetailHeaderProps) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start",
        className
      )}
    >
      {/* Avatar */}
      <Avatar size="lg" className="size-16 shrink-0 rounded-2xl text-base">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} loading="lazy" />}
        <AvatarFallback className="rounded-2xl text-base font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{name}</h1>
          {statusLabel && (
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          )}
        </div>

        {code && (
          <p className="mt-0.5 text-sm text-muted-foreground font-mono">{code}</p>
        )}

        {meta.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {meta.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-xs text-muted-foreground [&>svg]:size-3.5"
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
      )}
    </div>
  )
}

export { DetailHeader }
