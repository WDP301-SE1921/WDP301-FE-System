"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { MoneyText } from "@/components/shared/display/money-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { SUBJECT_MAP } from "@/constants/subjects"
import { ProgramFormDialog } from "@/features/catalog/components/program-form-dialog"
import { useCatalogPrograms } from "@/features/catalog/hooks/use-catalog"
import { getGradeOptions, type ProgramRow } from "@/features/catalog/selectors"
import type { Program } from "@/types/catalog"

const ALL_VALUE = "all"

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: CATALOG_MSG.PROGRAM_FILTER_ALL_SUBJECTS,
  ...Object.fromEntries(Object.values(SUBJECT_MAP).map((item) => [item.code, item.name])),
}

function ProgramsTab() {
  const router = useRouter()
  const programs = useCatalogPrograms()

  const gradeItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: CATALOG_MSG.PROGRAM_FILTER_ALL_GRADES,
      ...Object.fromEntries(getGradeOptions().map((grade) => [String(grade), STUDENT_MSG.GRADE_LABEL(grade)])),
    }),
    []
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))
  const [grade, setGrade] = useQueryState("grade", parseAsString.withDefault(ALL_VALUE))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const [dialogState, setDialogState] = React.useState<
    { mode: "create" } | { mode: "edit"; program: Program } | null
  >(null)

  const filteredRows = React.useMemo(() => {
    const rows = programs.data ?? []
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (subject !== ALL_VALUE && row.subjectCode !== subject) return false
      if (grade !== ALL_VALUE && String(row.program.grade) !== grade) return false
      if (!keyword) return true
      return row.program.name.toLowerCase().includes(keyword)
    })
  }, [programs.data, search, subject, grade])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter/search luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<ProgramRow>[]>(
    () => [
      {
        id: "name",
        header: CATALOG_MSG.PROGRAM_COL_NAME,
        cell: ({ row }) => (
          <button
            type="button"
            className="truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline"
            onClick={() => router.push(ROUTES.MANAGER.CATALOG_PROGRAM_DETAIL(row.original.program.id))}
          >
            {row.original.program.name}
          </button>
        ),
      },
      {
        id: "subject",
        header: CATALOG_MSG.PROGRAM_COL_SUBJECT,
        cell: ({ row }) => <SubjectTag code={row.original.subjectCode} />,
      },
      {
        id: "grade",
        header: CATALOG_MSG.PROGRAM_COL_GRADE,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {STUDENT_MSG.GRADE_LABEL(row.original.program.grade)}
          </span>
        ),
      },
      {
        id: "lessons",
        header: CATALOG_MSG.PROGRAM_COL_LESSONS,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.program.totalLessons}
          </span>
        ),
      },
      {
        id: "fee",
        header: CATALOG_MSG.PROGRAM_COL_FEE,
        cell: ({ row }) => <MoneyText amount={row.original.program.monthlyFee} />,
      },
      {
        id: "classCount",
        header: CATALOG_MSG.PROGRAM_COL_CLASS_COUNT,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-foreground">{row.original.classCount}</span>
        ),
      },
      {
        id: "status",
        header: CATALOG_MSG.PROGRAM_COL_STATUS,
        cell: ({ row }) => (
          <StatusBadge
            category="program"
            status={row.original.program.isActive ? "active" : "inactive"}
          />
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
                label: CATALOG_MSG.PROGRAM_ACTION_EDIT,
                onClick: () => setDialogState({ mode: "edit", program: row.original.program }),
              },
              {
                id: "manage-lessons",
                label: CATALOG_MSG.PROGRAM_ACTION_MANAGE_LESSONS,
                onClick: () =>
                  router.push(ROUTES.MANAGER.CATALOG_PROGRAM_DETAIL(row.original.program.id)),
              },
            ]}
          />
        ),
      },
    ],
    [router]
  )

  return (
    <Card className="gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          searchPlaceholder={CATALOG_MSG.PROGRAM_SEARCH_PLACEHOLDER}
          className="flex-1"
          onClearFilters={() => {
            setSubject(null)
            setGrade(null)
            resetPage()
          }}
        >
          <FilterSelect
            items={SUBJECT_ITEMS}
            value={subject}
            width="w-36"
            onChange={(value) => {
              setSubject(value)
              resetPage()
            }}
          />
          <FilterSelect
            items={gradeItems}
            value={grade}
            width="w-36"
            onChange={(value) => {
              setGrade(value)
              resetPage()
            }}
          />
        </FilterBar>

        <Button
          className="rounded-full shrink-0"
          leftIcon={<HugeiconsIcon icon={Add01Icon} />}
          onClick={() => setDialogState({ mode: "create" })}
        >
          {CATALOG_MSG.PROGRAM_CREATE}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={pagedRows}
        isLoading={programs.isPending}
        isError={programs.isError}
        error={programs.error}
        onRetry={() => programs.refetch()}
        emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
        emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
      />

      <TablePagination totalItems={filteredRows.length} />

      {dialogState && (
        <ProgramFormDialog
          key={dialogState.mode === "edit" ? dialogState.program.id : "create"}
          open={Boolean(dialogState)}
          onOpenChange={(open) => {
            if (!open) setDialogState(null)
          }}
          mode={dialogState.mode}
          program={dialogState.mode === "edit" ? dialogState.program : undefined}
        />
      )}
    </Card>
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

export { ProgramsTab }
