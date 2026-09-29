"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "./global-search"
import { QuickCreateMenu } from "./quick-create-menu"
import { NotificationBell } from "./notification-bell"
import { UserMenu } from "./user-menu"
import { ROLES, ROLE_LABEL, type Role } from "@/constants/roles"
import { ROUTES } from "@/constants/routes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon } from "@hugeicons/core-free-icons"

export interface HeaderProps {
  role?: Extract<Role, "manager" | "teacher">
  onToggleMobileSidebar?: () => void
  onOpenGlobalSearch?: () => void
}

function Header({
  role = ROLES.MANAGER,
  onToggleMobileSidebar,
  onOpenGlobalSearch,
}: HeaderProps) {
  const isTeacher = role === ROLES.TEACHER

  return (
    <header
      data-slot="header"
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xs sm:px-6"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleMobileSidebar}
          className="lg:hidden rounded-full text-muted-foreground"
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="w-48 sm:w-64">
          <GlobalSearch onClick={onOpenGlobalSearch} />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isTeacher && <QuickCreateMenu />}
        <NotificationBell />
        <div className="h-6 w-px bg-border hidden sm:block" />
        {isTeacher ? (
          <UserMenu
            name="Trần Văn Minh"
            roleLabel={ROLE_LABEL.teacher}
            subtitleLine="Giáo viên · Toán"
            email="minh.tran@edugrade.vn"
            accountHref={ROUTES.TEACHER.PROFILE}
          />
        ) : (
          <UserMenu />
        )}
      </div>
    </header>
  )
}

export { Header }
