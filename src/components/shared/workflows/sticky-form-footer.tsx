"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

export interface StickyFormFooterProps {
  /** Back button handler — if not provided, back button is hidden */
  onBack?: () => void
  /** Back button label */
  backLabel?: string
  /** Primary action label (submit/next) */
  submitLabel?: string
  /** Whether primary action is in loading state */
  isSubmitting?: boolean
  /** Whether primary action is disabled */
  isDisabled?: boolean
  /** Custom actions slot (replaces default buttons) */
  children?: React.ReactNode
  className?: string
}

/**
 * Sticky bottom footer for wizard steps and long forms.
 * Sticks to the bottom of the viewport when content is taller than the screen.
 */
function StickyFormFooter({
  onBack,
  backLabel = "Quay lại",
  submitLabel = "Tiếp theo",
  isSubmitting = false,
  isDisabled = false,
  children,
  className,
}: StickyFormFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-6",
        "flex items-center justify-between gap-3",
        "rounded-2xl border border-border bg-card/80 px-5 py-3.5 shadow-lg backdrop-blur-md",
        className
      )}
    >
      {/* Back */}
      <div>
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {backLabel}
          </Button>
        )}
      </div>

      {/* Primary action(s) */}
      <div className="flex items-center gap-2">
        {children ?? (
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isDisabled || isSubmitting}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export { StickyFormFooter }
