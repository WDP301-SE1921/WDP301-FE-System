"use client"

import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          error:
            "group-[.toast]:border-red-200 group-[.toast]:bg-red-50 group-[.toast]:text-red-900 dark:group-[.toast]:bg-red-950 dark:group-[.toast]:text-red-100",
          success:
            "group-[.toast]:border-emerald-200 group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-900 dark:group-[.toast]:bg-emerald-950 dark:group-[.toast]:text-emerald-100",
          warning:
            "group-[.toast]:border-amber-200 group-[.toast]:bg-amber-50 group-[.toast]:text-amber-900 dark:group-[.toast]:bg-amber-950 dark:group-[.toast]:text-amber-100",
          info:
            "group-[.toast]:border-blue-200 group-[.toast]:bg-blue-50 group-[.toast]:text-blue-900 dark:group-[.toast]:bg-blue-950 dark:group-[.toast]:text-blue-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
