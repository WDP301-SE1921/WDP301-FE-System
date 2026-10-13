import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { DateText } from "@/components/shared/display/date-text"
import { SelectableCard } from "./selectable-card"
import { cn } from "cn"

export interface SessionOption {
  id: string
  /** Session sequence number e.g. 12 */
  sessionNo: number
  date: Date | string
  /** "08:00–10:00" */
  time?: string
  room?: string
  topic?: string
  /** Is this session eligible for makeup? */
  available?: boolean
  reason?: string
}

export interface SessionOptionListProps {
  sessions: SessionOption[]
  value?: string | null
  onChange: (id: string) => void
  className?: string
}

/**
 * List of selectable sessions for makeup class assignment.
 * Each session shows date, time, room, and topic with a SelectableCard.
 */
function SessionOptionList({
  sessions,
  value,
  onChange,
  className,
}: SessionOptionListProps) {
  if (sessions.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        Không có buổi học phù hợp.
      </p>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {sessions.map((s) => (
        <SelectableCard
          key={s.id}
          selected={value === s.id}
          disabled={!s.available}
          onSelect={() => onChange(s.id)}
        >
          <div className="flex items-start justify-between gap-2 pr-6">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">
                Buổi {s.sessionNo}
                {s.topic && <span className="ml-1.5 text-muted-foreground font-normal">— {s.topic}</span>}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <DateText value={s.date} format="date" />
                {s.time && <span>· {s.time}</span>}
                {s.room && <span>· {s.room}</span>}
              </div>
            </div>
            {!s.available && s.reason && (
              <Badge variant="neutral" className="shrink-0 text-[10px]">
                {s.reason}
              </Badge>
            )}
          </div>
        </SelectableCard>
      ))}
    </div>
  )
}

export { SessionOptionList }
