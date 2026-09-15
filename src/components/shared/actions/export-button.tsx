"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "cn"

export interface ExportButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Called when user triggers export. Return a promise for loading state. */
  onExport: () => Promise<void> | void
  label?: string
  exportingLabel?: string
}

/**
 * Export button with built-in loading state.
 * Calls `onExport` and tracks the async state internally.
 */
function ExportButton({
  onExport,
  label = "Xuất Excel",
  exportingLabel = "Đang xuất...",
  className,
  variant = "outline",
  size = "default",
  ...props
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const handleClick = React.useCallback(async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      await onExport()
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, onExport])

  return (
    <Button
      variant={variant}
      size={size}
      isLoading={isExporting}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {isExporting ? exportingLabel : label}
    </Button>
  )
}

export { ExportButton }
