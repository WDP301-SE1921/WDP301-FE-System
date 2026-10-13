"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  InformationCircleIcon,
  UserAdd01Icon,
  UserGroupIcon,
  UserIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { EMPTY_MSG } from "@/constants/messages/empty"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { PAGINATION_DEFAULTS } from "@/constants/ui"
import { ROUTES } from "@/constants/routes"
import { useRoleAccess } from "@/hooks/use-current-role"
import { SUBJECT_MAP } from "@/constants/subjects"
import { formatDate } from "@/lib/format"
import { getClassOptions, getDaysRemaining, type StudentRow } from "@/features/students/selectors"
import { useStudents } from "@/features/students/hooks/use-students"

const ALL_VALUE = "all"

const GRADE_OPTIONS = [6, 7, 8, 9]

const SUBJECT_ITEMS: Record<string, string> = {
  [ALL_VALUE]: STUDENT_MSG.FILTER_ALL_SUBJECTS,
  ...Object.fromEntries(
    Object.values(SUBJECT_MAP).map((item) => [item.code, item.name])
  ),
}

const GRADE_ITEMS: Record<string, string> = {
  [ALL_VALUE]: STUDENT_MSG.FILTER_ALL_GRADES,
  ...Object.fromEntries(
    GRADE_OPTIONS.map((item) => [String(item), STUDENT_MSG.GRADE_LABEL(item)])
  ),
}

