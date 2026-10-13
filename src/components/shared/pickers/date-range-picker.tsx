"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ACTION_LABEL } from "@/constants/messages/common"
import { formatDate } from "@/lib/format"

export interface DateRangePickerProps {
  /** Query param giữ ngày bắt đầu (ISO `yyyy-MM-dd`). */
  fromParamKey?: string
  /** Query param giữ ngày kết thúc (ISO `yyyy-MM-dd`). */
  toParamKey?: string
  placeholder?: string
  /** Gọi sau mỗi lần đổi khoảng ngày — dùng để reset page về 1. */
  onChange?: () => void
  className?: string
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Chọn khoảng ngày, state đồng bộ qua `nuqs` thay vì giữ cục bộ — theo
 * `.claude/rules/implement-ui.md`. Bấm lần 1 chọn ngày bắt đầu, lần 2 chọn ngày
 * kết thúc; bấm ngày trước ngày bắt đầu sẽ bắt đầu lại khoảng mới.
 */
function DateRangePicker({
  fromParamKey = "from",
  toParamKey = "to",
  placeholder = "Chọn khoảng ngày",
  onChange,
  className,
}: DateRangePickerProps) {
  const [from, setFrom] = useQueryState(fromParamKey, parseAsString.withDefault(""))
  const [to, setTo] = useQueryState(toParamKey, parseAsString.withDefault(""))
  const [isOpen, setIsOpen] = React.useState(false)

  const label =
    from && to
      ? `${formatDate(from)} – ${formatDate(to)}`
      : from
        ? `Từ ${formatDate(from)}`
        : placeholder

  const handleSelect = (date: Date) => {
    const picked = toIsoDate(date)

    // Chưa có khoảng, hoặc đã đủ khoảng → bắt đầu khoảng mới.
    if (!from || (from && to)) {
      setFrom(picked)
      setTo(null)
      onChange?.()
      return
    }

    if (picked < from) {
      setFrom(picked)
      onChange?.()
      return
    }

    setTo(picked)
    setIsOpen(false)
    onChange?.()
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    setFrom(null)
    setTo(null)
    onChange?.()
  }

  const hasValue = Boolean(from || to)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("gap-2 rounded-xl font-normal", className)}
            leftIcon={<HugeiconsIcon icon={Calendar01Icon} />}
          >
            <span className={hasValue ? "text-foreground" : "text-muted-foreground"}>
              {label}
            </span>
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                aria-label={ACTION_LABEL.CLEAR_FILTER}
                onClick={handleClear}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    handleClear(event as unknown as React.MouseEvent)
                  }
                }}
                className="inline-flex items-center text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          selected={to ? new Date(to) : from ? new Date(from) : undefined}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
