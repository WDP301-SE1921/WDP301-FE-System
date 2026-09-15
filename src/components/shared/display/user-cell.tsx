import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "cn"

export interface UserCellProps {
  name: string
  sub?: string
  avatarUrl?: string
  /** Extra wrapper className */
  className?: string
}

/**
 * Compact avatar + name + sub-label for use inside table cells.
 * Renders as a Server Component (no interactivity needed).
 */
function UserCell({ name, sub, avatarUrl, className }: UserCellProps) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <Avatar size="default" className="shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} loading="lazy" />}
        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground leading-tight">{name}</p>
        {sub && (
          <p className="truncate text-xs text-muted-foreground leading-tight">{sub}</p>
        )}
      </div>
    </div>
  )
}

export { UserCell }
