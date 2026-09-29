"use client"

import { cn } from "cn"
import { STATUS_MAP } from "@/constants/status"
import type { AttendanceStatus } from "@/types/student"

export interface AttendanceStatusToggleProps {
  value: AttendanceStatus
  onChange: (status: AttendanceStatus) => void
  /** "Nghỉ có phép" chỉ bấm được khi học sinh đang trong đợt nghỉ dài hạn. */
  canExcuse?: boolean
  className?: string
}

const OPTIONS: Array<{ status: AttendanceStatus; activeClass: string }> = [
  { status: "present", activeClass: "border-emerald-500 bg-emerald-500 text-white" },
  { status: "absent", activeClass: "border-red-500 bg-red-500 text-white" },
  { status: "made_up", activeClass: "border-blue-500 bg-blue-500 text-white" },
  { status: "excused", activeClass: "border-slate-500 bg-slate-500 text-white" },
]

/**
 * 4 nút chọn trạng thái điểm danh dạng segmented (PROMPT T4B) — cùng phong cách
 * "filter pill" đã dùng ở `class-detail-view.tsx`'s `SessionsTab`.
 */
function AttendanceStatusToggle({
  value,
  onChange,
  canExcuse = true,
  className,
}: AttendanceStatusToggleProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {OPTIONS.map((option) => {
        const isDisabled = option.status === "excused" && !canExcuse
        const isActive = value === option.status

        return (
          <button
            key={option.status}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(option.status)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors outline-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isActive
                ? option.activeClass
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {STATUS_MAP.attendance[option.status].label}
          </button>
        )
      })}
    </div>
  )
}

export { AttendanceStatusToggle }
