"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Tick02Icon, Cancel01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

export type ConditionStatus = "pass" | "fail" | "info" | "neutral"

export interface ConditionChipItem {
  id: string
  label: string
  /** Status of condition check: pass (green tick), fail (red cross), info, or neutral */
  status?: ConditionStatus
  /** Alternative shorthand boolean for status: true = pass, false = fail */
  pass?: boolean
  /** Custom icon override */
  icon?: IconSvgElement
}

export interface ConditionChipsProps {
  /** Array of condition items to display */
  conditions: ConditionChipItem[]
  className?: string
}

/**
 * Read-only condition indicator chips for make-up class / schedule change matching.
 * Example display: "Cùng chương trình · Cùng Bài 13 · Chưa diễn ra · Còn chỗ"
 * Indicates whether each eligibility criteria is met (pass/fail/neutral/info).
 */
function ConditionChips({ conditions, className }: ConditionChipsProps) {
  if (conditions.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {conditions.map((item) => {
        const resolvedStatus: ConditionStatus =
          item.status ??
          (item.pass !== undefined ? (item.pass ? "pass" : "fail") : "pass")

        return (
          <Badge
            key={item.id}
            variant={
              resolvedStatus === "pass"
                ? "success"
                : resolvedStatus === "fail"
                ? "danger"
                : resolvedStatus === "info"
                ? "info"
                : "secondary"
            }
            className="flex items-center gap-1.5 px-2.5 py-1 h-7 rounded-full text-xs font-medium border transition-colors shrink-0"
          >
            {item.icon ? (
              <HugeiconsIcon icon={item.icon} className="size-3.5 shrink-0" />
            ) : resolvedStatus === "pass" ? (
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : resolvedStatus === "fail" ? (
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : resolvedStatus === "info" ? (
              <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
            ) : null}
            <span>{item.label}</span>
          </Badge>
        )
      })}
    </div>
  )
}

export { ConditionChips }