function StudentsView() {
  const router = useRouter()
  const { canAccess } = useRoleAccess()
  const students = useStudents()
  const classOptions = React.useMemo(() => getClassOptions(), [])
  const classItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: STUDENT_MSG.FILTER_ALL_CLASSES,
      ...Object.fromEntries(classOptions.map((item) => [item.value, item.label])),
    }),
    [classOptions]
  )

  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [status] = useQueryState("status", parseAsString.withDefault(ALL_VALUE))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE)
  )
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))
  const [grade, setGrade] = useQueryState("grade", parseAsString.withDefault(ALL_VALUE))
  const [classId, setClassId] = useQueryState("class", parseAsString.withDefault(ALL_VALUE))

  const rows = React.useMemo(() => students.data ?? [], [students.data])

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (status !== ALL_VALUE && row.student.status !== status) return false
      if (subject !== ALL_VALUE && !row.subjectCodes.includes(subject)) return false
      if (grade !== ALL_VALUE && String(row.student.grade) !== grade) return false
      if (classId !== ALL_VALUE && !row.enrollments.some((e) => e.classId === classId)) {
        return false
      }
      if (!keyword) return true

      return (
        row.student.name.toLowerCase().includes(keyword) ||
        row.student.code.toLowerCase().includes(keyword) ||
        (row.parent?.email.toLowerCase().includes(keyword) ?? false)
      )
    })
  }, [rows, search, status, subject, grade, classId])

  const pagedRows = React.useMemo(() => {
    const start = (Math.max(1, page) - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  /** Đổi filter luôn đưa về trang 1 — theo `.claude/rules/implement-ui.md`. */
  const resetPage = React.useCallback(() => setPage(null), [setPage])

  const counts = React.useMemo(() => {
    const byStatus = (value: string) =>
      rows.filter((row) => row.student.status === value).length

    return {
      total: rows.length,
      active: byStatus("active"),
      paused: byStatus("paused"),
      withdrawn: byStatus("withdrawn"),
      expiring: rows.filter(
        (row) =>
          row.packageEndDate !== undefined &&
          getDaysRemaining(row.packageEndDate) <=
            BUSINESS_RULES.PACKAGE_EXPIRY_WARNING_DAYS
      ).length,
    }
  }, [rows])

  const columns = React.useMemo<LegacyColumnDef<StudentRow>[]>(
    () => buildColumns(router, canAccess),
    [router, canAccess]
  )

  return (
    <PageContainer>
      <PageHeader
        title={STUDENT_MSG.LIST_TITLE}
        description={STUDENT_MSG.LIST_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Học sinh & Phụ huynh" },
          { label: STUDENT_MSG.LIST_TITLE },
        ]}
        actions={
          <>
            <ExportButton
              variant="outline"
              className="rounded-full"
              onExport={() => {
                toast.success(STUDENT_MSG.EXPORT_SUCCESS)
              }}
            />
            {canAccess(ROUTES.STAFF.ENROLLMENT_NEW) && (
              <Button
                className="rounded-full"
                render={<Link href={ROUTES.STAFF.ENROLLMENT_NEW} />}
                leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
              >
                {STUDENT_MSG.ADD_ENROLLMENT}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={STUDENT_MSG.KPI_TOTAL}
          value={counts.total}
          color="blue"
          icon={<HugeiconsIcon icon={UserGroupIcon} />}
        />
        <KpiCard
          title={STUDENT_MSG.KPI_ACTIVE}
          value={counts.active}
          color="green"
          icon={<HugeiconsIcon icon={UserIcon} />}
        />
        <KpiCard
          title={STUDENT_MSG.KPI_EXPIRING}
          value={counts.expiring}
          color="red"
          icon={<HugeiconsIcon icon={Alert01Icon} />}
        />
        <KpiCard
          title={STUDENT_MSG.KPI_WITHDRAWN}
          value={counts.withdrawn}
          color="amber"
          icon={<HugeiconsIcon icon={UserRemove01Icon} />}
        />
      </div>

      <Card className="gap-4">
        <StatusTabs
          options={[
            { value: ALL_VALUE, label: "Tất cả", count: counts.total },
            { value: "active", label: "Đang học", count: counts.active },
            { value: "paused", label: "Tạm nghỉ", count: counts.paused },
            { value: "withdrawn", label: "Đã nghỉ", count: counts.withdrawn },
          ]}
          onChange={resetPage}
        />

        <FilterBar
          searchPlaceholder={STUDENT_MSG.SEARCH_PLACEHOLDER}
          onClearFilters={() => {
            setSubject(null)
            setGrade(null)
            setClassId(null)
            resetPage()
          }}
        >
          <Select
            items={SUBJECT_ITEMS}
            value={subject}
            onValueChange={(value) => {
              setSubject(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder={STUDENT_MSG.FILTER_ALL_SUBJECTS} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{STUDENT_MSG.FILTER_ALL_SUBJECTS}</SelectItem>
              {Object.values(SUBJECT_MAP).map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={GRADE_ITEMS}
            value={grade}
            onValueChange={(value) => {
              setGrade(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue placeholder={STUDENT_MSG.FILTER_ALL_GRADES} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{STUDENT_MSG.FILTER_ALL_GRADES}</SelectItem>
              {GRADE_OPTIONS.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {STUDENT_MSG.GRADE_LABEL(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={classItems}
            value={classId}
            onValueChange={(value) => {
              setClassId(value === ALL_VALUE ? null : String(value))
              resetPage()
            }}
          >
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder={STUDENT_MSG.FILTER_ALL_CLASSES} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>{STUDENT_MSG.FILTER_ALL_CLASSES}</SelectItem>
              {classOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        <DataTable
          columns={columns}
          data={pagedRows}
          selectable
          isLoading={students.isPending}
          isError={students.isError}
          error={students.error}
          onRetry={() => students.refetch()}
          emptyTitle={EMPTY_MSG.NO_RESULT_TITLE}
          emptyDescription={EMPTY_MSG.NO_RESULT_DESC}
          onRowClick={(row) => router.push(ROUTES.MANAGER.STUDENT_DETAIL(row.student.id))}
        />

        <TablePagination totalItems={filteredRows.length} />
      </Card>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>Lưu ý quản lý phụ huynh & học sinh</AlertTitle>
        <AlertDescription>
          Phụ huynh tự tạo tài khoản và hồ sơ con trên ứng dụng. Nhân viên chọn hồ sơ
          có sẵn và xác nhận thanh toán để đăng ký lớp cho con.
        </AlertDescription>
      </Alert>
    </PageContainer>
  )
}

function buildColumns(
  router: ReturnType<typeof useRouter>,
  canAccess: (href: string) => boolean
): LegacyColumnDef<StudentRow>[] {
  return [
    {
      id: "student",
      header: STUDENT_MSG.COL_STUDENT,
      cell: ({ row }) => (
        <UserCell
          name={row.original.student.name}
          sub={`${STUDENT_MSG.GRADE_LABEL(row.original.student.grade)} · ${row.original.student.code}`}
        />
      ),
    },
    {
      id: "parent",
      header: STUDENT_MSG.COL_PARENT,
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
      id: "subjects",
      header: STUDENT_MSG.COL_SUBJECTS,
      cell: ({ row }) =>
        row.original.subjectCodes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.subjectCodes.map((code) => (
              <SubjectTag key={code} code={code} />
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "attendance",
      header: STUDENT_MSG.COL_ATTENDANCE,
      cell: ({ row }) => {
        const { attendance } = row.original

        if (attendance.total === 0) {
          return (
            <span className="text-xs text-muted-foreground">Chưa phát sinh buổi</span>
          )
        }

        return (
          <ProgressStat
            className="w-32"
            value={attendance.rate}
            description={`${attendance.present + attendance.madeUp}/${attendance.total} buổi`}
            color={attendance.rate >= 90 ? "success" : attendance.rate >= 75 ? "warning" : "danger"}
          />
        )
      },
    },
    {
      id: "package",
      header: STUDENT_MSG.COL_PACKAGE,
      cell: ({ row }) => {
        const endDate = row.original.packageEndDate

        if (!endDate) {
          return <span className="text-sm text-muted-foreground">—</span>
        }

        const daysLeft = getDaysRemaining(endDate)
        const isExpiring = daysLeft <= BUSINESS_RULES.PACKAGE_EXPIRY_WARNING_DAYS

        return (
          <div className="min-w-0">
            <p
              className={
                isExpiring
                  ? "text-sm font-medium text-destructive"
                  : "text-sm text-foreground"
              }
            >
              {formatDate(endDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {daysLeft >= 0 ? `Còn ${daysLeft} ngày` : `Đã hết hạn ${-daysLeft} ngày`}
            </p>
          </div>
        )
      },
    },
    {
      id: "status",
      header: STUDENT_MSG.COL_STATUS,
      cell: ({ row }) => (
        <StatusBadge category="student" status={row.original.student.status} />
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
              label: STUDENT_MSG.ACTION_VIEW_DETAIL,
              onClick: () =>
                router.push(ROUTES.MANAGER.STUDENT_DETAIL(row.original.student.id)),
            },
            ...(canAccess(ROUTES.STAFF.ENROLLMENT_NEW)
              ? [
                  {
                    id: "add-subject",
                    label: STUDENT_MSG.ACTION_ADD_SUBJECT,
                    onClick: () =>
                      router.push(
                        ROUTES.STAFF.ENROLLMENT_NEW_FOR({
                          parentId: row.original.student.parentAccountId,
                          studentId: row.original.student.id,
                        })
                      ),
                  },
                ]
              : []),
            ...(canAccess(ROUTES.MANAGER.MAKEUP)
              ? [
                  {
                    id: "absence",
                    label: STUDENT_MSG.ACTION_REPORT_ABSENCE,
                    onClick: () => router.push(ROUTES.MANAGER.MAKEUP),
                  },
                  {
                    id: "long-leave",
                    label: STUDENT_MSG.ACTION_LONG_LEAVE,
                    onClick: () => router.push(ROUTES.MANAGER.LONG_LEAVE),
                  },
                  "separator" as const,
                  {
                    id: "withdraw",
                    label: STUDENT_MSG.ACTION_WITHDRAW,
                    danger: true,
                    onClick: () => router.push(ROUTES.MANAGER.WITHDRAW),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]
}

export { StudentsView }
