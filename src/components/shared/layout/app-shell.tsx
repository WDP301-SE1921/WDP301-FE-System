"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header/header";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { WebRole } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { type MenuBadgeCounts } from "@/constants/menu";
import { useMenuBadgeCounts } from "@/features/dashboard/menu-badges";

export interface AppShellProps {
  role: WebRole;
  /** Số thật của badge menu, key theo `badgeKey` khai báo trong constants/menu.ts */
  badgeCounts?: MenuBadgeCounts;
  children: React.ReactNode;
}

function subscribeSidebarPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readSidebarPreference() {
  try {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";
  } catch {
    return false;
  }
}

function AppShell({ role, badgeCounts, children }: AppShellProps) {
  const liveCounts = useMenuBadgeCounts(role);
  const counts = badgeCounts ?? liveCounts;
  const storedCollapsed = React.useSyncExternalStore(
    subscribeSidebarPreference,
    readSidebarPreference,
    () => false,
  );
  const [collapsedOverride, setCollapsedOverride] = React.useState<
    boolean | null
  >(null);
  const collapsed = collapsedOverride ?? storedCollapsed;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsedOverride(next);
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
    } catch {
      // Persisting the preference is optional.
    }
  };

  return (
    <div
      data-slot="app-shell"
      className="flex min-h-screen bg-background text-foreground"
    >
      {/* Desktop Sidebar */}
      <div className="sticky top-0 hidden h-dvh shrink-0 self-start lg:block">
        <Sidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          badgeCounts={counts}
        />
      </div>

      {/* Mobile Sidebar Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 border-r border-border"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Đóng menu"
                className="absolute right-2 top-2 z-10"
                leftIcon={
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                }
              />
            }
          />
          <Sidebar
            role={role}
            collapsed={false}
            badgeCounts={counts}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          role={role}
          onToggleMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export { AppShell };
