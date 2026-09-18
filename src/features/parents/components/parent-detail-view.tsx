"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  Calendar01Icon,
  CheckmarkSquare01Icon,
  Edit02Icon,
  InformationCircleIcon,
  Link01Icon,
  Mail01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { CopyButton } from "@/components/shared/actions/copy-button"
import { CodeDisplay } from "@/components/shared/display/code-display"
import { DateText } from "@/components/shared/display/date-text"
import { DescriptionList } from "@/components/shared/display/description-list"
import { DetailHeader } from "@/components/shared/display/detail-header"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import { ROUTES } from "@/constants/routes"
import { findClass } from "@/mocks/data/catalog"
import { findEnrollmentsByStudent } from "@/mocks/data/students"
import { useParent } from "@/features/parents/hooks/use-parents"
import type { ParentLinkRow, ParentRow } from "@/features/parents/selectors"

export interface ParentDetailViewProps {
  parentAccountId: string
}

function ParentDetailView({ parentAccountId }: ParentDetailViewProps) {
  const parent = useParent(parentAccountId)

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={parent.isPending}
        isError={parent.isError}
        error={parent.error}
        onRetry={() => parent.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {parent.data === null ? (
          <ErrorState
            title={PARENT_MSG.NOT_FOUND_TITLE}
            message={PARENT_MSG.NOT_FOUND_DESC}
          />
        ) : (
          parent.data && <ParentDetailContent row={parent.data} />
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function ParentDetailContent({ row }: { row: ParentRow }) {
  const router = useRouter()

  const { links, emails } = row

  return (
    <div className="space-y-6">
      <PageHeader
        title={PARENT_MSG.DETAIL_TITLE}
        description={PARENT_MSG.DETAIL_DESC}
        backHref={ROUTES.MANAGER.PARENTS}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: PARENT_MSG.LIST_TITLE, href: ROUTES.MANAGER.PARENTS },
          { label: row.parent.email },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Edit02Icon} />}
              onClick={() => toast.success(PARENT_MSG.ACTION_EDIT)}
            >
              {PARENT_MSG.ACTION_EDIT}
            </Button>
            <Button
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
              onClick={() => router.push(ROUTES.MANAGER.ENROLLMENT_NEW)}
            >
              {PARENT_MSG.ACTION_ADD_CHILD}
            </Button>
          </>
        }
      />

      <DetailHeader
        name={row.parent.email}
        code={`PH-${row.parent.id.toUpperCase()}`}
        statusLabel={row.parent.status === "activated" ? "Đã kích hoạt" : "Chờ liên kết"}
        statusVariant={row.parent.status === "activated" ? "success" : "warning"}
        meta={[
          {
            icon: <HugeiconsIcon icon={Mail01Icon} />,
            label: row.parent.phone,
          },
          {
            icon: <HugeiconsIcon icon={Calendar01Icon} />,
            label: PARENT_MSG.CHILD_COUNT(row.childCount),
          },
        ]}
      />

      <SectionCard title={PARENT_MSG.INFO_STATUS}>
        <DescriptionList
          cols={3}
          items={[
            { label: PARENT_MSG.INFO_EMAIL, value: row.parent.email },
            { label: PARENT_MSG.INFO_PHONE, value: row.parent.phone },
            {
              label: PARENT_MSG.INFO_STATUS,
              value: (
                <StatusBadge category="parentAccount" status={row.parent.status} />
              ),
            },
            {
              label: PARENT_MSG.INFO_ACTIVATED_AT,
              value: row.parent.activatedAt ? (
                <DateText value={row.parent.activatedAt} format="datetime" />
              ) : (
                "—"
              ),
            },
            {
              label: PARENT_MSG.COL_CREATED_AT,
              value: <DateText value={row.parent.createdAt} />,
            },
            {
              label: PARENT_MSG.INFO_CHILD_COUNT,
              value: PARENT_MSG.CHILD_COUNT(row.childCount),
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title={PARENT_MSG.CHILDREN_SECTION_TITLE}
        description={PARENT_MSG.CHILDREN_SECTION_DESC}
        action={
          <Badge variant="info" className="rounded-full">
            {PARENT_MSG.CHILD_COUNT(row.childCount)}
          </Badge>
        }
      >
        {row.children.length === 0 ? (
          <EmptyState variant="no-data" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {row.children.map((child) => {
              const enrollments = findEnrollmentsByStudent(child.student.id)

              return (
                <Card key={child.student.id} className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold text-foreground">
                        {child.student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PARENT_MSG.CHILD_GRADE(child.student.grade)} ·{" "}
                        {child.student.code}
                      </p>
                    </div>
                    <StatusBadge category="student" status={child.student.status} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {child.subjectCodes.map((code) => (
                      <SubjectTag key={code} code={code} />
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-border pt-3">
                    {enrollments.slice(0, 2).map((enrollment) => {
                      const classRecord = findClass(enrollment.classId)

                      return (
                        <p
                          key={enrollment.id}
                          className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                        >
                          <span className="truncate">{classRecord?.name}</span>
                          <DateText value={enrollment.endDate} className="shrink-0" />
                        </p>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    render={
                      <Link href={ROUTES.MANAGER.STUDENT_DETAIL(child.student.id)} />
                    }
                  >
                    {PARENT_MSG.CHILD_VIEW_PROFILE}
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title={PARENT_MSG.LINK_SECTION_TITLE}
          description={PARENT_MSG.LINK_SECTION_DESC}
          action={
            <Badge variant="secondary" className="rounded-full">
              {links.length} mã
            </Badge>
          }
        >
          <div className="space-y-4">
            {links.length === 0 ? (
              <EmptyState variant="no-data" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{PARENT_MSG.LINK_COL_CODE}</TableHead>
                    <TableHead>{PARENT_MSG.LINK_COL_CHILD}</TableHead>
                    <TableHead>{PARENT_MSG.LINK_COL_EXPIRES}</TableHead>
                    <TableHead>{PARENT_MSG.LINK_COL_STATUS}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((row) => (
                    <LinkRow key={row.link.id} row={row} />
                  ))}
                </TableBody>
              </Table>
            )}

            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} />
              <AlertTitle>{PARENT_MSG.LINK_NOTE_TITLE}</AlertTitle>
              <AlertDescription>{PARENT_MSG.LINK_NOTE_DESC}</AlertDescription>
            </Alert>
          </div>
        </SectionCard>

        <SectionCard
          title={PARENT_MSG.EMAIL_SECTION_TITLE}
          description={PARENT_MSG.EMAIL_SECTION_DESC}
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              leftIcon={<HugeiconsIcon icon={Mail01Icon} />}
              onClick={() => toast.success(PARENT_MSG.EMAIL_SEND)}
            >
              {PARENT_MSG.EMAIL_SEND}
            </Button>
          }
        >
          {emails.length === 0 ? (
            <EmptyState variant="no-data" />
          ) : (
            <ul className="space-y-2">
              {emails.map((email) => (
                <li
                  key={email.id}
                  className="flex items-start gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <HugeiconsIcon
                      icon={email.status === "failed" ? Alert01Icon : CheckmarkSquare01Icon}
                      className="size-4"
                    />
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {email.category}
                      </Badge>
                      <StatusBadge category="email" status={email.status} />
                    </div>
                    <p className="truncate text-sm text-foreground">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      <DateText value={email.sentAt} format="datetime" /> ·{" "}
                      {email.actorName}
                    </p>
                  </div>

                  {email.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="shrink-0 rounded-full"
                      onClick={() => toast.success(PARENT_MSG.EMAIL_RESEND)}
                    >
                      {PARENT_MSG.EMAIL_RESEND}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function LinkRow({ row }: { row: ParentLinkRow }) {
  const { link, status, className } = row

  return (
    <TableRow>
      <TableCell>
        {/* Chỉ hiển thị `code`; `token` là credential dùng một lần, không render. */}
        <CodeDisplay value={link.code} boxed />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {className}
      </TableCell>
      <TableCell>
        <DateText value={link.expiresAt} />
      </TableCell>
      <TableCell>
        <StatusBadge category="linkCode" status={status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <CopyButton value={link.code} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={PARENT_MSG.LINK_RESEND}
            onClick={() => toast.success(PARENT_MSG.LINK_RESEND)}
          >
            <HugeiconsIcon icon={Link01Icon} className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export { ParentDetailView }
