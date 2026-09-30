"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ACTION_LABEL } from "@/constants/messages"
import type { QuickCreateItem } from "@/constants/menu"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import * as Icons from "@hugeicons/core-free-icons"

export interface QuickCreateMenuProps {
  /** Các lối tắt role hiện tại được phép dùng (`getQuickCreateItems` trong constants/menu.ts). */
  items: QuickCreateItem[]
}

function QuickCreateMenu({ items }: QuickCreateMenuProps) {
  const router = useRouter()
  const allIcons = Icons as unknown as Record<string, IconSvgElement>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="default"
            size="sm"
            className="hidden sm:inline-flex rounded-full gap-1.5"
          />
        }
      >
        <HugeiconsIcon icon={Icons.Add01Icon} className="size-4" />
        <span>{ACTION_LABEL.QUICK_CREATE}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
            <HugeiconsIcon icon={allIcons[item.iconName] ?? Icons.HelpCircleIcon} />
            <span>{item.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { QuickCreateMenu }
