"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { getNavMenu, type MenuBadgeCounts } from "@/constants/menu";
import type { WebRole } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import * as Icons from "@hugeicons/core-free-icons";

export interface SidebarProps {
  role: WebRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Số thật của badge menu, key theo `badgeKey` khai báo trong constants/menu.ts */
  badgeCounts?: MenuBadgeCounts;
  className?: string;
}

function SidebarIcon({ name }: { name: string }) {
  const allIcons = Icons as unknown as Record<string, IconSvgElement>;
  const icon = allIcons[name] ?? allIcons["HelpCircleIcon"];
  return <HugeiconsIcon icon={icon} className="size-5 shrink-0" />;
}

function Sidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  badgeCounts,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const menuGroups = getNavMenu(role);

  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed}
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 select-none",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-base shadow-sm">
            EG
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold leading-tight text-foreground tracking-tight">
                EduGrade
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Hệ thống Quản lý Center
              </span>
            </div>
          )}
        </Link>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            className="hidden lg:flex rounded-full text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon
              icon={collapsed ? Icons.SidebarRightIcon : Icons.SidebarLeftIcon}
              className="size-4"
            />
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={group.groupTitle || idx} className="space-y-1.5">
            {!collapsed && group.groupTitle && (
              <h4 className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.groupTitle}
              </h4>
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                const badgeCount = item.badgeKey
                  ? badgeCounts?.[item.badgeKey]
                  : undefined;
                const hasBadge =
                  typeof badgeCount === "number" && badgeCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <SidebarIcon name={item.iconName} />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.title}</span>
                    )}
                    {!collapsed && hasBadge && (
                      <Badge
                        variant={isActive ? "secondary" : "info"}
                        className="px-1.5 py-0 text-[10px] h-4"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

export { Sidebar };
