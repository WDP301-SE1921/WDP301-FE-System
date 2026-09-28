"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ACTION_LABEL } from "@/constants/messages"
import { ROUTES } from "@/constants/routes"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  SecurityPasswordIcon,
  Logout01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"

export interface UserMenuProps {
  name?: string
  roleLabel?: string
  avatarUrl?: string
  email?: string
  onLogout?: () => void
}

function UserMenu({
  name = "Quản lý viên",
  roleLabel = "Quản lý",
  avatarUrl,
  email = "admin@edugrade.edu.vn",
  onLogout,
}: UserMenuProps) {
  const router = useRouter()
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-1.5 transition-colors hover:bg-muted outline-none">
        <Avatar size="sm">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col text-left sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold leading-none text-foreground">
              {name}
            </span>
            <Badge variant="info" className="px-1.5 py-0 text-[10px] h-4">
              {roleLabel}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{email}</span>
        </div>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground font-normal">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(ROUTES.MANAGER.PROFILE)}>
            <HugeiconsIcon icon={UserIcon} />
            <span>{ACTION_LABEL.ACCOUNT}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`${ROUTES.MANAGER.PROFILE}?tab=password`)}
          >
            <HugeiconsIcon icon={SecurityPasswordIcon} />
            <span>{ACTION_LABEL.CHANGE_PASSWORD}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} />
          <span>{ACTION_LABEL.LOGOUT}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
