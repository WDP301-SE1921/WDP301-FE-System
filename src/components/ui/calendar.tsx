"use client"

import * as React from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
  month?: Date
  onMonthChange?: (month: Date) => void
}

function Calendar({
  selected,
  onSelect,
  className,
  month: customMonth,
  onMonthChange,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    selected || new Date()
  )

  const currentMonth = customMonth ?? internalMonth

  const handlePrevMonth = () => {
    const next = subMonths(currentMonth, 1)
    setInternalMonth(next)
    onMonthChange?.(next)
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    setInternalMonth(next)
    onMonthChange?.(next)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

  return (
    <div
      data-slot="calendar"
      className={cn("w-full max-w-[320px] rounded-2xl border border-border bg-card p-4 shadow-xs", className)}
    >
      {/* Month Header */}
      <div className="flex items-center justify-between pb-3">
        <span className="font-heading text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: vi })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handlePrevMonth}
            className="rounded-full"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            <span className="sr-only">Tháng trước</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNextMonth}
            className="rounded-full"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            <span className="sr-only">Tháng sau</span>
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground pb-2">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((day) => {
          const isSelectedDay = selected ? isSameDay(day, selected) : false
          const isCurrentMonthDay = isSameMonth(day, currentMonth)
          const isTodayDay = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition-colors cursor-pointer select-none mx-auto font-medium",
                !isCurrentMonthDay && "text-muted-foreground/40",
                isCurrentMonthDay && !isSelectedDay && "text-foreground hover:bg-muted",
                isTodayDay && !isSelectedDay && "border border-primary font-bold text-primary",
                isSelectedDay && "bg-primary text-primary-foreground font-semibold shadow-xs"
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
