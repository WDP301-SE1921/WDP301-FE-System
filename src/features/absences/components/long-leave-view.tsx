"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { DateText } from "@/components/shared/display/date-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { ERROR_MSG } from "@/constants/messages/error"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { useEndLongLeaveEarly, useLongLeaves } from "@/features/absences/hooks/use-absences"
import type { LongLeaveRow } from "@/features/absences/selectors"
import { MockError } from "@/mocks/utils/mock-query"
import { CreateLongLeaveDialog } from "./create-long-leave-dialog"

function LongLeaveView() {
  const longLeaves = useLongLeaves()
  const endEarly = useEndLongLeaveEarly()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [endingId, setEndingId] = React.useState<string | null>(null)

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [status] = useQueryState("status", parseAsString.withDefault("active"))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => longLeaves.data?.rows ?? [], [longLeaves.data])
  const totals = longLeaves.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (row.status !== status) return false
      if (!keyword) return true
      return (
        row.student?.name.toLowerCase().includes(keyword) ||
        row.student?.code.toLowerCase().includes(keyword)
      )
    })
  }, [rows, search, status])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<LongLeaveRow>[]>(
    () => [
      {
        id: "student",
        header: ABSENCE_MSG.COL_LL_STUDENT,
        cell: ({ row }) => (
          <UserCell name={row.original.student?.name ?? "—"} sub={row.original.student?.code} />
        ),
      },
      {
        id: "scope",
        header: ABSENCE_MSG.COL_LL_SUBJECT_SCOPE,
        cell: ({ row }) =>
          row.original.subjectCodes.length === 0 ? (
            <Badge variant="secondary" className="rounded-full">
              {ABSENCE_MSG.ALL_SUBJECTS}
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-1">
              {row.original.subjectCodes.map((code) => (
                <SubjectTag key={code} code={code} />
              ))}
            </div>
          ),
      },
      {
        id: "from",
        header: ABSENCE_MSG.COL_LL_FROM,
        cell: ({ row }) => <DateText value={row.original.leave.startDate} />,
      },
      {
        id: "to",
        header: ABSENCE_MSG.COL_LL_TO,
        cell: ({ row }) => <DateText value={row.original.leave.endDate} />,
      },
      {
        id: "excused",
        header: ABSENCE_MSG.COL_LL_EXCUSED_COUNT,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-foreground">
            {ABSENCE_MSG.EXCUSED_COUNT(row.original.affectedSessionCount)}
          </span>
        ),
      },
      {
        id: "reason",
        header: ABSENCE_MSG.COL_LL_REASON,
        cell: ({ row }) => (
          <p className="max-w-56 truncate text-sm text-muted-foreground" title={row.original.leave.reason}>
            {row.original.leave.reason}
          </p>
        ),
      },
      {
        id: "status",
        header: ABSENCE_MSG.COL_LL_STATUS,
        cell: ({ row }) => <StatusBadge category="longLeave" status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status !== "ended" ? (
            <RowActions
              items={[
                {
                  id: "end-early",
                  label: ABSENCE_MSG.ROW_ACTION_END_EARLY,
                  danger: true,
                  onClick: () => setEndingId(row.original.leave.id),
                },
              ]}
            />
          ) : null,
      },
    ],
    []
  )

  return (
    <PageContainer>
      <PageHeader
        title={ABSENCE_MSG.LONG_LEAVE_TITLE}
        description={ABSENCE_MSG.LONG_LEAVE_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Nghỉ học & học bù" },
          { label: ABSENCE_MSG.LONG_LEAVE_TITLE },
        ]}
        actions={
          <Button
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={Add01Icon} />}
            onClick={() => setIsCreateOpen(true)}
          >
            {ABSENCE_MSG.CREATE_LONG_LEAVE}
          </Button>
        }
      />

      <Card className="gap-4">
        <StatusTabs
          defaultValue="active"
          options={[
            { value: "active", label: ABSENCE_MSG.TAB_ACTIVE, count: totals?.active },
            { value: "upcoming", label: ABSENCE_MSG.TAB_UPCOMING, count: totals?.upcoming },
            { value: "ended", label: ABSENCE_MSG.TAB_ENDED, count: totals?.ended },
          ]}
          onChange={resetPage}
        />

        <FilterBar onClearFilters={resetPage} />

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={longLeaves.isPending}
          isError={longLeaves.isError}
          error={longLeaves.error}
          onRetry={() => longLeaves.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <CreateLongLeaveDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmDialog
        open={Boolean(endingId)}
        onOpenChange={(open) => {
          if (!open) setEndingId(null)
        }}
        variant="danger"
        title={ABSENCE_MSG.END_EARLY_CONFIRM_TITLE}
        description={ABSENCE_MSG.END_EARLY_CONFIRM_DESC}
        isLoading={endEarly.isPending}
        onConfirm={() => {
          if (!endingId) return
          endEarly.mutate(endingId, {
            onSuccess: () => {
              toast.success(ABSENCE_MSG.END_EARLY_SUCCESS)
              setEndingId(null)
            },
            onError: (error) => {
              toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
            },
          })
        }}
      />
    </PageContainer>
  )
}

export { LongLeaveView }
