import * as React from "react"
import { Button } from "@/components/ui/button"
import { EMPTY_MSG } from "@/constants/messages"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon, Search01Icon } from "@hugeicons/core-free-icons"

export interface EmptyStateProps {
  variant?: "no-data" | "no-result"
  icon?: React.ReactNode
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

function EmptyState({
  variant = "no-data",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const isNoResult = variant === "no-result"

  const defaultTitle = isNoResult
    ? EMPTY_MSG.NO_RESULT_TITLE
    : EMPTY_MSG.NO_DATA_TITLE

  const defaultDescription = isNoResult
    ? EMPTY_MSG.NO_RESULT_DESC
    : EMPTY_MSG.NO_DATA_DESC

  const defaultIcon = isNoResult ? (
    <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground" />
  ) : (
    <HugeiconsIcon icon={Folder01Icon} className="size-8 text-muted-foreground" />
  )

  return (
    <div
      data-slot="empty-state"
      className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center animate-in fade-in-50 ${className}`}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 mb-4">
        {icon ?? defaultIcon}
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">
        {title ?? defaultTitle}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description ?? defaultDescription}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="mt-5 rounded-full">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
