"use client"

import * as React from "react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  ChartLineData01Icon,
  InformationCircleIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { CodeDisplay } from "@/components/shared/display/code-display"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { MoneyText } from "@/components/shared/display/money-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { DateRangePicker } from "@/components/shared/pickers/date-range-picker"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { PAYMENT_MSG } from "@/constants/messages/events/payment"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { SUBJECT_MAP } from "@/constants/subjects"
import { PAYMENT_METHOD_LABEL } from "@/mocks/data/payments"
import { MOCK_STAFF_ACCOUNTS } from "@/mocks/data/staff"
import { usePayments } from "@/features/payments/hooks/use-payments"
import { ReceiptDialog } from "@/features/payments/components/receipt-dialog"
import type { PaymentRow } from "@/features/payments/selectors"

const ALL_VALUE = "all"

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: PAYMENT_MSG.FILTER_ALL_SUBJECTS,
  ...Object.fromEntries(
    Object.values(SUBJECT_MAP).map((item) => [item.code, item.name])
  ),
}

const CONFIRMER_ITEMS: Record<string, string> = {
  [ALL_VALUE]: PAYMENT_MSG.FILTER_ALL_CONFIRMERS,
  ...Object.fromEntries(
    MOCK_STAFF_ACCOUNTS.filter((item) => item.role === "staff" && item.status !== "pending").map(
      (item) => [item.id, item.name]
    )
  ),
}

const METHOD_ITEMS: Record<string, string> = {
  [ALL_VALUE]: PAYMENT_MSG.FILTER_ALL_METHODS,
  ...PAYMENT_METHOD_LABEL,
}

