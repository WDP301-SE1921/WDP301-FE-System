"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  InformationCircleIcon,
  Link01Icon,
  Mail01Icon,
  RefreshIcon,
  ShieldKeyIcon,
} from "@hugeicons/core-free-icons"
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
import { CopyButton } from "@/components/shared/actions/copy-button"
import { ExportButton } from "@/components/shared/actions/export-button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { CodeDisplay } from "@/components/shared/display/code-display"
import { CountdownBadge } from "@/components/shared/display/countdown-badge"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { DateRangePicker } from "@/components/shared/pickers/date-range-picker"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { LINK_CODE_MSG } from "@/constants/messages/events/link-code"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { SUBJECT_MAP } from "@/constants/subjects"
import { useLinkCodes } from "@/features/link-codes/hooks/use-link-codes"
import type { LinkCodeRow } from "@/features/payments/selectors"

const ALL_VALUE = "all"

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: "Tất cả lớp / môn",
  ...Object.fromEntries(
    Object.values(SUBJECT_MAP).map((item) => [item.code, item.name])
  ),
}

const STATUS_BY_TAB: Record<string, LinkCodeRow["status"] | undefined> = {
  [ALL_VALUE]: undefined,
  unused: "active",
  used: "used",
  expired: "expired",
}

