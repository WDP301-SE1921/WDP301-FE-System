import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "cn"

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
    <div className={cn("relative w-full", className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-background/60 backdrop-blur-[1px] transition-all animate-in fade-in-0">
          <Spinner size="lg" className="text-primary" />
          {text && (
            <span className="text-xs font-semibold text-foreground/80 bg-background/90 px-3 py-1 rounded-full shadow-xs border border-border">
              {text}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { LoadingOverlay }
