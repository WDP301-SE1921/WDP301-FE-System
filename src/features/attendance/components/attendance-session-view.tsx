"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Note01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { UserCell } from "@/components/shared/display/user-cell"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer"
import { ACTION_LABEL } from "@/constants/messages/common"
import { TEACHER_ATTENDANCE_MSG } from "@/constants/messages/events/teacher-portal"
import { ROUTES } from "@/constants/routes"
import { formatDate } from "@/lib/format"
import { AttendanceStatusToggle } from "@/features/attendance/components/attendance-status-toggle"
import {
  useAttendanceSession,
  useSaveAttendance,
} from "@/features/attendance/hooks/use-attendance"
import type { AttendanceSessionDetail } from "@/features/attendance/selectors"
import type { AttendanceStatus } from "@/types/student"

export interface AttendanceSessionViewProps {
  sessionId: string
}

interface RosterEntry {
  studentProfileId: string
  name: string
  code: string
  status: AttendanceStatus
  note: string
  canExcuse: boolean
}

function AttendanceSessionView({ sessionId }: AttendanceSessionViewProps) {
  const router = useRouter()
  const sessionQuery = useAttendanceSession(sessionId)
  const saveMutation = useSaveAttendance()

  const [roster, setRoster] = React.useState<RosterEntry[]>([])
  const [syncedDetail, setSyncedDetail] = React.useState<AttendanceSessionDetail | null>(
    null
  )
  const [expandedNotes, setExpandedNotes] = React.useState<Set<string>>(new Set())

  // Đồng bộ state cục bộ theo dữ liệu vừa tải — "adjust state during render",
  // không dùng useEffect (tránh lỗi lint react-hooks/set-state-in-effect).
  if (sessionQuery.data && sessionQuery.data !== syncedDetail) {
    setSyncedDetail(sessionQuery.data)
    setRoster(
      sessionQuery.data.roster.map((entry) => ({
        studentProfileId: entry.studentProfileId,
        name: entry.name,
        code: entry.code,
        status: entry.status,
        note: entry.note ?? "",
        canExcuse: entry.canExcuse,
      }))
    )
  }

  const presentCount = roster.filter((entry) => entry.status === "present").length

  function updateStatus(studentProfileId: string, status: AttendanceStatus) {
    setRoster((prev) =>
      prev.map((entry) =>
        entry.studentProfileId === studentProfileId ? { ...entry, status } : entry
      )
    )
  }

  function updateNote(studentProfileId: string, note: string) {
    setRoster((prev) =>
      prev.map((entry) =>
        entry.studentProfileId === studentProfileId ? { ...entry, note } : entry
      )
    )
  }

  function toggleNoteVisible(studentProfileId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(studentProfileId)) next.delete(studentProfileId)
      else next.add(studentProfileId)
      return next
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    saveMutation.mutate(
      {
        sessionId,
        records: roster.map((entry) => ({
          studentProfileId: entry.studentProfileId,
          status: entry.status,
          note: entry.note.trim() || undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success(TEACHER_ATTENDANCE_MSG.SAVE_SUCCESS)
          router.push(ROUTES.TEACHER.ATTENDANCE)
        },
      }
    )
  }

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={sessionQuery.isPending}
        isError={sessionQuery.isError}
        error={sessionQuery.error}
        onRetry={() => sessionQuery.refetch()}
        skeleton={<SkeletonTable rows={6} />}
      >
        {sessionQuery.data === null ? (
          <ErrorState
            title={TEACHER_ATTENDANCE_MSG.SESSION_NOT_FOUND_TITLE}
            message={TEACHER_ATTENDANCE_MSG.SESSION_NOT_FOUND_DESC}
          />
        ) : (
          sessionQuery.data && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PageHeader
                title={sessionQuery.data.classRecord.name}
                description={`${sessionQuery.data.lessonTitle} · ${sessionQuery.data.session.startTime}–${sessionQuery.data.session.endTime} · ${sessionQuery.data.classRecord.room}`}
                backHref={ROUTES.TEACHER.ATTENDANCE}
                breadcrumbs={[
                  { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
                  { label: TEACHER_ATTENDANCE_MSG.LIST_TITLE, href: ROUTES.TEACHER.ATTENDANCE },
                  {
                    label: `${sessionQuery.data.classRecord.name} · ${formatDate(
                      sessionQuery.data.session.date,
                      "dd/MM/yyyy"
                    )}`,
                  },
                ]}
              />

              <Card className="flex-row flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {TEACHER_ATTENDANCE_MSG.STUDENT_COUNT(roster.length)}
                </span>
                <Badge variant="success" className="rounded-full">
                  {TEACHER_ATTENDANCE_MSG.SELECTED_PRESENT_COUNT(presentCount)}
                </Badge>
              </Card>

              <Card className="gap-0 p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{TEACHER_ATTENDANCE_MSG.COL_STUDENT}</TableHead>
                      <TableHead>{TEACHER_ATTENDANCE_MSG.COL_STATUS}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map((entry) => {
                      const noteVisible = expandedNotes.has(entry.studentProfileId)

                      return (
                        <TableRow key={entry.studentProfileId} className="group">
                          <TableCell>
                            <UserCell name={entry.name} sub={entry.code} />
                            {noteVisible && (
                              <Input
                                value={entry.note}
                                onChange={(event) =>
                                  updateNote(entry.studentProfileId, event.target.value)
                                }
                                placeholder={TEACHER_ATTENDANCE_MSG.NOTE_PLACEHOLDER}
                                className="mt-2 h-8 text-xs"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <AttendanceStatusToggle
                              value={entry.status}
                              canExcuse={entry.canExcuse}
                              onChange={(status) =>
                                updateStatus(entry.studentProfileId, status)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className={
                                noteVisible
                                  ? "text-primary"
                                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
                              }
                              onClick={() => toggleNoteVisible(entry.studentProfileId)}
                            >
                              <HugeiconsIcon icon={Note01Icon} className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                {TEACHER_ATTENDANCE_MSG.FOOTER_NOTE}
              </p>

              <StickyFormFooter
                onBack={() => router.push(ROUTES.TEACHER.ATTENDANCE)}
                backLabel={ACTION_LABEL.CANCEL}
                submitLabel={TEACHER_ATTENDANCE_MSG.SAVE_ATTENDANCE}
                isSubmitting={saveMutation.isPending}
              />
            </form>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

export { AttendanceSessionView }
