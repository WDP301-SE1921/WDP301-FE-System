"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"

import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { DateRangePicker } from "@/components/shared/pickers/date-range-picker"
import { AUDIT_ACTION_MAP } from "@/constants/audit"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { AuditLogTable } from "@/features/system/components/audit-log-table"
import { useAuditLog } from "@/features/system/hooks/use-audit-log"
import { MOCK_MANAGER_ACCOUNTS } from "@/mocks/data/system"

const ALL_VALUE = "all"

const ACTION_ITEMS: Record<string, string> = {
  [ALL_VALUE]: SYSTEM_MSG.AUDIT_FILTER_ALL_ACTIONS,
  ...Object.fromEntries(
    Object.entries(AUDIT_ACTION_MAP).map(([value, config]) => [value, config.label])
  ),
}

const ACTOR_ITEMS: Record<string, string> = {
  [ALL_VALUE]: SYSTEM_MSG.AUDIT_FILTER_ALL_ACTORS,
  ...Object.fromEntries(MOCK_MANAGER_ACCOUNTS.map((item) => [item.id, item.name])),
}

function AuditLogView() {
  const auditLog = useAuditLog()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [actionType, setActionType] = useQueryState(
    "actionType",
    parseAsString.withDefault(ALL_VALUE)
  )
  const [actor, setActor] = useQueryState("actor", parseAsString.withDefault(ALL_VALUE))
  const [from] = useQueryState("from", parseAsString.withDefault(""))
  const [to] = useQueryState("to", parseAsString.withDefault(""))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => auditLog.data ?? [], [auditLog.data])

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (actionType !== ALL_VALUE && row.actionType !== actionType) return false
      if (actor !== ALL_VALUE && row.actorId !== actor) return false

      const date = row.createdAt.slice(0, 10)
      if (from && date < from) return false
      if (to && date > to) return false

      if (!keyword) return true

      return row.targetLabel.toLowerCase().includes(keyword)
    })
  }, [rows, search, actionType, actor, from, to])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const resetPage = React.useCallback(() => setPage(null), [setPage])

  return (
    <PageContainer>
      <PageHeader
        title={SYSTEM_MSG.AUDIT_TITLE}
        description={SYSTEM_MSG.AUDIT_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Hệ thống" },
          { label: SYSTEM_MSG.AUDIT_TITLE },
        ]}
      />

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={SYSTEM_MSG.AUDIT_SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setActionType(null)
            setActor(null)
            resetPage()
          }}
        >
          <DateRangePicker onChange={resetPage} />

          <Select
            items={ACTION_ITEMS}
            value={actionType}
            onValueChange={(value) => {
              setActionType(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder={SYSTEM_MSG.AUDIT_FILTER_ALL_ACTIONS} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={ACTOR_ITEMS}
            value={actor}
            onValueChange={(value) => {
              setActor(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder={SYSTEM_MSG.AUDIT_FILTER_ALL_ACTORS} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTOR_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        <AuditLogTable
          rows={pagedRows}
          isLoading={auditLog.isPending}
          isError={auditLog.isError}
          error={auditLog.error}
          onRetry={() => auditLog.refetch()}
          expandedId={expandedId}
          onToggleExpand={(id) =>
            setExpandedId((current) => (current === id ? null : id))
          }
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>
    </PageContainer>
  )
}

export { AuditLogView }
