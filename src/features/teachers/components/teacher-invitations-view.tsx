"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  File01Icon,
  Link01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { FilterBar } from "@/components/shared/data-table/filter-bar"
import { StatusTabs } from "@/components/shared/data-table/status-tabs"
import { DateText } from "@/components/shared/display/date-text"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ERROR_MSG } from "@/constants/messages/error"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { ROUTES } from "@/constants/routes"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { getSubjectOptions } from "@/features/teachers/selectors"
import {
  useReviewInvitation,
  useTeacherInvitations,
} from "@/features/teachers/hooks/use-teachers"
import { InviteTeacherDialog } from "@/features/teachers/components/invite-teacher-dialog"
import { MockError } from "@/mocks/utils/mock-query"
import type { TeacherInvitation } from "@/types/teacher"

const ALL_VALUE = "all"

function TeacherInvitationsView() {
  const invitations = useTeacherInvitations()
  const reviewInvitation = useReviewInvitation()
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)

  const [tab] = useQueryState("tab", parseAsString.withDefault("pending"))
  const [search] = useQueryState("search", parseAsString.withDefault(""))
  const [subject, setSubject] = useQueryState("subject", parseAsString.withDefault(ALL_VALUE))

  const subjectItems = React.useMemo<Record<string, string>>(
    () => ({
      [ALL_VALUE]: TEACHER_MSG.INVITATION_FILTER_SUBJECT,
      ...Object.fromEntries(getSubjectOptions().map((o) => [o.value, o.label])),
    }),
    []
  )

  const rows = invitations.data ?? []
  const pending = rows.filter((item) => item.status === "pending_review")
  const sent = rows.filter((item) => item.status === "sent")
  const approvedThisMonth = rows.filter((item) => item.status === "approved").length

  const approvalRate =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.filter((item) => item.status === "approved").length /
            rows.filter((item) => item.status === "approved" || item.status === "rejected")
              .length || 1) * 1000
        ) / 10

  const filterRows = (list: TeacherInvitation[]) => {
    const keyword = search.trim().toLowerCase()

    return list.filter((item) => {
      if (subject !== ALL_VALUE && !item.subjectIds.includes(subject)) return false
      if (!keyword) return true

      return (
        item.name.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.phone.replace(/\s/g, "").includes(keyword.replace(/\s/g, ""))
      )
    })
  }

  const handleReview = (invitation: TeacherInvitation, approve: boolean) => {
    reviewInvitation.mutate(
      { invitationId: invitation.id, approve },
      {
        onSuccess: () => {
          toast.success(
            approve
              ? TEACHER_MSG.APPROVE_SUCCESS(invitation.name)
              : TEACHER_MSG.REJECT_SUCCESS(invitation.name)
          )
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_MSG.INVITATION_TITLE}
        description={TEACHER_MSG.INVITATION_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Giáo viên" },
          { label: TEACHER_MSG.INVITATION_TITLE },
        ]}
        actions={
          <Button
            className="rounded-full"
            leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
            onClick={() => setIsInviteOpen(true)}
          >
            {TEACHER_MSG.INVITE}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={TEACHER_MSG.INVITATION_KPI_PENDING}
          value={pending.length}
          sub={TEACHER_MSG.INVITATION_KPI_PENDING_SUB(pending.length)}
          color="amber"
          icon={<HugeiconsIcon icon={Clock01Icon} />}
        />
        <KpiCard
          title={TEACHER_MSG.INVITATION_KPI_SENT}
          value={sent.length}
          sub={TEACHER_MSG.INVITATION_KPI_SENT_SUB(sent.length)}
          color="blue"
          icon={<HugeiconsIcon icon={Link01Icon} />}
        />
        <KpiCard
          title={TEACHER_MSG.INVITATION_KPI_JOINED}
          value={approvedThisMonth}
          sub={TEACHER_MSG.INVITATION_KPI_JOINED_SUB(approvedThisMonth)}
          color="green"
          icon={<HugeiconsIcon icon={UserAdd01Icon} />}
        />
        <KpiCard
          title={TEACHER_MSG.INVITATION_KPI_RATE}
          value={`${approvalRate}%`}
          color="purple"
          icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} />}
        />
      </div>

      <Card className="gap-4">
        <StatusTabs
          paramKey="tab"
          defaultValue="pending"
          options={[
            { value: "pending", label: TEACHER_MSG.TAB_PENDING, count: pending.length },
            { value: "sent", label: TEACHER_MSG.TAB_SENT, count: sent.length },
          ]}
        />

        <FilterBar
          searchPlaceholder={TEACHER_MSG.INVITATION_SEARCH_PLACEHOLDER}
          onClearFilters={() => setSubject(null)}
        >
          <Select
            items={subjectItems}
            value={subject}
            onValueChange={(value) => setSubject(value === ALL_VALUE ? null : String(value))}
          >
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder={TEACHER_MSG.INVITATION_FILTER_SUBJECT} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(subjectItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBar>

        {tab === "pending" ? (
          <PendingList
            items={filterRows(pending)}
            onReview={handleReview}
            isPending={reviewInvitation.isPending}
          />
        ) : (
          <SentList items={filterRows(sent)} />
        )}
      </Card>

      <InviteTeacherDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </PageContainer>
  )
}

