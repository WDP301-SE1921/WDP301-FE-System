import { cn } from "cn"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { DASHBOARD_MSG } from "@/constants/messages/events/dashboard"

export interface AttendanceBarChartProps {
  data: Array<{ day: string; rate: number; isToday?: boolean }>
}

/**
 * Biểu đồ cột tỷ lệ đi học 7 ngày. Dựng bằng div + Tailwind thay vì thư viện chart
 * để không thêm dependency ngoài `.claude/rules/tech-stack.md`.
 */
function AttendanceBarChart({ data }: AttendanceBarChartProps) {
  const target = BUSINESS_RULES.ATTENDANCE_RATE_TARGET
  const maxRate = Math.max(...data.map((item) => item.rate), target)

  return (
    <div className="space-y-3">
      <div className="relative flex h-44 items-end gap-2 sm:gap-3">
        {/* Đường mục tiêu */}
        <div
          aria-hidden
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
          style={{ bottom: `${(target / maxRate) * 100}%` }}
        >
          <span className="absolute -top-5 right-0 text-[0.625rem] font-medium text-muted-foreground">
            {DASHBOARD_MSG.WEEKLY_CHART_TARGET(target)}
          </span>
        </div>

        {data.map((item) => (
          <div
            key={item.day}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            {item.isToday && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary-foreground tabular-nums">
                {item.rate}%
              </span>
            )}
            <div
              role="img"
              aria-label={`${item.day}: ${item.rate}%`}
              className={cn(
                "w-full rounded-t-xl transition-colors",
                item.isToday ? "bg-primary" : "bg-primary/20"
              )}
              style={{ height: `${(item.rate / maxRate) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 sm:gap-3">
        {data.map((item) => (
          <span
            key={item.day}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-xs",
              item.isToday
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.day}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary" />
          {DASHBOARD_MSG.WEEKLY_CHART_LEGEND_TODAY}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary/20" />
          {DASHBOARD_MSG.WEEKLY_CHART_LEGEND_OTHER}
        </span>
      </div>
    </div>
  )
}

export { AttendanceBarChart }
