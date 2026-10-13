"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { MoreVerticalIcon } from "@hugeicons/core-free-icons"

export interface RowActionItem {
  id: string
  label: string
  iconName?: IconSvgElement
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

export interface RowActionsProps {
  items: (RowActionItem | "separator")[]
}

function RowActions({ items }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-full text-muted-foreground hover:text-foreground"
          />
        }
      >
        <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
        <span className="sr-only">Hành động</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((item, idx) => {
          if (item === "separator") {
            return <DropdownMenuSeparator key={`sep-${idx}`} />
          }

          return (
            <DropdownMenuItem
              key={item.id}
              disabled={item.disabled}
              onClick={item.onClick}
              className={
                item.danger
                  ? "text-destructive focus:bg-destructive/10 focus:text-destructive font-medium"
                  : undefined
              }
            >
              {item.iconName && (
                <HugeiconsIcon icon={item.iconName} className="size-4" />
              )}
              <span>{item.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { RowActions }