function PaymentsView() {
  const payments = usePayments()
  const [selectedRow, setSelectedRow] = React.useState<PaymentRow | null>(null)

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [from] = useQueryState("from", parseAsString.withDefault(""))
  const [to] = useQueryState("to", parseAsString.withDefault(""))
  const [subject, setSubject] = useQueryState(
    "subject",
    parseAsString.withDefault(ALL_VALUE)
  )
  const [confirmer, setConfirmer] = useQueryState(
    "confirmer",
    parseAsString.withDefault(ALL_VALUE)
  )
  const [method, setMethod] = useQueryState(
    "method",
    parseAsString.withDefault(ALL_VALUE)
  )
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => payments.data?.rows ?? [], [payments.data])
  const totals = payments.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (subject !== ALL_VALUE && row.subjectCode !== subject) return false
      if (confirmer !== ALL_VALUE && row.payment.confirmedBy !== confirmer) return false
      if (method !== ALL_VALUE && row.payment.method !== method) return false

      const confirmedDate = row.payment.confirmedAt.slice(0, 10)
      if (from && confirmedDate < from) return false
      if (to && confirmedDate > to) return false

      if (!keyword) return true

      return (
        row.payment.code.toLowerCase().includes(keyword) ||
        (row.student?.name.toLowerCase().includes(keyword) ?? false) ||
        (row.parent?.email.toLowerCase().includes(keyword) ?? false) ||
        (row.parent?.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, "")) ??
          false)
      )
    })
  }, [rows, search, subject, confirmer, method, from, to])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<PaymentRow>[]>(
    () => buildColumns(setSelectedRow),
    []
  )

  return (
    <PageContainer>
      <PageHeader
        title={PAYMENT_MSG.TITLE}
        description={PAYMENT_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Thanh toán" },
          { label: PAYMENT_MSG.TITLE },
        ]}
        actions={
          <>
            <ExportButton
              variant="outline"
              className="rounded-full"
              onExport={() => {
                toast.success(PAYMENT_MSG.EXPORT_SUCCESS)
              }}
            />
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Invoice01Icon} />}
              onClick={() => toast.success(PAYMENT_MSG.CREATE)}
            >
              {PAYMENT_MSG.CREATE}
            </Button>
          </>
        }
      />

      {totals && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <KpiCard
            title={PAYMENT_MSG.KPI_TODAY_SUB}
            value={`${totals.todayAmount.toLocaleString("vi-VN")} ₫`}
            sub={PAYMENT_MSG.KPI_TODAY_COUNT(totals.todayCount)}
            trend="up"
            trendLabel="+15%"
            color="blue"
            icon={<HugeiconsIcon icon={Invoice01Icon} />}
          />
          <KpiCard
            title={PAYMENT_MSG.KPI_MONTH_SUB}
            value={`${totals.monthAmount.toLocaleString("vi-VN")} ₫`}
            sub={PAYMENT_MSG.KPI_MONTH_COUNT(totals.monthCount)}
            color="green"
            icon={<HugeiconsIcon icon={ChartLineData01Icon} />}
          />
          <KpiCard
            title={PAYMENT_MSG.KPI_MONTHS_SOLD_SUB}
            value={PAYMENT_MSG.KPI_MONTHS_SOLD_UNIT(totals.monthsSold)}
            sub={PAYMENT_MSG.KPI_MONTHS_SOLD_NOTE(totals.averageMonths)}
            color="purple"
            icon={<HugeiconsIcon icon={Calendar01Icon} />}
          />
        </div>
      )}

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={PAYMENT_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setSubject(null)
            setConfirmer(null)
            setMethod(null)
            resetPage()
          }}
        >
          <DateRangePicker onChange={resetPage} />

          <FilterSelect
            items={SUBJECT_ITEMS}
            value={subject}
            width="w-40"
            onChange={(next) => {
              setSubject(next)
              resetPage()
            }}
          />
          <FilterSelect
            items={CONFIRMER_ITEMS}
            value={confirmer}
            width="w-44"
            onChange={(next) => {
              setConfirmer(next)
              resetPage()
            }}
          />
          <FilterSelect
            items={METHOD_ITEMS}
            value={method}
            width="w-44"
            onChange={(next) => {
              setMethod(next)
              resetPage()
            }}
          />
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={payments.isPending}
          isError={payments.isError}
          error={payments.error}
          onRetry={() => payments.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{PAYMENT_MSG.NOTE_TITLE}</AlertTitle>
        <AlertDescription>{PAYMENT_MSG.NOTE_DESC}</AlertDescription>
      </Alert>

      <ReceiptDialog row={selectedRow} onClose={() => setSelectedRow(null)} />
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
      onValueChange={(next) =>
        onChange(next === ALL_VALUE ? null : String(next))
      }
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

function buildColumns(
  onOpenReceipt: (row: PaymentRow) => void
): LegacyColumnDef<PaymentRow>[] {
  return [
    {
      id: "code",
      header: PAYMENT_MSG.COL_CODE,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CodeDisplay value={row.original.payment.code} />
          <CopyButton
            value={row.original.payment.code}
            size="icon-sm"
            variant="ghost"
            aria-label={PAYMENT_MSG.COL_CODE}
          />
        </div>
      ),
    },
    {
      id: "student",
      header: PAYMENT_MSG.COL_STUDENT,
      cell: ({ row }) =>
        row.original.student ? (
          <UserCell
            name={row.original.student.name}
            sub={`${STUDENT_MSG.GRADE_LABEL(row.original.student.grade)} · ${row.original.student.code}`}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "parent",
      header: PAYMENT_MSG.COL_PARENT,
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
      header: PAYMENT_MSG.COL_SUBJECT,
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
      id: "months",
      header: PAYMENT_MSG.COL_MONTHS,
      cell: ({ row }) => (
        <span className="text-sm text-foreground tabular-nums">
          {PAYMENT_MSG.MONTHS_UNIT(row.original.enrollment?.months ?? 0)}
        </span>
      ),
    },
    {
      id: "amount",
      header: PAYMENT_MSG.COL_AMOUNT,
      cell: ({ row }) => (
        <MoneyText
          amount={row.original.payment.amount}
          className="block text-right text-sm font-semibold"
        />
      ),
    },
    {
      id: "method",
      header: PAYMENT_MSG.COL_METHOD,
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-full">
          {row.original.methodLabel}
        </Badge>
      ),
    },
    {
      id: "confirmedBy",
      header: PAYMENT_MSG.COL_CONFIRMED_BY,
      cell: ({ row }) => (
        <UserCell name={row.original.confirmedByName} sub="Quản lý" />
      ),
    },
    {
      id: "confirmedAt",
      header: PAYMENT_MSG.COL_CONFIRMED_AT,
      cell: ({ row }) => (
        <DateText value={row.original.payment.confirmedAt} format="datetime" />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onOpenReceipt(row.original)}
        >
          {PAYMENT_MSG.RECEIPT_ACTION}
        </Button>
      ),
    },
  ]
}

export { PaymentsView }
