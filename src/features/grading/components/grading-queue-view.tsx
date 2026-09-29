"use client"

import * as React from "react"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import type { RowSelectionState } from "@tanstack/react-table"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/toast"
import { BulkActionBar } from "@/components/shared/data-table/bulk-action-bar"
import { DataTable } from "@/components/shared/data-table/data-table"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { DateText } from "@/components/shared/display/date-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { CONFIRM_MSG } from "@/constants/messages/confirm"
import { ERROR_MSG } from "@/constants/messages/error"
import { GRADING_MSG } from "@/constants/messages/events/grading"
import { ROUTES } from "@/constants/routes"
import { useAssignments } from "@/features/assignments/hooks/use-assignments"
import { getMyClassOptions } from "@/features/assignments/selectors"
import {
  useBulkApproveHighConfidence,
  useGradingQueue,
  useGradingQueueCounts,
  useGradingQueueSummary,
} from "@/features/grading/hooks/use-grading"
import type { GradingQueueRow, GradingQueueTab } from "@/features/grading/selectors"
import { MockError } from "@/mocks/utils/mock-query"

const ALL_VALUE = "all"

function isHighConfidenceAiGraded(row: GradingQueueRow, highConfidenceIds: Set<string>): boolean {
  return row.submission.status === "ai_graded" && highConfidenceIds.has(row.submission.id)
}

