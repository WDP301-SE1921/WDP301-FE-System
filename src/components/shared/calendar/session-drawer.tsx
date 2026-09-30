"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { type SessionBlockProps } from "./session-block"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Location01Icon,
  Calendar01Icon,
  UserGroupIcon,
  CheckmarkSquare01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"

export interface SessionDetail extends SessionBlockProps {
  date: string
  totalStudents?: number
  attendedCount?: number
  absentStudents?: Array<{ id: string; name: string; reason?: string }>
  onTakeAttendance?: () => void
  onRequestReschedule?: () => void
  onViewClassDetail?: () => void
  /** Giáo viên báo nghỉ buổi này (chỉ truyền khi được phép báo). */
  onReportAbsence?: () => void
  /** Dòng thông báo nổi bật dưới tiêu đề, vd "Đã báo nghỉ — chờ xử lý". */
  notice?: string
}

export interface SessionDrawerProps {
  session: SessionDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Slide-over Sheet drawer displaying detailed class session information,
 * attendance stats, absent list, and quick action links.
 */
function SessionDrawer({ session, open, onOpenChange }: SessionDrawerProps) {
  if (!session) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <SubjectTag code={session.subject} />
            <Badge variant="secondary" className="text-xs">
              {session.status === "COMPLETED"
                ? "Đã hoàn thành"
                : session.status === "CANCELLED"
                ? "Đã hủy"
                : session.status === "SUBSTITUTE"
                ? "Dạy thay"
                : "Sắp diễn ra"}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold">{session.title}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <HugeiconsIcon icon={Calendar01Icon} className="size-3.5" />
            {session.date} ({session.time})
          </SheetDescription>
        </SheetHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {session.notice && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200">
              {session.notice}
            </p>
          )}

          {/* Room & Teacher */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Phòng học</p>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
                {session.room || "Chưa xếp phòng"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Giáo viên</p>
              <UserCell name={session.teacherName || "Chưa phân công"} />

            </div>
          </div>

          {/* Attendance Stats */}
          {session.totalStudents !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
                  Sĩ số lớp ({session.attendedCount ?? 0}/{session.totalStudents})
                </h4>
              </div>

              {session.absentStudents && session.absentStudents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-destructive">
                    Học sinh vắng ({session.absentStudents.length}):
                  </p>
                  <ul className="space-y-1.5">
                    {session.absentStudents.map((st) => (
                      <li
                        key={st.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-destructive/5 border border-destructive/10"
                      >
                        <span className="font-medium text-foreground">{st.name}</span>
                        {st.reason && (
                          <span className="text-muted-foreground italic">{st.reason}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 border-t border-border bg-card flex flex-col gap-2">
          {session.onTakeAttendance && (
            <Button onClick={session.onTakeAttendance} className="w-full gap-2 rounded-xl">
              <HugeiconsIcon icon={CheckmarkSquare01Icon} className="size-4" />
              Điểm danh buổi học
            </Button>
          )}

          {session.onReportAbsence && (
            <Button
              variant="outline"
              onClick={session.onReportAbsence}
              className="w-full rounded-xl text-destructive hover:text-destructive"
            >
              Báo nghỉ buổi này
            </Button>
          )}

          <div className="flex items-center gap-2">
            {session.onRequestReschedule && (
              <Button
                variant="outline"
                onClick={session.onRequestReschedule}
                className="flex-1 gap-1.5 rounded-xl text-xs"
              >
                <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
                Đổi lịch / Học bù
              </Button>
            )}

            {session.onViewClassDetail && (
              <Button
                variant="secondary"
                onClick={session.onViewClassDetail}
                className="flex-1 rounded-xl text-xs"
              >
                Chi tiết lớp học
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { SessionDrawer }
