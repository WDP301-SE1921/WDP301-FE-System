"use client"

import * as React from "react"
import { parseAsInteger, useQueryState } from "nuqs"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ERROR_MSG } from "@/constants/messages/error"
import { REPORT_MSG } from "@/constants/messages/events/report"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { getMyClassOptions } from "@/features/assignments/selectors"
import { useCreateReport, useTeacherReports } from "@/features/reports/hooks/use-reports"
import type { ReportRow } from "@/features/reports/selectors"
import { formatDate } from "@/lib/format"
import {
  createReportSchema,
  type CreateReportFormInput,
} from "@/lib/validators/report"
import { MockError } from "@/mocks/utils/mock-query"

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Ô chọn 1 ngày cục bộ (không qua nuqs) — dùng cho field ngày trong form, dựng
 * theo đúng cách `shared/pickers/date-range-picker.tsx` ghép `Calendar` + `Popover`. */
function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <Label required>{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 rounded-xl font-normal",
                error && "border-destructive"
              )}
              leftIcon={<HugeiconsIcon icon={Calendar01Icon} />}
            >
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {value ? formatDate(value) : label}
              </span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              onChange(toIsoDate(date))
              setIsOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function CreateReportForm() {
  const classOptions = React.useMemo(() => getMyClassOptions(), [])
  const createReport = useCreateReport()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReportFormInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      classIds: [],
      fromDate: "",
      toDate: "",
      includeScores: true,
      includeAttendance: true,
      includeProgress: true,
    },
  })

  const onSubmit = (values: CreateReportFormInput) => {
    createReport.mutate(values, {
      onSuccess: () => {
        toast.success(REPORT_MSG.CREATE_SUCCESS)
        reset({
          classIds: [],
          fromDate: "",
          toDate: "",
          includeScores: true,
          includeAttendance: true,
          includeProgress: true,
        })
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  return (
    <SectionCard title={REPORT_MSG.CREATE_SECTION_TITLE}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label required>{REPORT_MSG.FIELD_CLASSES}</Label>
            <Controller
              control={control}
              name="classIds"
              render={({ field }) => (
                <div className="flex flex-col gap-2 rounded-xl border border-input p-3">
                  {classOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    classOptions.map((option) => {
                      const checked = field.value.includes(option.value)
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              field.onChange(
                                next
                                  ? [...field.value, option.value]
                                  : field.value.filter((id) => id !== option.value)
                              )
                            }}
                          />
                          {option.label}
                        </label>
                      )
                    })
                  )}
                </div>
              )}
            />
            {errors.classIds && (
              <p className="text-xs text-destructive">{errors.classIds.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{REPORT_MSG.FIELD_DATE_RANGE}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name="fromDate"
                render={({ field }) => (
                  <DateField
                    label={REPORT_MSG.FIELD_FROM}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.fromDate?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="toDate"
                render={({ field }) => (
                  <DateField
                    label={REPORT_MSG.FIELD_TO}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.toDate?.message}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{REPORT_MSG.FIELD_CONTENT}</Label>
          <div className="flex flex-wrap gap-6">
            <Controller
              control={control}
              name="includeScores"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(next) => field.onChange(next === true)}
                  />
                  {REPORT_MSG.CHECKBOX_SCORES}
                </label>
              )}
            />
            <Controller
              control={control}
              name="includeAttendance"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(next) => field.onChange(next === true)}
                  />
                  {REPORT_MSG.CHECKBOX_ATTENDANCE}
                </label>
              )}
            />
            <Controller
              control={control}
              name="includeProgress"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(next) => field.onChange(next === true)}
                  />
                  {REPORT_MSG.CHECKBOX_PROGRESS}
                </label>
              )}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button type="submit" className="rounded-full" isLoading={createReport.isPending}>
            {createReport.isPending ? REPORT_MSG.SUBMIT_PROGRESS : REPORT_MSG.SUBMIT}
          </Button>
          {createReport.isPending && <Progress value={70} className="max-w-xs" />}
        </div>
      </form>
    </SectionCard>
  )
}

function buildColumns(): LegacyColumnDef<ReportRow>[] {
  return [
    {
      id: "name",
      header: REPORT_MSG.COL_NAME,
      cell: ({ row }) => (
        <span className="block max-w-72 truncate text-sm font-medium text-foreground">
          {row.original.report.name}
        </span>
      ),
    },
    {
      id: "class",
      header: REPORT_MSG.COL_CLASS,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.classNames.length > 0 ? row.original.classNames.join(", ") : "—"}
        </span>
      ),
    },
    {
      id: "range",
      header: REPORT_MSG.COL_RANGE,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.report.fromDate)} – {formatDate(row.original.report.toDate)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: REPORT_MSG.COL_CREATED_AT,
      cell: ({ row }) => <DateText value={row.original.report.createdAt} format="datetime" />,
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <div className="flex items-center gap-2">
          <ExportButton
            size="sm"
            label={REPORT_MSG.ACTION_EXPORT_EXCEL}
            onExport={async () => {
              await new Promise((resolve) => setTimeout(resolve, 800))
              toast.success(REPORT_MSG.EXPORT_EXCEL_SUCCESS)
            }}
          />
          <ExportButton
            size="sm"
            label={REPORT_MSG.ACTION_EXPORT_PDF}
            onExport={async () => {
              await new Promise((resolve) => setTimeout(resolve, 800))
              toast.success(REPORT_MSG.EXPORT_PDF_SUCCESS)
            }}
          />
        </div>
      ),
    },
  ]
}

function ReportHistorySection() {
  const reports = useTeacherReports()
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => reports.data ?? [], [reports.data])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  const columns = React.useMemo(() => buildColumns(), [])

  return (
    <SectionCard title={REPORT_MSG.HISTORY_TITLE}>
      <DataTable
        columns={columns}
        data={pagedRows}
        isLoading={reports.isPending}
        isError={reports.isError}
        error={reports.error}
        onRetry={() => reports.refetch()}
        emptyTitle={REPORT_MSG.HISTORY_EMPTY_TITLE}
        emptyDescription={REPORT_MSG.HISTORY_EMPTY_DESC}
      />
      <TablePagination totalItems={rows.length} />
    </SectionCard>
  )
}

function TeacherReportsView() {
  return (
    <PageContainer>
      <PageHeader
        title={REPORT_MSG.TITLE}
        description={REPORT_MSG.DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: REPORT_MSG.TITLE },
        ]}
      />

      <div className="space-y-6">
        <CreateReportForm />
        <ReportHistorySection />
      </div>
    </PageContainer>
  )
}

export { TeacherReportsView }
