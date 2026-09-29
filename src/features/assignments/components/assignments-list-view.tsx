"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { DateText } from "@/components/shared/display/date-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { ERROR_MSG } from "@/constants/messages/error"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { STATUS_MAP } from "@/constants/status"
import {
  getMyClassOptions,
  type AssignmentRow,
} from "@/features/assignments/selectors"
import { useAssignments, useCloseAssignment } from "@/features/assignments/hooks/use-assignments"
import { MockError } from "@/mocks/utils/mock-query"
import type { Assignment, AssignmentStatus, AssignmentType } from "@/types/assignment"

const ALL_VALUE = "all"

const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  practice: ASSIGNMENT_MSG.TYPE_PRACTICE,
  test: ASSIGNMENT_MSG.TYPE_TEST,
}

const TYPE_ITEMS: Record<string, string> = {
  [ALL_VALUE]: ASSIGNMENT_MSG.FILTER_ALL_TYPES,
  ...ASSIGNMENT_TYPE_LABEL,
}

const STATUS_ITEMS: Record<string, string> = {
  [ALL_VALUE]: ASSIGNMENT_MSG.FILTER_ALL_STATUS,
  ...Object.fromEntries(
    Object.entries(STATUS_MAP.assignment).map(([value, config]) => [value, config.label])
  ),
}

function AssignmentsListView() {
  const router = useRouter()
  const closeAssignment = useCloseAssignment()

  const [closingAssignment, setClosingAssignment] = React.useState<Assignment | null>(null)

  const classItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: ASSIGNMENT_MSG.FILTER_ALL_CLASSES,
      ...Object.fromEntries(getMyClassOptions().map((option) => [option.value, option.label])),
    }),
    []
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [classId, setClassId] = useQueryState("classId", parseAsString.withDefault(ALL_VALUE))
  const [type, setType] = useQueryState("type", parseAsString.withDefault(ALL_VALUE))
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault(ALL_VALUE))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const assignments = useAssignments({
    classId: classId === ALL_VALUE ? undefined : classId,
    type: type === ALL_VALUE ? undefined : (type as AssignmentType),
    status: status === ALL_VALUE ? undefined : (status as AssignmentStatus),
    search: search || undefined,
  })

  const rows = React.useMemo(() => assignments.data ?? [], [assignments.data])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const handleCloseAssignment = () => {
    if (!closingAssignment) return

    closeAssignment.mutate(closingAssignment.id, {
      onSuccess: () => {
        toast.success(ASSIGNMENT_MSG.CLOSE_SUCCESS)
        setClosingAssignment(null)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  const columns = React.useMemo<LegacyColumnDef<AssignmentRow>[]>(
    () => buildColumns({ router, onRequestClose: setClosingAssignment }),
    [router]
  )

  return (
    <PageContainer>
      <PageHeader
        title={ASSIGNMENT_MSG.LIST_TITLE}
        description={ASSIGNMENT_MSG.LIST_DESC(rows.length)}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: ASSIGNMENT_MSG.LIST_TITLE },
        ]}
        actions={
          <Button
            className="rounded-full"
            render={<Link href={ROUTES.TEACHER.ASSIGNMENT_NEW} />}
            leftIcon={<HugeiconsIcon icon={Add01Icon} />}
          >
            {ASSIGNMENT_MSG.CREATE}
          </Button>
        }
      />

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={ASSIGNMENT_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setClassId(null)
            setType(null)
            setStatus(null)
            resetPage()
          }}
        >
          <FilterSelect
            items={classItems}
            value={classId}
            width="w-48"
            onChange={(value) => {
              setClassId(value)
              resetPage()
            }}
          />
          <FilterSelect
            items={TYPE_ITEMS}
            value={type}
            width="w-36"
            onChange={(value) => {
              setType(value)
              resetPage()
            }}
          />
          <FilterSelect
            items={STATUS_ITEMS}
            value={status}
            width="w-36"
            onChange={(value) => {
              setStatus(value)
              resetPage()
            }}
          />
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={assignments.isPending}
          isError={assignments.isError}
          error={assignments.error}
          onRetry={() => assignments.refetch()}
          emptyTitle={search || classId !== ALL_VALUE || type !== ALL_VALUE || status !== ALL_VALUE
            ? EMPTY_MSG.NO_RESULT_TITLE
            : ASSIGNMENT_MSG.EMPTY_TITLE}
          emptyDescription={
            search || classId !== ALL_VALUE || type !== ALL_VALUE || status !== ALL_VALUE
              ? EMPTY_MSG.NO_RESULT_DESC
              : ASSIGNMENT_MSG.EMPTY_DESC
          }
        />

        <TablePagination totalItems={rows.length} />
      </Card>

      <ConfirmDialog
        open={Boolean(closingAssignment)}
        onOpenChange={(next) => {
          if (!next) setClosingAssignment(null)
        }}
        onConfirm={handleCloseAssignment}
        variant="danger"
        title={ASSIGNMENT_MSG.CLOSE_CONFIRM_TITLE}
        description={ASSIGNMENT_MSG.CLOSE_CONFIRM_DESC}
        confirmText={ASSIGNMENT_MSG.ACTION_CLOSE}
        isLoading={closeAssignment.isPending}
      />
    </PageContainer>
  )
}

