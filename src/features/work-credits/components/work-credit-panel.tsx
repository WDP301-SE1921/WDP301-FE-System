"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  InformationCircleIcon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { WORK_CREDIT_MSG } from "@/constants/messages/events/work-credit"
import { findTeacher } from "@/mocks/data/catalog"
import {
  AdjustWorkCreditDialog,
  type AdjustWorkCreditTarget,
} from "@/features/work-credits/components/adjust-work-credit-dialog"
import {
  WorkCreditMonthSelect,
  useWorkCreditMonth,
} from "@/features/work-credits/components/work-credit-month-select"
import { WorkCreditSessionTable } from "@/features/work-credits/components/work-credit-session-table"
import { useTeacherWorkCredits } from "@/features/work-credits/hooks/use-work-credits"

export interface WorkCreditPanelProps {
  teacherId: string
  /** Quản lý trung tâm / admin ghi nhận công thủ công cho buổi chưa chốt; giáo viên chỉ xem. */
  canAdjust?: boolean
}

/**
 * Công của một giáo viên theo tháng. Không phải trang riêng — gắn vào tab "Công" của Chi tiết
 * giáo viên (quản lý) và vào trang Điểm danh (giáo viên), vì công tính từ điểm danh.
 */
function WorkCreditPanel({ teacherId, canAdjust = false }: WorkCreditPanelProps) {
  const [month, setMonth] = useWorkCreditMonth()
  const credits = useTeacherWorkCredits(teacherId, month)
  const [adjustTarget, setAdjustTarget] = React.useState<AdjustWorkCreditTarget | null>(null)
  const summary = credits.data?.summary
  const teacherName = findTeacher(teacherId)?.name ?? ""

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{WORK_CREDIT_MSG.PANEL_DESC}</p>
        <WorkCreditMonthSelect month={month} onChange={setMonth} />
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            title={WORK_CREDIT_MSG.KPI_CREDITS}
            value={summary.credits}
            sub={WORK_CREDIT_MSG.KPI_CREDITS_SUB}
            color="green"
            icon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
          />
          <KpiCard
            title={WORK_CREDIT_MSG.KPI_HOURS}
            value={summary.hours}
            sub={WORK_CREDIT_MSG.KPI_HOURS_SUB}
            color="blue"
            icon={<HugeiconsIcon icon={Clock01Icon} />}
          />
          <KpiCard
            title={WORK_CREDIT_MSG.KPI_SUBSTITUTE}
            value={summary.substitutedIn}
            sub={WORK_CREDIT_MSG.KPI_SUBSTITUTE_SUB}
            color="purple"
            icon={<HugeiconsIcon icon={UserSwitchIcon} />}
          />
          <KpiCard
            title={WORK_CREDIT_MSG.KPI_ABSENT}
            value={summary.absentNotified + summary.absentUrgent}
            sub={WORK_CREDIT_MSG.KPI_ABSENT_SUB(summary.absentUrgent)}
            color="amber"
            icon={<HugeiconsIcon icon={Alert01Icon} />}
          />
          <KpiCard
            title={WORK_CREDIT_MSG.KPI_UNSETTLED}
            value={summary.unsettled}
            sub={WORK_CREDIT_MSG.KPI_UNSETTLED_SUB}
            color="red"
            icon={<HugeiconsIcon icon={Alert01Icon} />}
          />
        </div>
      )}

      {!canAdjust && summary && summary.unsettled > 0 && (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert01Icon} />
          <AlertDescription>{WORK_CREDIT_MSG.TEACHER_UNSETTLED_HINT}</AlertDescription>
        </Alert>
      )}

      <AsyncBoundary
        isLoading={credits.isPending}
        isError={credits.isError}
        error={credits.error}
        onRetry={() => credits.refetch()}
        skeleton={<SkeletonTable />}
        isEmpty={credits.data?.rows.length === 0}
        emptyProps={{
          title: WORK_CREDIT_MSG.EMPTY_TITLE,
          description: WORK_CREDIT_MSG.EMPTY_DESC,
        }}
      >
        {credits.data && (
          <WorkCreditSessionTable
            rows={credits.data.rows}
            renderAction={
              canAdjust
                ? (row) =>
                    row.status === "unsettled" ? (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() =>
                          setAdjustTarget({
                            classSessionId: row.session.id,
                            teacherId,
                            teacherName,
                            sessionLabel: `${row.classRecord?.name ?? ""} · ${row.sessionLabel} (${row.session.date})`,
                          })
                        }
                      >
                        {WORK_CREDIT_MSG.ADJUST_ACTION}
                      </Button>
                    ) : null
                : undefined
            }
          />
        )}
      </AsyncBoundary>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{WORK_CREDIT_MSG.RULE_TITLE}</AlertTitle>
        <AlertDescription>{WORK_CREDIT_MSG.RULE_DESC}</AlertDescription>
      </Alert>

      <AdjustWorkCreditDialog target={adjustTarget} onClose={() => setAdjustTarget(null)} />
    </div>
  )
}

export { WorkCreditPanel }
