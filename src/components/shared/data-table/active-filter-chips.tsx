"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

export interface ActiveFilterChip {
  id: string
  label: string
  value: string
  icon?: IconSvgElement
  onRemove?: () => void
}

export interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[]
  onClearAll?: () => void
  className?: string
}

/**
 * Active filter chips bar for DataTable.
 * Shows currently applied search & column filters with remove buttons and "Clear all".
 */
function ActiveFilterChips({ chips, onClearAll, className }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 h-6 rounded-full text-xs font-medium"
        >
          {chip.icon && (
            <HugeiconsIcon icon={chip.icon} className="size-3 shrink-0" />
          )}
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="font-semibold text-foreground">{chip.value}</span>
          {chip.onRemove && (
            <button
              type="button"
              onClick={chip.onRemove}
              className="ml-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
              aria-label={`Xóa bộ lọc ${chip.label}`}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-2.5" />
            </button>
          )}
        </Badge>
      ))}

      {onClearAll && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearAll}
          className="h-6 rounded-full text-xs text-muted-foreground hover:text-foreground"
        >
          Xóa tất cả
        </Button>
      )}
    </div>
  )
}

export { ActiveFilterChips }