function FilterSelect({
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

function buildColumns({
  router,
  onRequestClose,
}: {
  router: ReturnType<typeof useRouter>
  onRequestClose: (assignment: Assignment) => void
}): LegacyColumnDef<AssignmentRow>[] {
  return [
    {
      id: "title",
      header: ASSIGNMENT_MSG.COL_TITLE,
      cell: ({ row }) => (
        <span className="block max-w-64 truncate text-sm font-medium text-foreground">
          {row.original.assignment.title}
        </span>
      ),
    },
    {
      id: "class",
      header: ASSIGNMENT_MSG.COL_CLASS,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <SubjectTag code={row.original.subjectCode} />
          <span className="text-sm text-foreground">
            {row.original.classRecord?.name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "type",
      header: ASSIGNMENT_MSG.COL_TYPE,
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-full">
          {ASSIGNMENT_TYPE_LABEL[row.original.assignment.type]}
        </Badge>
      ),
    },
    {
      id: "openAt",
      header: ASSIGNMENT_MSG.COL_OPEN_AT,
      cell: ({ row }) => <DateText value={row.original.assignment.openAt} format="datetime" />,
    },
    {
      id: "dueDate",
      header: ASSIGNMENT_MSG.COL_DUE_DATE,
      cell: ({ row }) => <DateText value={row.original.assignment.dueDate} format="datetime" />,
    },
    {
      id: "submitted",
      header: ASSIGNMENT_MSG.COL_SUBMITTED,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {ASSIGNMENT_MSG.SUBMITTED_COUNT(row.original.submittedCount, row.original.totalStudents)}
        </span>
      ),
    },
    {
      id: "status",
      header: ASSIGNMENT_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="assignment" status={row.original.assignment.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              id: "edit",
              label: ASSIGNMENT_MSG.ACTION_EDIT,
              onClick: () => router.push(ROUTES.TEACHER.ASSIGNMENT_EDIT(row.original.assignment.id)),
            },
            {
              id: "submissions",
              label: ASSIGNMENT_MSG.ACTION_VIEW_SUBMISSIONS,
              onClick: () =>
                router.push(ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(row.original.assignment.id)),
            },
            "separator",
            {
              id: "close",
              label: ASSIGNMENT_MSG.ACTION_CLOSE,
              danger: true,
              disabled: row.original.assignment.status === "closed",
              onClick: () => onRequestClose(row.original.assignment),
            },
          ]}
        />
      ),
    },
  ]
}

export { AssignmentsListView }
