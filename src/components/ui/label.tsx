"use client"

import * as React from "react"
import { Field } from "@base-ui/react/field"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const labelVariants = cva(
  "text-sm font-medium leading-none text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-data-[disabled]:opacity-50"
)

export interface LabelProps
  extends React.ComponentProps<typeof Field.Label>,
    VariantProps<typeof labelVariants> {
  required?: boolean
}

function Label({ className, required = false, children, ...props }: LabelProps) {
  return (
    <Field.Label
      data-slot="label"
      className={cn(labelVariants(), className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </Field.Label>
  )
}

export { Label }