function PendingList({
  items,
  onReview,
  isPending,
}: {
  items: TeacherInvitation[]
  onReview: (invitation: TeacherInvitation, approve: boolean) => void
  isPending: boolean
}) {
  const subjectOptions = React.useMemo(() => getSubjectOptions(), [])

  if (items.length === 0) {
    return <EmptyState variant="no-data" description={TEACHER_MSG.PENDING_EMPTY} />
  }

  return (
    <div className="space-y-3">
      {items.map((invitation) => (
        <Card key={invitation.id} className="gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <Avatar className="size-11 shrink-0">
                <AvatarFallback>
                  {invitation.name
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-base font-semibold text-foreground">
                    {invitation.name}
                  </p>
                  {invitation.subjectIds.map((subjectId) => {
                    const subject = subjectOptions.find((o) => o.value === subjectId)
                    return subject ? (
                      <Badge key={subjectId} variant="secondary" className="rounded-full">
                        {subject.label}
                      </Badge>
                    ) : null
                  })}
                  {invitation.grades.length > 0 && (
                    <Badge variant="outline" className="rounded-full">
                      {TEACHER_MSG.INVITATION_GRADES(invitation.grades.join(", "))}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {invitation.email} · {invitation.phone}
                  {invitation.source && ` · ${invitation.source}`}
                </p>

                {invitation.experienceNote && (
                  <p className="text-xs text-muted-foreground">
                    {TEACHER_MSG.INVITATION_EXPERIENCE}: {invitation.experienceNote}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">
                    <DateText value={invitation.createdAt} format="datetime" />
                  </span>
                  {invitation.cvFileName && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <HugeiconsIcon icon={File01Icon} className="size-3.5" />
                      {invitation.cvFileName}
                      <button
                        type="button"
                        className="ml-0.5 underline underline-offset-2"
                        onClick={() => toast.success(TEACHER_MSG.INVITATION_VIEW_CV)}
                      >
                        {TEACHER_MSG.INVITATION_VIEW_CV}
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={isPending}
                leftIcon={<HugeiconsIcon icon={Cancel01Icon} />}
                onClick={() => onReview(invitation, false)}
              >
                {TEACHER_MSG.INVITATION_REJECT}
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={isPending}
                leftIcon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
                onClick={() => onReview(invitation, true)}
              >
                {TEACHER_MSG.INVITATION_APPROVE}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SentList({ items }: { items: TeacherInvitation[] }) {
  if (items.length === 0) {
    return <EmptyState variant="no-data" description={TEACHER_MSG.SENT_EMPTY} />
  }

  return (
    <div className="space-y-3">
      {items.map((invitation) => (
        <Card key={invitation.id} className="gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                  {invitation.name
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invitation.name}
                  </p>
                  {invitation.subjectIds.map((subjectId) => (
                    <SubjectTag
                      key={subjectId}
                      code={
                        MOCK_SUBJECTS.find((subject) => subject.id === subjectId)
                          ?.code ?? ""
                      }
                    />
                  ))}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {invitation.email} ·{" "}
                  <DateText value={invitation.createdAt} format="relative" />
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-destructive"
                onClick={() => toast.success(TEACHER_MSG.INVITATION_REVOKE)}
              >
                {TEACHER_MSG.INVITATION_REVOKE}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => toast.success(TEACHER_MSG.RESEND_SUCCESS)}
              >
                {TEACHER_MSG.INVITATION_RESEND}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export { TeacherInvitationsView }
