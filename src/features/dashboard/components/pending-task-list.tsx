import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

export interface PendingTaskItem {
  id: string
  icon: IconSvgElement
  label: string
  description: string
  count: number
  tone: "warning" | "danger" | "info"
  href: string
}

export interface PendingTaskListProps {
  items: PendingTaskItem[]
}

const toneMap: Record<PendingTaskItem["tone"], { icon: string; badge: string }> = {
  warning: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  danger: {
    icon: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
  info: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
}

function PendingTaskList({ items }: PendingTaskListProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const tone = toneMap[item.tone]

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted/60"
            >
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                  tone.icon
                )}
              >
                <HugeiconsIcon icon={item.icon} className="size-4.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  tone.badge
                )}
              >
                {item.count}
              </span>

              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 shrink-0 text-muted-foreground"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export { PendingTaskList }
