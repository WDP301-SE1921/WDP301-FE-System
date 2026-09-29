"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header/header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ROLES, type Role } from "@/constants/roles"
import { STORAGE_KEYS } from "@/constants/storage-keys"
import { type MenuBadgeCounts } from "@/constants/menu"

export interface AppShellProps {
  role?: Extract<Role, "manager" | "teacher">
  /** Số thật của badge menu, key theo `badgeKey` khai báo trong constants/menu.ts */
  badgeCounts?: MenuBadgeCounts
  children: React.ReactNode
}

function AppShell({ role = ROLES.MANAGER, badgeCounts, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true"
  })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next))
      return next
    })
  }

  return (
    <div data-slot="app-shell" className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          badgeCounts={badgeCounts}
        />
      </div>

      {/* Mobile Sidebar Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-border">
          <Sidebar role={role} collapsed={false} badgeCounts={badgeCounts} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header role={role} onToggleMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export { AppShell }