function LinkCodesView() {
  const linkCodes = useLinkCodes()

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [tab] = useQueryState("status", parseAsString.withDefault("unused"))
  const [from] = useQueryState("from", parseAsString.withDefault(""))
  const [to] = useQueryState("to", parseAsString.withDefault(""))
  const [subject, setSubject] = useQueryState(
    "subject",
    parseAsString.withDefault(ALL_VALUE)
  )
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => linkCodes.data?.rows ?? [], [linkCodes.data])
  const totals = linkCodes.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const wantedStatus = STATUS_BY_TAB[tab]

    return rows.filter((row) => {
      if (wantedStatus && row.status !== wantedStatus) return false
      if (subject !== ALL_VALUE && row.subjectCode !== subject) return false

      const createdDate = row.createdAt.slice(0, 10)
      if (from && createdDate < from) return false
      if (to && createdDate > to) return false

      if (!keyword) return true

      return (
        row.link.code.toLowerCase().includes(keyword) ||
        (row.student?.name.toLowerCase().includes(keyword) ?? false) ||
        (row.parent?.email.toLowerCase().includes(keyword) ?? false) ||
        (row.parent?.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, "")) ??
          false)
      )
    })
  }, [rows, search, tab, subject, from, to])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<LinkCodeRow>[]>(() => buildColumns(), [])

  return (
    <PageContainer>
      <PageHeader
        title={LINK_CODE_MSG.TITLE}
        description={LINK_CODE_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Học sinh & Phụ huynh" },
          { label: LINK_CODE_MSG.TITLE },
        ]}
        actions={
          <>
            <ExportButton
              variant="outline"
              className="rounded-full"
              onExport={() => {
                toast.success(LINK_CODE_MSG.EXPORT_SUCCESS)
              }}
            />
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Link01Icon} />}
              onClick={() => toast.success(LINK_CODE_MSG.CREATE_SUCCESS)}
            >
              {LINK_CODE_MSG.CREATE}
            </Button>
          </>
        }
      />

      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title={LINK_CODE_MSG.KPI_TOTAL}
            value={totals.total}
            sub={LINK_CODE_MSG.KPI_TOTAL_SUB}
            trend="up"
            trendLabel="+18 tuần này"
            color="blue"
            icon={<HugeiconsIcon icon={Link01Icon} />}
          />
          <KpiCard
            title={LINK_CODE_MSG.KPI_UNUSED}
            value={totals.unused}
            sub={LINK_CODE_MSG.KPI_UNUSED_NOTE(
              BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS
            )}
            trend="neutral"
            trendLabel={LINK_CODE_MSG.KPI_UNUSED_SUB}
            color="amber"
            icon={<HugeiconsIcon icon={Clock01Icon} />}
          />
          <KpiCard
            title={LINK_CODE_MSG.KPI_ACTIVATED}
            value={totals.used}
            sub={LINK_CODE_MSG.KPI_ACTIVATED_SUB(totals.activatedPercent)}
            color="green"
            icon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
          />
          <KpiCard
            title={LINK_CODE_MSG.KPI_EXPIRED(
              BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS
            )}
            value={totals.expired}
            sub={LINK_CODE_MSG.KPI_EXPIRED_NOTE}
            trend="down"
            trendLabel={LINK_CODE_MSG.KPI_EXPIRED_SUB}
            color="red"
            icon={<HugeiconsIcon icon={Alert01Icon} />}
          />
        </div>
      )}

      <Card className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusTabs
            defaultValue="unused"
            options={[
              { value: "unused", label: LINK_CODE_MSG.TAB_UNUSED, count: totals?.unused },
              { value: "used", label: LINK_CODE_MSG.TAB_USED, count: totals?.used },
              {
                value: "expired",
                label: LINK_CODE_MSG.TAB_EXPIRED,
                count: totals?.expired,
              },
              { value: ALL_VALUE, label: LINK_CODE_MSG.TAB_ALL, count: totals?.total },
            ]}
            onChange={resetPage}
          />
          <span className="text-xs text-muted-foreground">
            {LINK_CODE_MSG.AUTO_RENEW_NOTE}
          </span>
        </div>

        <FilterBar
          searchPlaceholder={LINK_CODE_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setSubject(null)
            resetPage()
          }}
        >
          <DateRangePicker onChange={resetPage} />

          <Select
            items={SUBJECT_ITEMS}
            value={subject}
            onValueChange={(value) => {
              setSubject(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder={SUBJECT_ITEMS[ALL_VALUE]} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUBJECT_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">
            Hiển thị {pagedRows.length} trên {filteredRows.length} mã
          </span>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={linkCodes.isPending}
          isError={linkCodes.isError}
          error={linkCodes.error}
          onRetry={() => linkCodes.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <Card className="gap-4">
        <p className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={ShieldKeyIcon} className="size-4.5" />
          </span>
          {LINK_CODE_MSG.NOTE_TITLE}
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <NoteBlock
            title={LINK_CODE_MSG.NOTE_1_TITLE}
            description={LINK_CODE_MSG.NOTE_1_DESC}
          />
          <NoteBlock
            title={LINK_CODE_MSG.NOTE_2_TITLE(
              BUSINESS_RULES.ACTIVATION_LINK_EXPIRY_DAYS
            )}
            description={LINK_CODE_MSG.NOTE_2_DESC}
          />
          <NoteBlock
            title={LINK_CODE_MSG.NOTE_3_TITLE}
            description={LINK_CODE_MSG.NOTE_3_DESC}
          />
        </div>
      </Card>
    </PageContainer>
  )
}

function NoteBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <p className="flex items-start gap-1.5 text-sm font-medium text-foreground">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          className="mt-0.5 size-3.5 shrink-0 text-primary"
        />
        {title}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function buildColumns(): LegacyColumnDef<LinkCodeRow>[] {
  return [
    {
      id: "code",
      header: LINK_CODE_MSG.COL_CODE,
      cell: ({ row }) => (
        // Chỉ hiển thị `code`; `token` là credential dùng một lần, không render.
        <div className="flex items-center gap-1">
          <CodeDisplay value={row.original.link.code} boxed />
          <CopyButton
            value={row.original.link.code}
            size="icon-sm"
            variant="ghost"
            aria-label={LINK_CODE_MSG.ACTION_COPY}
          />
        </div>
      ),
    },
    {
      id: "student",
      header: LINK_CODE_MSG.COL_STUDENT,
      cell: ({ row }) =>
        row.original.student ? (
          <UserCell
            name={row.original.student.name}
            sub={STUDENT_MSG.GRADE_LABEL(row.original.student.grade)}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "parent",
      header: LINK_CODE_MSG.COL_PARENT,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {row.original.parent?.email ?? "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.parent?.phone ?? ""}
          </p>
        </div>
      ),
    },
    {
      id: "subject",
      header: LINK_CODE_MSG.COL_SUBJECT,
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.subjectCode && <SubjectTag code={row.original.subjectCode} />}
          <p className="text-xs text-muted-foreground">
            {row.original.classRecord?.name ?? ""}
          </p>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: LINK_CODE_MSG.COL_CREATED_AT,
      cell: ({ row }) => <DateText value={row.original.createdAt} format="datetime" />,
    },
    {
      id: "expires",
      header: LINK_CODE_MSG.COL_EXPIRES,
      cell: ({ row }) =>
        row.original.status === "expired" ? (
          <Badge variant="danger" className="rounded-full">
            {LINK_CODE_MSG.EXPIRED_TODAY}
          </Badge>
        ) : (
          <CountdownBadge
            target={row.original.link.expiresAt}
            warningHours={48}
            dangerHours={24}
          />
        ),
    },
    {
      id: "status",
      header: LINK_CODE_MSG.COL_STATUS,
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge category="linkCode" status={row.original.status} />
          {row.original.status === "active" && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Mail01Icon} className="size-3" />
              {LINK_CODE_MSG.STATUS_SENT_EMAIL}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              id: "resend",
              label: LINK_CODE_MSG.ACTION_RESEND,
              iconName: Mail01Icon,
              disabled: row.original.status === "used",
              onClick: () => toast.success(LINK_CODE_MSG.RESEND_SUCCESS),
            },
            {
              id: "regenerate",
              label: LINK_CODE_MSG.ACTION_REGENERATE,
              iconName: RefreshIcon,
              onClick: () => toast.success(LINK_CODE_MSG.REGENERATE_SUCCESS),
            },
          ]}
        />
      ),
    },
  ]
}

export { LinkCodesView }
