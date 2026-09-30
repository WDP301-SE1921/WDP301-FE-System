"use client"

import * as React from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { TEACHER_ABSENCE_MSG } from "@/constants/messages/events/teacher-absence"
import { ROUTES } from "@/constants/routes"
import { useCancelledSessionMakeupNeeds } from "@/features/work-credits/hooks/use-work-credits"

/**
 * Buổi trung tâm hủy (vd giáo viên nghỉ đột xuất, không có người dạy thay) mà học sinh chưa
 * được xếp học bù. Bấm tên học sinh mở luồng học bù bên dưới với học sinh + buổi đã chọn sẵn.
 */
function CancelledSessionsMakeupCard() {
  const needs = useCancelledSessionMakeupNeeds()
  const rows = needs.data ?? []

  if (needs.isPending) return null

  return (
    <SectionCard
      title={TEACHER_ABSENCE_MSG.CANCELLED_MAKEUP_TITLE}
      description={TEACHER_ABSENCE_MSG.CANCELLED_MAKEUP_DESC}
      action={
        rows.length > 0 ? (
          <Badge variant="warning" className="rounded-full">
            {rows.length}
          </Badge>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState description={TEACHER_ABSENCE_MSG.CANCELLED_MAKEUP_EMPTY} className="min-h-24" />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.session.id} className="rounded-2xl border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                {row.classRecord.name} · {row.sessionLabel}{" "}
                <span className="font-normal text-muted-foreground">
                  (<DateText value={row.session.date} />)
                </span>
              </p>
              {row.session.cancelReason && (
                <p className="text-xs text-muted-foreground">{row.session.cancelReason}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {row.students.map((student) => (
                  <Button
                    key={student.id}
                    size="xs"
                    variant="outline"
                    className="rounded-full"
                    render={
                      <Link
                        href={ROUTES.MANAGER.MAKEUP_FOR({
                          studentId: student.id,
                          sessionId: row.session.id,
                        })}
                      />
                    }
                  >
                    {student.name}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export { CancelledSessionsMakeupCard }
