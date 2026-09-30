"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkSquare01Icon,
  InformationCircleIcon,
  LockIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import { STATUS_MAP } from "@/constants/status"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { canManageAccounts } from "@/constants/role-access"
import { useRoleAccess } from "@/hooks/use-current-role"
import {
  ParentAccountDialogs,
  type ParentAccountDialogTarget,
} from "@/features/parents/components/parent-account-dialogs"
import { useParents } from "@/features/parents/hooks/use-parents"
import {
  getAverageChildrenPerParent,
  type ParentRow,
} from "@/features/parents/selectors"

const ALL_VALUE = "all"
const MANY_CHILDREN = "3+"

const STATUS_ITEMS: Record<string, string> = {
  [ALL_VALUE]: PARENT_MSG.FILTER_ALL_STATUS,
  ...Object.fromEntries(
    Object.entries(STATUS_MAP.parentAccount).map(([value, config]) => [
      value,
      config.label,
    ])
  ),
}

const CHILD_COUNT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: PARENT_MSG.FILTER_ALL_CHILD_COUNT,
  "1": PARENT_MSG.FILTER_CHILD_COUNT(1),
  "2": PARENT_MSG.FILTER_CHILD_COUNT(2),
  [MANY_CHILDREN]: PARENT_MSG.FILTER_CHILD_COUNT_MANY,
}

