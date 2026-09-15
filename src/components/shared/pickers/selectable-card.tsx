"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export interface SelectableCardProps {
  selected?: boolean
  disabled?: boolean
  onSelect?: () => void
  onClick?: () => void
  title?: string
  description?: string
  badge?: string
  children?: React.ReactNode
  className?: string
}

/**
 * A card that acts as a large clickable radio/checkbox option.
 * Used in enrollment wizards, class pickers, etc.
 * Renders a highlighted border when selected.
 */
function SelectableCard({
  selected = false,
  disabled = false,
  onSelect,
  onClick,
  title,
  description,
  badge,
  children,
  className,
}: SelectableCardProps) {
  const handleSelect = () => {
    if (disabled) return
    onSelect?.()
    onClick?.()
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          handleSelect()
        }
      }}
      className={cn(
        "relative flex flex-col gap-2 rounded-2xl border-2 p-4 text-sm transition-all outline-none cursor-pointer",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Selection indicator */}
      <span
        aria-hidden
        className={cn(
          "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 bg-background"
        )}
      >
        {selected && (
          <svg viewBox="0 0 12 12" fill="none" className="size-3">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {children ? (
        children
      ) : (
        <div className="pr-6">
          <div className="flex items-center gap-2 mb-1">
            {title && <p className="font-semibold text-foreground text-sm">{title}</p>}
            {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
    </div>
  )
}

export { SelectableCard }
