import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
}

function Input({
  className,
  type,
  error = false,
  prefixIcon,
  suffixIcon,
  disabled,
  ...props
}: InputProps) {
  const inputEl = (
    <InputPrimitive
      type={type}
      data-slot="input"
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-1 text-base transition-colors outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        error &&
          "border-destructive text-destructive placeholder:text-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/50 dark:focus-visible:ring-destructive/40",
        (prefixIcon || suffixIcon) && "border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 px-0 h-full rounded-none",
        className
      )}
      {...props}
    />
  )

  if (prefixIcon || suffixIcon) {
    return (
      <div
        data-slot="input-container"
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
          error &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20 dark:border-destructive/50 dark:focus-within:ring-destructive/40",
          className
        )}
      >
        {prefixIcon && (
          <span className="inline-flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
            {prefixIcon}
          </span>
        )}
        {inputEl}
        {suffixIcon && (
          <span className="inline-flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
            {suffixIcon}
          </span>
        )}
      </div>
    )
  }

  return inputEl
}

export { Input }