function GradingQueueView() {
  const [classId, setClassId] = useQueryState("classId", parseAsString.withDefault(ALL_VALUE))
  const [assignmentId, setAssignmentId] = useQueryState(
    "assignmentId",
    parseAsString.withDefault(ALL_VALUE)
  )
  // `StatusTabs` tự ghi vào key "status" — đọc lại ở đây để truyền cho `useGradingQueue`.
  const [tab] = useQueryState("status", parseAsString.withDefault("pending_review"))
  const activeTab = tab as GradingQueueTab

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [bulkConfirmOpen, setBulkConfirmOpen] = React.useState(false)

  const filters = {
    classId: classId === ALL_VALUE ? undefined : classId,
    assignmentId: assignmentId === ALL_VALUE ? undefined : assignmentId,
  }

  // Reset lựa chọn khi đổi lớp/bài tập/tab — state chọn dòng gắn theo vị trí dòng
  // hiện tại nên không còn hợp lệ khi tập dữ liệu đổi. Tính trong render thay vì
  // effect (tránh lỗi lint react-hooks/set-state-in-effect).
  const filterSignature = `${classId}|${assignmentId}|${tab}`
  const [prevFilterSignature, setPrevFilterSignature] = React.useState(filterSignature)
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature)
    setRowSelection({})
  }

  const summaryQuery = useGradingQueueSummary()
  const countsQuery = useGradingQueueCounts(filters)
  const queueQuery = useGradingQueue({ ...filters, tab: activeTab })
  const assignmentOptionsQuery = useAssignments({
    classId: classId === ALL_VALUE ? undefined : classId,
  })
  const bulkApprove = useBulkApproveHighConfidence()

  const rows = React.useMemo(() => queueQuery.data ?? [], [queueQuery.data])
  const highConfidenceIds = React.useMemo(
    () => new Set(summaryQuery.data?.highConfidenceSubmissionIds ?? []),
    [summaryQuery.data]
  )

  const classItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: GRADING_MSG.FILTER_ALL_CLASSES,
      ...Object.fromEntries(getMyClassOptions().map((option) => [option.value, option.label])),
    }),
    []
  )

  const assignmentItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: GRADING_MSG.FILTER_ALL_ASSIGNMENTS,
      ...Object.fromEntries(
        (assignmentOptionsQuery.data ?? []).map((row) => [row.assignment.id, row.assignment.title])
      ),
    }),
    [assignmentOptionsQuery.data]
  )

  const tabOptions = React.useMemo(
    () => [
      {
        value: "pending_review",
        label: GRADING_MSG.TAB_PENDING_REVIEW,
        count: countsQuery.data?.pending_review,
      },
      {
        value: "reviewed",
        label: GRADING_MSG.TAB_REVIEWED,
        count: countsQuery.data?.reviewed,
      },
      {
        value: "published",
        label: GRADING_MSG.TAB_PUBLISHED,
        count: countsQuery.data?.published,
      },
    ],
    [countsQuery.data]
  )

  const columns = React.useMemo<LegacyColumnDef<GradingQueueRow>[]>(() => buildColumns(), [])

  const selectedIds = React.useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, isSelected]) => isSelected)
        .map(([index]) => rows[Number(index)]?.submission.id)
        .filter((id): id is string => Boolean(id)),
    [rowSelection, rows]
  )

  const handleBulkApprove = (submissionIds: string[]) => {
    if (submissionIds.length === 0) {
      toast.error(GRADING_MSG.BULK_APPROVE_NONE_SELECTED)
      return
    }

    bulkApprove.mutate(submissionIds, {
      onSuccess: () => {
        toast.success(GRADING_MSG.BULK_APPROVE_SUCCESS(submissionIds.length))
        setRowSelection({})
        setBulkConfirmOpen(false)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  const allHighConfidenceIds = summaryQuery.data?.highConfidenceSubmissionIds ?? []

  return (
    <PageContainer>
      <PageHeader
        title={GRADING_MSG.QUEUE_TITLE}
        description={GRADING_MSG.QUEUE_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: GRADING_MSG.QUEUE_TITLE },
        ]}
      />

      <Alert variant="warning">
        <HugeiconsIcon icon={Alert01Icon} />
        <AlertTitle>{GRADING_MSG.ALERT_TITLE}</AlertTitle>
        <AlertDescription>
          <p>
            {GRADING_MSG.ALERT_DESC(
              summaryQuery.data?.pendingReviewCount ?? 0,
              summaryQuery.data?.averageConfidence ?? 0
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={allHighConfidenceIds.length === 0}
              onClick={() => setBulkConfirmOpen(true)}
            >
              {GRADING_MSG.BULK_APPROVE_ACTION(BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD)}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled
              title={GRADING_MSG.FEATURE_IN_PROGRESS}
            >
              {GRADING_MSG.CONFIGURE_AI_CRITERIA}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Card className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusTabs defaultValue="pending_review" options={tabOptions} />

          <div className="flex flex-wrap items-center gap-2.5">
            <QueueFilterSelect
              items={classItems}
              value={classId}
              width="w-48"
              onChange={(value) => setClassId(value)}
            />
            <QueueFilterSelect
              items={assignmentItems}
              value={assignmentId}
              width="w-56"
              onChange={(value) => setAssignmentId(value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={queueQuery.isPending}
          isError={queueQuery.isError}
          error={queueQuery.error}
          onRetry={() => queueQuery.refetch()}
          selectable={
            activeTab === "pending_review"
              ? (row: GradingQueueRow) => isHighConfidenceAiGraded(row, highConfidenceIds)
              : false
          }
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          emptyTitle={GRADING_MSG.EMPTY_TITLE}
          emptyDescription={GRADING_MSG.EMPTY_DESC}
        />
      </Card>

      <BulkActionBar selectedCount={selectedIds.length} onClearSelection={() => setRowSelection({})}>
        <Button
          size="sm"
          className="rounded-full"
          isLoading={bulkApprove.isPending}
          onClick={() => handleBulkApprove(selectedIds)}
        >
          {GRADING_MSG.BULK_APPROVE_ACTION(BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD)}
        </Button>
      </BulkActionBar>

      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        onConfirm={() => handleBulkApprove(allHighConfidenceIds)}
        title={CONFIRM_MSG.BULK_APPROVE_TITLE}
        description={CONFIRM_MSG.BULK_APPROVE_DESC(
          allHighConfidenceIds.length,
          BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD
        )}
        confirmText={GRADING_MSG.BULK_APPROVE_ACTION(BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD)}
        isLoading={bulkApprove.isPending}
      />
    </PageContainer>
  )
}

function QueueFilterSelect({
  items,
  value,
  width,
  onChange,
}: {
  items: Record<string, string>
  value: string
  width: string
  onChange: (value: string | null) => void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : String(next))}
    >
      <SelectTrigger className={`${width} rounded-xl`}>
        <SelectValue placeholder={items[ALL_VALUE]} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([itemValue, label]) => (
          <SelectItem key={itemValue} value={itemValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function buildColumns(): LegacyColumnDef<GradingQueueRow>[] {
  return [
    {
      id: "student",
      header: GRADING_MSG.COL_STUDENT,
      cell: ({ row }) => (
        <UserCell name={row.original.student.name} sub={row.original.student.code} />
      ),
    },
    {
      id: "assignment",
      header: GRADING_MSG.COL_ASSIGNMENT,
      cell: ({ row }) => (
        <span className="block max-w-56 truncate text-sm text-foreground">
          {row.original.assignment.title}
        </span>
      ),
    },
    {
      id: "class",
      header: GRADING_MSG.COL_CLASS,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <SubjectTag code={row.original.subjectCode} />
          <span className="text-sm text-foreground">{row.original.classRecord?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      id: "aiScore",
      header: GRADING_MSG.COL_AI_SCORE,
      cell: ({ row }) => {
        const { submission, totalPoints } = row.original
        return (
          <span className="text-sm tabular-nums text-foreground">
            {submission.aiTotalScore !== undefined
              ? `${submission.aiTotalScore}/${totalPoints}`
              : "—"}
          </span>
        )
      },
    },
    {
      id: "aiGradedAt",
      header: GRADING_MSG.COL_GRADED_AT,
      cell: ({ row }) => <DateText value={row.original.submission.aiGradedAt} format="datetime" />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const { submission } = row.original

        if (submission.status === "ai_grading") {
          return (
            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex items-center gap-2">
                  <StatusBadge category="submission" status="ai_grading" />
                  <Spinner size="xs" className="text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>{GRADING_MSG.AI_GRADING_TOOLTIP}</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            render={<Link href={ROUTES.TEACHER.GRADING_DETAIL(submission.id)} />}
          >
            {GRADING_MSG.ACTION_REVIEW}
          </Button>
        )
      },
    },
  ]
}

export { GradingQueueView }
