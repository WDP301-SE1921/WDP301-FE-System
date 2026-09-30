"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkSquare01Icon,
  Clock01Icon,
  Folder01Icon,
  StarIcon,
  UserAdd01Icon,
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
import { ExportButton } from "@/components/shared/actions/export-button"
import { DataTable } from "@/components/shared/data-table/data-table"
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { RowActions } from "@/components/shared/data-table/row-actions"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { TablePagination } from "@/components/shared/data-table/table-pagination"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { useTeachers } from "@/features/teachers/hooks/use-teachers"
import { getSubjectOptions, type TeacherRow } from "@/features/teachers/selectors"

const ALL_VALUE = "all"

function TeachersView() {
  const router = useRouter()
  const teachers = useTeachers()

  const subjectItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: TEACHER_MSG.FILTER_ALL_SUBJECTS,
      ...Object.fromEntries(getSubjectOptions().map((o) => [o.value, o.label])),
    }),
    []
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [status] = useQueryState("status", parseAsString.withDefault("active"))
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )

  const rows = React.useMemo(() => teachers.data?.rows ?? [], [teachers.data])
  const totals = teachers.data?.totals

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (status !== ALL_VALUE && row.teacher.status !== status) return false
      if (subject !== ALL_VALUE && !row.teacher.subjectIds.includes(subject)) {
        return false
      }
      if (!keyword) return true

      return (
        row.teacher.name.toLowerCase().includes(keyword) ||
        row.teacher.email.toLowerCase().includes(keyword) ||
        row.teacher.code.toLowerCase().includes(keyword) ||
        row.teacher.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, ""))
      )
    })
  }, [rows, search, status, subject])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const columns = React.useMemo<LegacyColumnDef<TeacherRow>[]>(
    () => buildColumns(router),
    [router]
  )

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_MSG.LIST_TITLE}
        description={TEACHER_MSG.LIST_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Giáo viên" },
          { label: TEACHER_MSG.LIST_TITLE },
        ]}
        actions={
          <>
            <Badge variant="secondary" className="rounded-full">
              {TEACHER_MSG.LIST_BADGE(rows.length)}
            </Badge>
            <ExportButton
              variant="outline"
              className="rounded-full"
              label={TEACHER_MSG.EXPORT}
              onExport={() => {
                toast.success(TEACHER_MSG.EXPORT_SUCCESS)
              }}
            />
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
              onClick={() => router.push(ROUTES.MANAGER.TEACHER_INVITATIONS)}
            >
              {TEACHER_MSG.INVITE}
            </Button>
          </>
        }
      />

      {totals && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title={TEACHER_MSG.KPI_HOURS}
            value={TEACHER_MSG.KPI_HOURS_UNIT(totals.weeklyHours)}
            trend="up"
            trendLabel={TEACHER_MSG.KPI_HOURS_SUB}
            color="blue"
            icon={<HugeiconsIcon icon={Clock01Icon} />}
          />
          <KpiCard
            title={TEACHER_MSG.KPI_CLASSES}
            value={TEACHER_MSG.KPI_CLASSES_UNIT(totals.runningClasses)}
            sub={TEACHER_MSG.KPI_CLASSES_SUB("6 – 12")}
            color="purple"
            icon={<HugeiconsIcon icon={Folder01Icon} />}
          />
          <KpiCard
            title={TEACHER_MSG.KPI_ATTENDANCE}
            value={`${BUSINESS_RULES.ATTENDANCE_RATE_TARGET}%`}
            sub={TEACHER_MSG.KPI_ATTENDANCE_SUB}
            color="green"
            icon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
          />
          <KpiCard
            title={TEACHER_MSG.KPI_RATING}
            value={TEACHER_MSG.KPI_RATING_UNIT(totals.averageRating)}
            sub={TEACHER_MSG.KPI_RATING_SUB(312)}
            color="amber"
            icon={<HugeiconsIcon icon={StarIcon} />}
          />
        </div>
      )}

      <Card className="gap-4">
        <StatusTabs
          defaultValue="active"
          options={[
            { value: "active", label: TEACHER_MSG.TAB_ACTIVE, count: totals?.active },
            {
              value: "inactive",
              label: TEACHER_MSG.TAB_INACTIVE,
              count: totals?.inactive,
            },
          ]}
          onChange={resetPage}
        />

        <FilterBar
          searchPlaceholder={TEACHER_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setSubject(null)
            resetPage()
          }}
        >
          <Select
            items={subjectItems}
            value={subject}
            onValueChange={(value) => {
              setSubject(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder={TEACHER_MSG.FILTER_ALL_SUBJECTS} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(subjectItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">
            Hiển thị {pagedRows.length} trên {filteredRows.length} giáo viên
          </span>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          isLoading={teachers.isPending}
          isError={teachers.isError}
          error={teachers.error}
          onRetry={() => teachers.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
          onRowClick={(row) =>
            router.push(ROUTES.MANAGER.TEACHER_DETAIL(row.teacher.id))
          }
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>
    </PageContainer>
  )
}

function buildColumns(
  router: ReturnType<typeof useRouter>
): LegacyColumnDef<TeacherRow>[] {
  return [
    {
      id: "teacher",
      header: TEACHER_MSG.COL_TEACHER,
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          <UserCell
            name={row.original.teacher.name}
            sub={`${row.original.teacher.email} · ${row.original.teacher.phone}`}
          />
          {row.original.teacher.isHeadTeacher && (
            <Badge variant="info" className="shrink-0 rounded-full">
              {TEACHER_MSG.HEAD_TEACHER_BADGE}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "code",
      header: "Mã GV",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.teacher.code}
        </span>
      ),
    },
    {
      id: "subjects",
      header: TEACHER_MSG.COL_SUBJECTS,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.subjectCodes.map((code) => (
            <SubjectTag key={code} code={code} />
          ))}
        </div>
      ),
    },
    {
      id: "classCount",
      header: TEACHER_MSG.COL_CLASS_COUNT,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground tabular-nums">
            {TEACHER_MSG.CLASS_COUNT_UNIT(row.original.classCount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {TEACHER_MSG.STUDENT_COUNT_UNIT(row.original.studentCount)}
          </p>
        </div>
      ),
    },
    {
      id: "weekSessions",
      header: TEACHER_MSG.COL_WEEK_SESSIONS,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground tabular-nums">
            {TEACHER_MSG.SESSION_COUNT_UNIT(row.original.weeklySessionCount)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {TEACHER_MSG.SESSION_PER_WEEK}
            </span>
          </p>
          {row.original.substituteCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {TEACHER_MSG.STAT_SUBSTITUTE_UNIT(row.original.substituteCount)} dạy thay
            </p>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: TEACHER_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="teacher" status={row.original.teacher.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isActive = row.original.teacher.status === "active"

        return (
          <RowActions
            items={[
              {
                id: "detail",
                label: TEACHER_MSG.ACTION_VIEW_DETAIL,
                onClick: () =>
                  router.push(ROUTES.MANAGER.TEACHER_DETAIL(row.original.teacher.id)),
              },
              {
                id: "assign",
                label: TEACHER_MSG.ACTION_ASSIGN_CLASS,
                onClick: () => router.push(ROUTES.MANAGER.CLASSES_UNASSIGNED),
              },
              "separator",
              {
                id: "toggle",
                label: isActive
                  ? TEACHER_MSG.ACTION_DEACTIVATE
                  : TEACHER_MSG.ACTION_REACTIVATE,
                danger: isActive,
                onClick: () =>
                  toast.success(
                    isActive
                      ? TEACHER_MSG.DEACTIVATE_SUCCESS
                      : TEACHER_MSG.REACTIVATE_SUCCESS
                  ),
              },
            ]}
          />
        )
      },
    },
  ]
}

export { TeachersView }
