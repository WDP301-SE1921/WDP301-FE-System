"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

export interface GlobalSearchProps {
  onClick?: () => void
}

function GlobalSearch({ onClick }: GlobalSearchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full max-w-xs items-center gap-2 rounded-full border border-input bg-muted/40 px-3.5 text-xs text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none"
    >
      <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-left">Tìm học sinh, lớp học...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}

export { GlobalSearch }
