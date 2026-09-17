import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const labelVariants = cva(
  "text-sm font-medium leading-none text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-data-[disabled]:opacity-50"
)

/**
 * Render `<label>` thuần thay vì `Field.Label` của Base UI: `Field.Label` bắt buộc
 * phải nằm trong `<Field.Root>`, nếu không sẽ throw ngay khi render (kể cả lúc SSR).
 * Form trong dự án dùng react-hook-form nên liên kết label–control qua `htmlFor`.
 */
export interface LabelProps
  extends React.ComponentProps<"label">,
    VariantProps<typeof labelVariants> {
  required?: boolean
}

function Label({ className, required = false, children, ...props }: LabelProps) {
  return (
    <label data-slot="label" className={cn(labelVariants(), className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  )
}

export { Label }
