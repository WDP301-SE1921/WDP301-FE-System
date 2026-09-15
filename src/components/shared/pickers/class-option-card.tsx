import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { MoneyText } from "@/components/shared/display/money-text"
import { SelectableCard } from "./selectable-card"
import { cn } from "cn"

export interface ClassOption {
  id?: string
  code: string
  name?: string
  subjectCode?: string
  subject?: string
  days?: number[]
  schedule?: string
  time?: string
  room?: string
  teacherName: string
  enrolled: number
  capacity: number
  fee?: number
}

export interface ClassOptionCardProps {
  option?: ClassOption
  code?: string
  name?: string
  subject?: string
  subjectCode?: string
  days?: number[]
  schedule?: string
  time?: string
  room?: string
  teacherName?: string
  enrolled?: number
  capacity?: number
  fee?: number
  selected?: boolean
  onSelect?: () => void
  className?: string
}

/**
 * Rich card variant of SelectableCard pre-configured for class selection.
 * Shows code, name, schedule, teacher, fee, and enrollment capacity.
 */
function ClassOptionCard({
  option,
  code: propCode,
  name: propName,
  subject: propSubject,
  subjectCode: propSubjectCode,
  days: propDays,
  schedule: propSchedule,
  time: propTime,
  room: propRoom,
  teacherName: propTeacherName,
  enrolled: propEnrolled,
  capacity: propCapacity,
  fee: propFee,
  selected,
  onSelect,
  className,
}: ClassOptionCardProps) {
  const code = option?.code ?? propCode ?? ""
  const name = option?.name ?? propName ?? code
  const subject = option?.subject ?? option?.subjectCode ?? propSubject ?? propSubjectCode ?? "MATH"
  const teacherName = option?.teacherName ?? propTeacherName ?? ""
  const enrolled = option?.enrolled ?? propEnrolled ?? 0
  const capacity = option?.capacity ?? propCapacity ?? 30
  const schedule = option?.schedule ?? propSchedule
  const days = option?.days ?? propDays
  const time = option?.time ?? propTime ?? ""
  const room = option?.room ?? propRoom
  const fee = option?.fee ?? propFee

  const availableSlots = capacity - enrolled
  const isFull = availableSlots <= 0

  return (
    <SelectableCard
      selected={selected}
      disabled={isFull}
      onSelect={onSelect}
      className={cn(className)}
    >
      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="flex items-center gap-2">
          <SubjectTag code={subject} />
          <div>
            <p className="font-semibold text-foreground text-sm leading-tight">{name}</p>
            <p className="text-xs font-mono text-muted-foreground">{code}</p>
          </div>
        </div>
        {isFull ? (
          <Badge variant="danger" className="shrink-0">Hết chỗ</Badge>
        ) : (
          <Badge variant="info" className="shrink-0 tabular-nums">
            Còn {availableSlots} chỗ
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {schedule ? (
          <span>{schedule}</span>
        ) : (
          <ScheduleText days={days} time={time} room={room} />
        )}
        <span>GV: {teacherName}</span>
        {fee !== undefined && (
          <MoneyText amount={fee} className="text-xs font-semibold text-foreground mt-0.5" />
        )}
      </div>

      <ProgressStat
        value={enrolled}
        max={capacity}
        description={`${enrolled}/${capacity} học sinh`}
      />
    </SelectableCard>
  )
}

export { ClassOptionCard }
