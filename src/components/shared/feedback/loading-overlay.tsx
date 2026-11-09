import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  text?: string
  className?: string
}

function LoadingOverlay({
  loading,
  children,
  text = "Đang tải dữ liệu...",
  className,
}: LoadingOverlayProps) {
  return (
    <div
      data-slot="loading-overlay"
      className={cn("relative w-full min-w-0 rounded-2xl", className)}
    >
      <div className="contents" aria-busy={loading} inert={loading}>
        {children}
      </div>
      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-background/80 p-4 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
        >
          <Spinner size="lg" aria-hidden="true" className="text-primary motion-reduce:animate-none" />
          {text ? (
            <span className="max-w-full wrap-break-word rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium leading-5 text-foreground">
              {text}
            </span>
          ) : (
            <span className="sr-only">Đang tải dữ liệu...</span>
          )}
        </div>
      )}
    </div>
  )
}

export { LoadingOverlay }
