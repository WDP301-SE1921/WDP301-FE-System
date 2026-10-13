import * as React from "react"
import { cn } from "cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

function Textarea({ className, error = false, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={error ? true : undefined}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground shadow-xs transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        error &&
          "border-destructive text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/50 dark:focus-visible:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
