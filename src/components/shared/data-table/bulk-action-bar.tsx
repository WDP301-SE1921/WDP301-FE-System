"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

export interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  children?: React.ReactNode
}

function BulkActionBar({
  selectedCount,
  onClearSelection,
  children,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null

  return (
    <div
      data-slot="bulk-action-bar"
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border bg-popover px-5 py-3 shadow-xl backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-5"
    >
      <div className="flex items-center gap-2 pr-2 border-r border-border">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-foreground">Đã chọn</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClearSelection}
          className="rounded-full text-muted-foreground hover:text-foreground ml-1"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          <span className="sr-only">Bỏ chọn</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export { BulkActionBar }
