import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import type { ClassRow } from "@/features/classes/selectors"

export interface TeacherClassCardProps {
  row: ClassRow
  averageAttendanceRate: number
}

/**
 * Card "Lớp của tôi" (PROMPT T3) — không dùng `ClassOptionCard` vì component đó
 * là card CHỌN lớp cho wizard đăng ký (badge "Còn X chỗ", học phí), không phải
 * card XEM lớp đang phụ trách (tỷ lệ đi học, nút "Xem lớp").
 */
function TeacherClassCard({ row, averageAttendanceRate }: TeacherClassCardProps) {
  const { classRecord, program } = row

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SubjectTag code={row.subjectCode} />
          <p className="font-heading font-semibold text-foreground">{classRecord.name}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{program?.name ?? "—"}</p>

      <ScheduleText
        days={classRecord.weekdays}
        time={`${classRecord.startTime}–${classRecord.endTime}`}
        room={classRecord.room}
      />

      <ProgressStat
        label="Sĩ số"
        value={row.enrolled}
        max={classRecord.capacity}
        description={`${row.enrolled}/${classRecord.capacity}`}
      />

      <ProgressStat
        label={TEACHER_CLASS_MSG.CARD_PROGRESS(row.completedLessons, row.totalLessons)}
        value={row.completedLessons}
        max={row.totalLessons}
      />

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{TEACHER_CLASS_MSG.CARD_ATTENDANCE_RATE}</span>
        <span className="font-semibold text-foreground tabular-nums">
          {averageAttendanceRate}%
        </span>
      </div>

      <Button
        className="w-full rounded-full"
        render={<Link href={ROUTES.TEACHER.CLASS_DETAIL(classRecord.id)} />}
      >
        {TEACHER_CLASS_MSG.ACTION_VIEW_CLASS}
      </Button>
    </Card>
  )
}

export { TeacherClassCard }