function ParentsView() {
  const router = useRouter()
  const { role, canAccess } = useRoleAccess()
  const parents = useParents()
  const [dialogTarget, setDialogTarget] = React.useState<ParentAccountDialogTarget | null>(null)
  const canManage = canManageAccounts(role)

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault(ALL_VALUE))
  const [childCount, setChildCount] = useQueryState(
    "children",
    parseAsString.withDefault(ALL_VALUE)
  )

  const rows = React.useMemo(() => parents.data ?? [], [parents.data])

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (status !== ALL_VALUE && row.parent.status !== status) return false

      if (childCount !== ALL_VALUE) {
        const matchesCount =
          childCount === MANY_CHILDREN
            ? row.childCount >= 3
            : row.childCount === Number(childCount)
        if (!matchesCount) return false
      }

      if (!keyword) return true

      return (
        row.parent.email.toLowerCase().includes(keyword) ||
        row.parent.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, "")) ||
        row.children.some((child) =>
          child.student.name.toLowerCase().includes(keyword)
        )
      )
    })
  }, [rows, search, status, childCount])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const summary = React.useMemo(() => {
    const totalChildren = rows.reduce((sum, row) => sum + row.childCount, 0)

    return {
      total: rows.length,
      activated: rows.filter((row) => row.parent.status === "activated").length,
      disabled: rows.filter((row) => row.parent.status === "disabled").length,
      totalChildren,
      average: getAverageChildrenPerParent(rows),
    }
  }, [rows])

  const activatedPercent =
    summary.total === 0
      ? 0
      : Math.round((summary.activated / summary.total) * 100)

  const columns = React.useMemo<LegacyColumnDef<ParentRow>[]>(
    () =>
      buildColumns(router, {
        canEnroll: canAccess(ROUTES.MANAGER.ENROLLMENT_NEW),
        canManage,
        onDialog: setDialogTarget,
      }),
    [router, canAccess, canManage]
  )

  return (
    <PageContainer>
      <PageHeader
        title={PARENT_MSG.LIST_TITLE}
        description={PARENT_MSG.LIST_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Học sinh & Phụ huynh" },
          { label: PARENT_MSG.LIST_TITLE },
        ]}
        actions={
          <ExportButton
            variant="outline"
            className="rounded-full"
            onExport={() => {
              toast.success(PARENT_MSG.EXPORT_SUCCESS)
            }}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={PARENT_MSG.KPI_TOTAL}
          value={summary.total}
          sub={PARENT_MSG.KPI_TOTAL_SUB}
          trend="up"
          trendLabel="+12 tháng này"
          color="blue"
          icon={<HugeiconsIcon icon={UserGroupIcon} />}
        />
        <KpiCard
          title={PARENT_MSG.KPI_ACTIVATED}
          value={summary.activated}
          sub={PARENT_MSG.KPI_ACTIVATED_SUB}
          trend="up"
          trendLabel={`${activatedPercent}%`}
          color="green"
          icon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
        />
        <KpiCard
          title={PARENT_MSG.KPI_DISABLED}
          value={summary.disabled}
          sub={PARENT_MSG.KPI_DISABLED_SUB}
          color="amber"
          icon={<HugeiconsIcon icon={LockIcon} />}
        />
        <KpiCard
          title={PARENT_MSG.KPI_RATIO}
          value={summary.average}
          sub={PARENT_MSG.KPI_RATIO_SUB(summary.totalChildren)}
          color="purple"
          icon={<HugeiconsIcon icon={UserIcon} />}
        />
      </div>

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={PARENT_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setStatus(null)
            setChildCount(null)
            resetPage()
          }}
        >
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(value) => {
              setStatus(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder={PARENT_MSG.FILTER_ALL_STATUS} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={CHILD_COUNT_ITEMS}
            value={childCount}
            onValueChange={(value) => {
              setChildCount(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder={PARENT_MSG.FILTER_ALL_CHILD_COUNT} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHILD_COUNT_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">
            Tổng số: {filteredRows.length} phụ huynh
          </span>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          selectable
          isLoading={parents.isPending}
          isError={parents.isError}
          error={parents.error}
          onRetry={() => parents.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
          onRowClick={(row) => router.push(ROUTES.MANAGER.PARENT_DETAIL(row.parent.id))}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{PARENT_MSG.RULE_NOTE_TITLE}</AlertTitle>
        <AlertDescription>{PARENT_MSG.RULE_NOTE_DESC}</AlertDescription>
      </Alert>

      <ParentAccountDialogs target={dialogTarget} onClose={() => setDialogTarget(null)} />
    </PageContainer>
  )
}

function buildColumns(
  router: ReturnType<typeof useRouter>,
  { canEnroll, canManage, onDialog }: {
    canEnroll: boolean
    canManage: boolean
    onDialog: (target: ParentAccountDialogTarget) => void
  }
): LegacyColumnDef<ParentRow>[] {
  return [
    {
      id: "email",
      header: PARENT_MSG.COL_EMAIL,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <HugeiconsIcon
            icon={UserIcon}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="truncate text-sm text-foreground">
            {row.original.parent.email}
          </span>
        </span>
      ),
    },
    {
      id: "phone",
      header: PARENT_MSG.COL_PHONE,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.parent.phone}
        </span>
      ),
    },
    {
      id: "children",
      header: PARENT_MSG.COL_CHILDREN,
      cell: ({ row }) => (
        <div className="space-y-1.5">
          <Badge variant="warning" className="rounded-full">
            {PARENT_MSG.CHILD_COUNT(row.original.childCount)}
          </Badge>
          <div className="flex flex-wrap gap-1">
            {row.original.children.map((child) => (
              <Badge key={child.student.id} variant="secondary" className="rounded-full">
                {child.student.name}
                <span className="ml-1 text-[0.625rem] opacity-70">
                  K{child.student.grade}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: PARENT_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="parentAccount" status={row.original.parent.status} />
      ),
    },
    {
      id: "createdAt",
      header: PARENT_MSG.COL_CREATED_AT,
      cell: ({ row }) => <DateText value={row.original.parent.createdAt} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              id: "detail",
              label: PARENT_MSG.ACTION_VIEW_DETAIL,
              onClick: () =>
                router.push(ROUTES.MANAGER.PARENT_DETAIL(row.original.parent.id)),
            },
            ...(canEnroll
              ? [
                  {
                    id: "enroll",
                    label: PARENT_MSG.ACTION_ENROLL,
                    disabled: row.original.parent.status === "disabled",
                    onClick: () =>
                      router.push(
                        ROUTES.MANAGER.ENROLLMENT_NEW_FOR({
                          parentId: row.original.parent.id,
                        })
                      ),
                  },
                ]
              : []),
            ...(canManage
              ? [
                  {
                    id: "edit-contact",
                    label: PARENT_MSG.ACTION_EDIT_CONTACT,
                    onClick: () => onDialog({ parent: row.original.parent, action: "edit" }),
                  },
                  "separator" as const,
                  {
                    id: "lock",
                    label:
                      row.original.parent.status === "activated"
                        ? PARENT_MSG.ACTION_LOCK_ACCOUNT
                        : PARENT_MSG.ACTION_UNLOCK_ACCOUNT,
                    danger: row.original.parent.status === "activated",
                    onClick: () =>
                      onDialog({ parent: row.original.parent, action: "toggle-lock" }),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]
}

export { ParentsView }
