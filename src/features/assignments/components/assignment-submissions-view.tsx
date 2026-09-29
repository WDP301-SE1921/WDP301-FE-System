"use client"

import * as React from "react"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { DateText } from "@/components/shared/display/date-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { UserCell } from "@/components/shared/display/user-cell"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { SUBMISSION_MSG } from "@/constants/messages/events/submission"
import { ROUTES } from "@/constants/routes"
import { useAssignmentDetail } from "@/features/assignments/hooks/use-assignments"
import { useSubmissionCounts, useSubmissions } from "@/features/grading/hooks/use-grading"
import type { SubmissionCounts, SubmissionRow } from "@/features/grading/selectors"
import type { SubmissionStatus } from "@/types/assignment"

/** Map tab (nuqs `?status=`) → tập trạng thái cần lọc — bao phủ đúng 6 trạng thái. */
const TAB_STATUSES: Record<string, SubmissionStatus[] | undefined> = {
  all: undefined,
  pending: ["pending", "ai_grading"],
  ai_graded: ["ai_graded", "reviewed"],
  published: ["published"],
  not_submitted: ["not_submitted"],
}

export interface AssignmentSubmissionsViewProps {
  assignmentId: string
}

function AssignmentSubmissionsView({ assignmentId }: AssignmentSubmissionsViewProps) {
  const detailQuery = useAssignmentDetail(assignmentId)
  const countsQuery = useSubmissionCounts(assignmentId)
  // `StatusTabs` tự quản lý ghi giá trị vào cùng key này — đọc lại ở đây để lọc dữ
  // liệu, giống tiền lệ `teachers-view.tsx`/`students-view.tsx`.
  const [tab] = useQueryState("status", parseAsString.withDefault("all"))

  const submissionsQuery = useSubmissions(assignmentId, { statuses: TAB_STATUSES[tab] })
  const rows = submissionsQuery.data ?? []

  const tabOptions = React.useMemo(() => {
    const counts = countsQuery.data
    return [
      { value: "all", label: SUBMISSION_MSG.TAB_ALL, count: counts?.total },
      {
        value: "pending",
        label: SUBMISSION_MSG.TAB_PENDING,
        count: counts ? counts.submitted - counts.graded : undefined,
      },
      { value: "ai_graded", label: SUBMISSION_MSG.TAB_AI_GRADED, count: counts?.pendingReview },
      { value: "published", label: SUBMISSION_MSG.TAB_PUBLISHED, count: counts?.published },
      {
        value: "not_submitted",
        label: SUBMISSION_MSG.TAB_NOT_SUBMITTED,
        count: counts?.notSubmitted,
      },
    ]
  }, [countsQuery.data])

  const columns = React.useMemo<LegacyColumnDef<SubmissionRow>[]>(() => buildColumns(), [])

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        error={detailQuery.error}
        onRetry={() => detailQuery.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {detailQuery.data === null ? (
          <ErrorState
            title={ASSIGNMENT_MSG.NOT_FOUND_TITLE}
            message={ASSIGNMENT_MSG.NOT_FOUND_DESC}
          />
        ) : (
          detailQuery.data && (
            <div className="space-y-6">
              <PageHeader
                title={detailQuery.data.title}
                description={detailQuery.data.classRecord?.name}
                backHref={ROUTES.TEACHER.ASSIGNMENTS}
                breadcrumbs={[
                  { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
                  { label: ASSIGNMENT_MSG.LIST_TITLE, href: ROUTES.TEACHER.ASSIGNMENTS },
                  { label: detailQuery.data.title },
                ]}
              />

              <SubmissionSummaryCard
                dueDate={detailQuery.data.dueDate}
                className={detailQuery.data.classRecord?.name}
                counts={countsQuery.data}
              />

              <Card className="gap-4">
                <StatusTabs defaultValue="all" options={tabOptions} />

                <DataTable
                  columns={columns}
                  data={rows}
                  isLoading={submissionsQuery.isPending}
                  isError={submissionsQuery.isError}
                  error={submissionsQuery.error}
                  onRetry={() => submissionsQuery.refetch()}
                  emptyTitle={SUBMISSION_MSG.EMPTY_TITLE}
                  emptyDescription={SUBMISSION_MSG.EMPTY_DESC}
                />
              </Card>
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function SubmissionSummaryCard({
  dueDate,
  className,
  counts,
}: {
  dueDate: string
  className?: string
  counts?: SubmissionCounts
}) {
  const completion =
    counts && counts.total > 0 ? Math.round((counts.submitted / counts.total) * 100) : 0

  return (
    <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{SUBMISSION_MSG.SUMMARY_CLASS}</p>
        <p className="text-sm font-semibold text-foreground">{className ?? "—"}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{SUBMISSION_MSG.SUMMARY_DUE_DATE}</p>
        <DateText value={dueDate} format="datetime" />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          {counts ? SUBMISSION_MSG.SUMMARY_SUBMITTED(counts.submitted, counts.total) : "—"}
        </p>
        <ProgressStat value={completion} label={SUBMISSION_MSG.SUMMARY_COMPLETION} />
      </div>
    </Card>
  )
}

function buildColumns(): LegacyColumnDef<SubmissionRow>[] {
  return [
    {
      id: "student",
      header: SUBMISSION_MSG.COL_STUDENT,
      cell: ({ row }) => (
        <UserCell name={row.original.student.name} sub={row.original.student.code} />
      ),
    },
    {
      id: "submittedAt",
      header: SUBMISSION_MSG.COL_SUBMITTED_AT,
      cell: ({ row }) => (
        <DateText value={row.original.submission.submittedAt} format="datetime" />
      ),
    },
    {
      id: "score",
      header: SUBMISSION_MSG.COL_SCORE,
      cell: ({ row }) => {
        const { submission, totalPoints } = row.original
        const score = submission.finalTotalScore ?? submission.aiTotalScore

        return (
          <span className="text-sm tabular-nums text-foreground">
            {score !== undefined ? `${score}/${totalPoints}` : SUBMISSION_MSG.SCORE_UNAVAILABLE}
          </span>
        )
      },
    },
    {
      id: "status",
      header: SUBMISSION_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="submission" status={row.original.submission.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const { submission } = row.original

        if (submission.status === "not_submitted") {
          return <span className="text-xs text-muted-foreground">—</span>
        }

        const isReadOnly = submission.status === "reviewed" || submission.status === "published"

        return (
          <Button
            variant={isReadOnly ? "ghost" : "outline"}
            size="sm"
            className="rounded-full"
            render={<Link href={ROUTES.TEACHER.GRADING_DETAIL(submission.id)} />}
          >
            {isReadOnly ? SUBMISSION_MSG.ACTION_VIEW : SUBMISSION_MSG.ACTION_GRADE}
          </Button>
        )
      },
    },
  ]
}

export { AssignmentSubmissionsView }
