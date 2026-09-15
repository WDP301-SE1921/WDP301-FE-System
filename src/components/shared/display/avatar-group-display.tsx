import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "cn"

export interface AvatarGroupMember {
  id: string
  name: string
  avatarUrl?: string
}

export interface AvatarGroupDisplayProps {
  members: AvatarGroupMember[]
  /** Maximum avatars shown before "+N" overflow */
  max?: number
  size?: "sm" | "default" | "lg"
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

/**
 * Overlapping avatar group with +N overflow and name tooltips.
 * Wraps ui/avatar AvatarGroup. Uses Base UI Tooltip (no asChild / side props).
 */
function AvatarGroupDisplay({
  members,
  max = 4,
  size = "default",
  className,
}: AvatarGroupDisplayProps) {
  const visible = members.slice(0, max)
  const overflow = members.length - max

  return (
    <AvatarGroup className={cn(className)}>
      {visible.map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger>
            <Avatar size={size}>
              {m.avatarUrl && (
                <AvatarImage src={m.avatarUrl} alt={m.name} loading="lazy" />
              )}
              <AvatarFallback className="text-[10px] font-semibold">
                {getInitials(m.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{m.name}</TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <AvatarGroupCount className="text-xs font-semibold">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  )
}

export { AvatarGroupDisplay }
