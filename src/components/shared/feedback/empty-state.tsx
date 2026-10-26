import * as React from "react"
import { Button } from "@/components/ui/button"
import { EMPTY_MSG } from "@/constants/messages"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

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
    <HugeiconsIcon icon={Search01Icon} className="size-7" />
  ) : (
    <HugeiconsIcon icon={Folder01Icon} className="size-7" />
  )

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-55 w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center sm:px-8 sm:py-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"
      >
        {icon ?? defaultIcon}
      </div>
      <h3 className="max-w-full wrap-break-word font-heading text-base font-semibold leading-6 text-foreground">
        {title ?? defaultTitle}
      </h3>
      <p className="mt-1 w-full max-w-sm wrap-break-word text-sm leading-6 text-muted-foreground">
        {description ?? defaultDescription}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          variant="outline"
          className="mt-5 min-h-11 max-w-full wrap-anywhere rounded-xl whitespace-normal px-4 py-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
