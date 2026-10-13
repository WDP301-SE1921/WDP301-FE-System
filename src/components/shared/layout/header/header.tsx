"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./global-search";
import { QuickCreateMenu } from "./quick-create-menu";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { getQuickCreateItems } from "@/constants/menu";
import { ROLES, ROLE_LABEL, type WebRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/hooks/use-current-role";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

export interface HeaderProps {
  role: WebRole;
  onToggleMobileSidebar?: () => void;
  onOpenGlobalSearch?: () => void;
}

function Header({
  role,
  onToggleMobileSidebar,
  onOpenGlobalSearch,
}: HeaderProps) {
  const user = useCurrentUser();
  const quickCreateItems = getQuickCreateItems(role);
  const accountHref =
    role === ROLES.TEACHER
      ? ROUTES.TEACHER.PROFILE
      : role === "staff"
        ? ROUTES.STAFF.PROFILE
        : ROUTES.MANAGER.PROFILE;

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
        {quickCreateItems.length > 0 && (
          <QuickCreateMenu items={quickCreateItems} />
        )}
        <NotificationBell />
        <div className="h-6 w-px bg-border hidden sm:block" />
        <UserMenu
          name={user?.name}
          roleLabel={ROLE_LABEL[role]}
          email={user?.email}
          avatarUrl={user?.avatarUrl}
          accountHref={accountHref}
        />
      </div>
    </header>
  );
}

export { Header };
