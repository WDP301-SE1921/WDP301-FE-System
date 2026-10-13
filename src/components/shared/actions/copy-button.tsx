"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "cn"

export interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  value: string
  /** Label shown before copy */
  label?: string
  /** Label shown after successful copy */
  copiedLabel?: string
  /** Reset duration in ms */
  resetMs?: number
}

/**
 * One-click copy to clipboard button.
 * Shows a success state for `resetMs` milliseconds before reverting.
 */
function CopyButton({
  value,
  label = "Sao chép",
  copiedLabel = "Đã sao chép!",
  resetMs = 2000,
  className,
  size = "sm",
  variant = "outline",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      const t = setTimeout(() => setCopied(false), resetMs)
      return () => clearTimeout(t)
    })
  }, [value, resetMs])

  return (
    <Button
      size={size}
      variant={copied ? "secondary" : variant}
      className={cn(copied && "text-emerald-600 dark:text-emerald-400", className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? copiedLabel : label}
    </Button>
  )
}

export { CopyButton }
