"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Alert01Icon,
  Folder01Icon,
  InformationCircleIcon,
  TeacherIcon,
  UserGroupIcon,
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
import { ExportButton } from "@/components/shared/actions/export-button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { STATUS_MAP } from "@/constants/status"
import { SUBJECT_MAP } from "@/constants/subjects"
import { ClassTeacherDialogHost } from "@/features/classes/components/class-teacher-dialog-host"
import { useClasses } from "@/features/classes/hooks/use-classes"
import {
  getProgramOptions,
  getTeacherOptions,
  type ClassRow,
} from "@/features/classes/selectors"

const ALL_VALUE = "all"
/** Giá trị đặc biệt của bộ lọc giáo viên: các lớp chưa gán giáo viên. */
const UNASSIGNED_VALUE = "unassigned"
const GRADE_OPTIONS = [6, 7, 8, 9]

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: CLASS_MSG.FILTER_ALL_SUBJECTS,
  ...Object.fromEntries(
    Object.values(SUBJECT_MAP).map((item) => [item.code, item.name])
  ),
}

const GRADE_ITEMS: Record<string, string> = {
  [ALL_VALUE]: CLASS_MSG.FILTER_ALL_GRADES,
  ...Object.fromEntries(
    GRADE_OPTIONS.map((item) => [String(item), STUDENT_MSG.GRADE_LABEL(item)])
  ),
}

const STATUS_ITEMS: Record<string, string> = {
  [ALL_VALUE]: CLASS_MSG.FILTER_ALL_STATUS,
  ...Object.fromEntries(
    Object.entries(STATUS_MAP.class).map(([value, config]) => [value, config.label])
  ),
}

function ClassesView() {
  const router = useRouter()
  const classes = useClasses()
  /** Lớp đang mở modal gán/đổi giáo viên. */
  const [teacherDialogClassId, setTeacherDialogClassId] = React.useState<string | null>(null)

  const programItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: CLASS_MSG.FILTER_ALL_PROGRAMS,
      ...Object.fromEntries(getProgramOptions().map((o) => [o.value, o.label])),
    }),
    []
  )
  const teacherItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: CLASS_MSG.FILTER_ALL_TEACHERS,
      [UNASSIGNED_VALUE]: CLASS_MSG.FILTER_UNASSIGNED,
      ...Object.fromEntries(getTeacherOptions().map((o) => [o.value, o.label])),
    }),
    []
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))
  const [grade, setGrade] = useQueryState("grade", parseAsString.withDefault(ALL_VALUE))
  const [program, setProgram] = useQueryState("program", parseAsString.withDefault(ALL_VALUE))
  const [teacher, setTeacher] = useQueryState("teacher", parseAsString.withDefault(ALL_VALUE))
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("open"))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => classes.data?.rows ?? [], [classes.data])
  const totals = classes.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (status !== ALL_VALUE && row.classRecord.status !== status) return false
      if (subject !== ALL_VALUE && row.subjectCode !== subject) return false
      if (grade !== ALL_VALUE && String(row.classRecord.grade) !== grade) return false
      if (program !== ALL_VALUE && row.classRecord.programId !== program) return false
      if (teacher === UNASSIGNED_VALUE) {
        if (row.classRecord.teacherId) return false
      } else if (teacher !== ALL_VALUE && row.classRecord.teacherId !== teacher) {
        return false
      }
      if (!keyword) return true

      return (
        row.classRecord.name.toLowerCase().includes(keyword) ||
        row.classRecord.id.toLowerCase().includes(keyword)
      )
    })
  }, [rows, search, status, subject, grade, program, teacher])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<ClassRow>[]>(
    () => buildColumns(router, setTeacherDialogClassId),
    [router]
  )

  return (
    <PageContainer>
      <PageHeader
        title={CLASS_MSG.LIST_TITLE}
        description={CLASS_MSG.LIST_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Lớp học & Lịch" },
          { label: CLASS_MSG.LIST_TITLE },
        ]}
        actions={
          <>
            <ExportButton
              variant="outline"
              className="rounded-full"
              label={CLASS_MSG.EXPORT}
              onExport={() => {
                toast.success(CLASS_MSG.EXPORT_SUCCESS)
              }}
            />
            <Button
              className="rounded-full"
              render={<Link href={ROUTES.MANAGER.CLASS_NEW} />}
              leftIcon={<HugeiconsIcon icon={Add01Icon} />}
            >
              {CLASS_MSG.CREATE}
            </Button>
          </>
        }
      />

      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title={CLASS_MSG.KPI_TOTAL}
            value={totals.total}
            sub={CLASS_MSG.KPI_TOTAL_SUB}
            trend="up"
            trendLabel="+4 khóa mới"
            color="blue"
            icon={<HugeiconsIcon icon={Folder01Icon} />}
          />
          <KpiCard
            title={CLASS_MSG.KPI_OPEN}
            value={totals.open}
            sub={CLASS_MSG.KPI_OPEN_SUB(totals.openPercent)}
            color="green"
            icon={<HugeiconsIcon icon={TeacherIcon} />}
          />
          <KpiCard
            title={CLASS_MSG.KPI_FULL}
            value={totals.full}
            sub={CLASS_MSG.KPI_FULL_SUB}
            color="red"
            icon={<HugeiconsIcon icon={Alert01Icon} />}
          />
          <KpiCard
            title={CLASS_MSG.KPI_STUDENTS}
            value={totals.students}
            sub={CLASS_MSG.KPI_STUDENTS_SUB(totals.averageStudents)}
            color="purple"
            icon={<HugeiconsIcon icon={UserGroupIcon} />}
          />
        </div>
      )}

      <Card className="gap-4">
        <FilterBar
          searchPlaceholder={CLASS_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setSubject(null)
            setGrade(null)
            setProgram(null)
            setTeacher(null)
            setStatus(null)
            resetPage()
          }}
        >
          <FilterSelect items={SUBJECT_ITEMS} value={subject} width="w-36" onChange={(v) => { setSubject(v); resetPage() }} />
          <FilterSelect items={GRADE_ITEMS} value={grade} width="w-36" onChange={(v) => { setGrade(v); resetPage() }} />
          <FilterSelect items={programItems} value={program} width="w-48" onChange={(v) => { setProgram(v); resetPage() }} />
          <FilterSelect items={teacherItems} value={teacher} width="w-44" onChange={(v) => { setTeacher(v); resetPage() }} />
          <FilterSelect
            items={STATUS_ITEMS}
            value={status}
            width="w-40"
            allValue="open"
            onChange={(v) => { setStatus(v); resetPage() }}
          />
        </FilterBar>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Hiển thị {pagedRows.length} trên {filteredRows.length} lớp
          </span>
          <span className="text-xs text-muted-foreground">
            {CLASS_MSG.AUTO_REFRESH_NOTE}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={classes.isPending}
          isError={classes.isError}
          error={classes.error}
          onRetry={() => classes.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
          onRowClick={(row) =>
            router.push(ROUTES.MANAGER.CLASS_DETAIL(row.classRecord.id))
          }
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{CLASS_MSG.LIST_NOTE_TITLE}</AlertTitle>
        <AlertDescription>{CLASS_MSG.LIST_NOTE_DESC}</AlertDescription>
      </Alert>

      <ClassTeacherDialogHost
        classId={teacherDialogClassId}
        onClose={() => setTeacherDialogClassId(null)}
      />
    </PageContainer>
  )
}

function FilterSelect({
  items,
  value,
  width,
  allValue = ALL_VALUE,
  onChange,
}: {
  items: Record<string, string>
  value: string
  width: string
  allValue?: string
  onChange: (value: string | null) => void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next === allValue ? null : String(next))}
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
  router: ReturnType<typeof useRouter>,
  onAssignTeacher: (classId: string) => void
): LegacyColumnDef<ClassRow>[] {
  return [
    {
      id: "name",
      header: CLASS_MSG.COL_NAME,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {row.original.classRecord.name}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground uppercase">
            {row.original.classRecord.id}
          </p>
        </div>
      ),
    },
    {
      id: "subject",
      header: CLASS_MSG.COL_SUBJECT,
      cell: ({ row }) => <SubjectTag code={row.original.subjectCode} />,
    },
    {
      id: "grade",
      header: CLASS_MSG.COL_GRADE,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          K{row.original.classRecord.grade}
        </span>
      ),
    },
    {
      id: "program",
      header: CLASS_MSG.COL_PROGRAM,
      cell: ({ row }) => (
        <span className="block max-w-32 truncate text-sm text-muted-foreground">
          {row.original.program?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "schedule",
      header: CLASS_MSG.COL_SCHEDULE,
      cell: ({ row }) => (
        <ScheduleText
          days={row.original.classRecord.weekdays}
          time={`${row.original.classRecord.startTime}–${row.original.classRecord.endTime}`}
        />
      ),
    },
    {
      id: "teacher",
      header: CLASS_MSG.COL_TEACHER,
      cell: ({ row }) =>
        row.original.teacherName ? (
          <UserCell name={row.original.teacherName} />
        ) : (
          <Badge variant="danger" className="rounded-full">
            {CLASS_MSG.NO_TEACHER}
          </Badge>
        ),
    },
    {
      id: "room",
      header: CLASS_MSG.COL_ROOM,
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-full">
          {row.original.classRecord.room}
        </Badge>
      ),
    },
    {
      id: "capacity",
      header: CLASS_MSG.COL_CAPACITY,
      cell: ({ row }) => (
        <ProgressStat
          className="w-24"
          value={row.original.enrolled}
          max={row.original.classRecord.capacity}
          description={`${row.original.enrolled}/${row.original.classRecord.capacity}`}
          color={row.original.isFull ? "danger" : "default"}
        />
      ),
    },
    {
      id: "progress",
      header: CLASS_MSG.COL_PROGRESS,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {CLASS_MSG.PROGRESS_LABEL(
            row.original.completedLessons,
            row.original.totalLessons
          )}
        </span>
      ),
    },
    {
      id: "status",
      header: STUDENT_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="class" status={row.original.classRecord.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              id: "detail",
              label: CLASS_MSG.ACTION_VIEW_DETAIL,
              onClick: () =>
                router.push(ROUTES.MANAGER.CLASS_DETAIL(row.original.classRecord.id)),
            },
            {
              id: "edit",
              label: CLASS_MSG.ACTION_EDIT,
              onClick: () => toast.success(CLASS_MSG.ACTION_EDIT),
            },
            {
              id: "change-teacher",
              label: row.original.classRecord.teacherId
                ? CLASS_MSG.ACTION_CHANGE_TEACHER
                : CLASS_MSG.ACTION_ASSIGN_TEACHER,
              onClick: () => onAssignTeacher(row.original.classRecord.id),
            },
            "separator",
            {
              id: "close",
              label: CLASS_MSG.ACTION_CLOSE,
              danger: true,
              onClick: () => toast.success(CLASS_MSG.ACTION_CLOSE),
            },
          ]}
        />
      ),
    },
  ]
}

export { ClassesView }
