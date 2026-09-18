"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkSquare01Icon,
  PrinterIcon,
  ShieldKeyIcon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ExportButton } from "@/components/shared/actions/export-button"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { UserCell } from "@/components/shared/display/user-cell"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ERROR_MSG } from "@/constants/messages/error"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { ROUTES } from "@/constants/routes"
import {
  assignSubstituteSchema,
  type AssignSubstituteFormInput,
} from "@/lib/validators/teacher"
import { MockError } from "@/mocks/utils/mock-query"
import {
  getSubstituteCandidates,
  type SubstituteCandidate,
  type SubstituteCandidateSession,
  type SubstituteHistoryRow,
} from "@/features/teachers/selectors"
import {
  useAssignSubstitute,
  useSubstituteData,
} from "@/features/teachers/hooks/use-teachers"

function SubstitutesView() {
  const substituteData = useSubstituteData()
  const assignSubstitute = useAssignSubstitute()

  const [sessionTab, setSessionTab] = useQueryState(
    "sessionTab",
    parseAsString.withDefault("needs")
  )
  const [selectedSessionId, setSelectedSessionId] = useQueryState(
    "session",
    parseAsString.withDefault("")
  )

  const form = useForm<AssignSubstituteFormInput>({
    resolver: zodResolver(assignSubstituteSchema),
    defaultValues: {
      classSessionId: "",
      substituteTeacherId: "",
      reason: "",
      notifyTeacher: true,
      notifyParents: true,
    },
  })

  const { control, register, handleSubmit, setValue, reset, formState } = form
  const selectedTeacherId = useWatch({ control, name: "substituteTeacherId" })

  const sessions = React.useMemo(
    () => substituteData.data?.sessions ?? [],
    [substituteData.data]
  )
  const needsTeacherSessions = React.useMemo(
    () => sessions.filter((item) => item.needsTeacher),
    [sessions]
  )

  const visibleSessions =
    sessionTab === "needs" ? needsTeacherSessions : sessions

  const selectedSession = React.useMemo(
    () => sessions.find((item) => item.session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  )

  const candidates = React.useMemo(
    () => (selectedSessionId ? getSubstituteCandidates(selectedSessionId) : []),
    [selectedSessionId]
  )

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setValue("classSessionId", sessionId)
    setValue("substituteTeacherId", "")
  }

  const onSubmit = (values: AssignSubstituteFormInput) => {
    assignSubstitute.mutate(values, {
      onSuccess: () => {
        const teacherName = candidates.find(
          (item) => item.teacher.id === values.substituteTeacherId
        )?.teacher.name
        toast.success(TEACHER_MSG.ASSIGN_SUCCESS(teacherName ?? ""))
        reset({
          classSessionId: "",
          substituteTeacherId: "",
          reason: "",
          notifyTeacher: true,
          notifyParents: true,
        })
        setSelectedSessionId(null)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title={TEACHER_MSG.SUBSTITUTE_TITLE}
        description={TEACHER_MSG.SUBSTITUTE_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Giáo viên" },
          { label: TEACHER_MSG.SUBSTITUTE_TITLE },
        ]}
        actions={
          <>
            {needsTeacherSessions.length > 0 && (
              <Badge variant="danger" className="rounded-full">
                {TEACHER_MSG.SUBSTITUTE_PENDING_BADGE(needsTeacherSessions.length)}
              </Badge>
            )}
            <Badge variant="secondary" className="rounded-full">
              <HugeiconsIcon icon={ShieldKeyIcon} className="size-3" />
              {TEACHER_MSG.SUBSTITUTE_RULE_BADGE}
            </Badge>
          </>
        }
      />

      <AsyncBoundary
        isLoading={substituteData.isPending}
        isError={substituteData.isError}
        error={substituteData.error}
        onRetry={() => substituteData.refetch()}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionCard title={TEACHER_MSG.SESSION_PICKER_TITLE}>
              <div className="space-y-3">
                <Tabs
                  value={sessionTab}
                  onValueChange={(value) => setSessionTab(String(value))}
                >
                  <TabsList className="h-10 rounded-full bg-muted/60 p-1">
                    <TabsTrigger
                      value="needs"
                      className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
                    >
                      {TEACHER_MSG.SESSION_TAB_NEEDS(needsTeacherSessions.length)}
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
                    >
                      {TEACHER_MSG.SESSION_TAB_ALL(sessions.length)}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {visibleSessions.length === 0 ? (
                  <EmptyState variant="no-data" />
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {visibleSessions.map((item) => (
                      <SessionOption
                        key={item.session.id}
                        item={item}
                        selected={item.session.id === selectedSessionId}
                        onSelect={() => handleSelectSession(item.session.id)}
                      />
                    ))}
                  </div>
                )}

                <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                  {TEACHER_MSG.SESSION_PICKER_NOTE}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title={
                selectedSession
                  ? TEACHER_MSG.CANDIDATE_TITLE(selectedSession.subjectCode)
                  : TEACHER_MSG.CANDIDATE_TITLE("")
              }
              description={TEACHER_MSG.CANDIDATE_DESC}
            >
              {!selectedSession ? (
                <EmptyState variant="no-data" description={TEACHER_MSG.SELECT_SESSION_FIRST} />
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  {candidates.length === 0 ? (
                    <EmptyState variant="no-data" description={TEACHER_MSG.CANDIDATE_EMPTY} />
                  ) : (
                    <Controller
                      control={control}
                      name="substituteTeacherId"
                      render={({ field }) => (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {candidates.map((candidate) => (
                            <CandidateOption
                              key={candidate.teacher.id}
                              candidate={candidate}
                              selected={field.value === candidate.teacher.id}
                              onSelect={() =>
                                !candidate.hasConflict && field.onChange(candidate.teacher.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                    />
                  )}

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {TEACHER_MSG.CONFIRM_TITLE}
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="substitute-reason" required>
                        {TEACHER_MSG.FIELD_REASON}
                      </Label>
                      <Textarea
                        id="substitute-reason"
                        rows={2}
                        placeholder={TEACHER_MSG.FIELD_REASON_PLACEHOLDER}
                        error={Boolean(formState.errors.reason)}
                        {...register("reason")}
                      />
                      {formState.errors.reason && (
                        <p className="text-xs text-destructive">
                          {formState.errors.reason.message}
                        </p>
                      )}
                    </div>

                    <NotifyCheckbox
                      id="notify-teacher"
                      control={control}
                      name="notifyTeacher"
                      label={TEACHER_MSG.NOTIFY_TEACHER}
                      hint={TEACHER_MSG.NOTIFY_TEACHER_HINT}
                    />
                    <NotifyCheckbox
                      id="notify-parents"
                      control={control}
                      name="notifyParents"
                      label={TEACHER_MSG.NOTIFY_PARENTS}
                      hint={TEACHER_MSG.NOTIFY_PARENTS_HINT}
                    />

                    {formState.errors.substituteTeacherId && (
                      <p className="text-xs text-destructive">
                        {formState.errors.substituteTeacherId.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => setSelectedSessionId(null)}
                    >
                      {TEACHER_MSG.CANCEL}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      leftIcon={<HugeiconsIcon icon={PrinterIcon} />}
                      onClick={() => window.print()}
                    >
                      {TEACHER_MSG.PRINT_HANDOVER}
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-full"
                      isLoading={assignSubstitute.isPending}
                      disabled={!selectedTeacherId}
                      leftIcon={<HugeiconsIcon icon={CheckmarkSquare01Icon} />}
                    >
                      {TEACHER_MSG.CONFIRM_SUBMIT}
                    </Button>
                  </div>
                </form>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title={TEACHER_MSG.HISTORY_TITLE}
            description={TEACHER_MSG.HISTORY_DESC}
            action={
              <ExportButton
                variant="outline"
                size="sm"
                className="rounded-full"
                label={TEACHER_MSG.EXPORT}
                onExport={() => {
                  toast.success(TEACHER_MSG.EXPORT_SUCCESS)
                }}
              />
            }
          >
            <HistoryTable rows={substituteData.data?.history ?? []} />
          </SectionCard>
        </div>
      </AsyncBoundary>
    </PageContainer>
  )
}

function SessionOption({
  item,
  selected,
  onSelect,
}: {
  item: SubstituteCandidateSession
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SubjectTag code={item.subjectCode} />
            <span className="truncate text-sm font-medium text-foreground">
              {item.classRecord?.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <DateText value={item.session.date} format="datetime" /> ·{" "}
            {item.session.startTime}–{item.session.endTime}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.mainTeacherName
              ? `${TEACHER_MSG.SESSION_MAIN_TEACHER}: ${item.mainTeacherName}`
              : TEACHER_MSG.SESSION_STUDENT_COUNT(item.studentCount)}
          </p>
        </div>
        {item.needsTeacher && (
          <Badge variant="danger" className="shrink-0 rounded-full">
            {TEACHER_MSG.SESSION_NO_TEACHER}
          </Badge>
        )}
      </div>
    </button>
  )
}

function CandidateOption({
  candidate,
  selected,
  onSelect,
}: {
  candidate: SubstituteCandidate
  selected: boolean
  onSelect: () => void
}) {
  const { teacher, hasConflict, isSameSubject, sessionsOnDate } = candidate

  return (
    <button
      type="button"
      disabled={hasConflict}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
        hasConflict && "cursor-not-allowed opacity-50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/60"
      )}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarFallback>
          {teacher.name
            .split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{teacher.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {hasConflict ? (
            <Badge variant="danger" className="rounded-full">
              {TEACHER_MSG.CANDIDATE_CONFLICT}
            </Badge>
          ) : (
            <Badge variant="success" className="rounded-full">
              {TEACHER_MSG.CANDIDATE_NO_CONFLICT}
            </Badge>
          )}
          {isSameSubject && (
            <Badge variant="info" className="rounded-full">
              {TEACHER_MSG.CANDIDATE_SAME_SUBJECT}
            </Badge>
          )}
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {TEACHER_MSG.CANDIDATE_TODAY_LOAD(sessionsOnDate)}
          <span className="flex items-center gap-0.5">
            <HugeiconsIcon icon={StarIcon} className="size-3" />
            {teacher.rating || "—"}
          </span>
        </p>
      </div>

      {selected && (
        <Badge className="shrink-0 rounded-full">{TEACHER_MSG.CANDIDATE_SELECTED}</Badge>
      )}
    </button>
  )
}

function NotifyCheckbox({
  id,
  control,
  name,
  label,
  hint,
}: {
  id: string
  control: ReturnType<typeof useForm<AssignSubstituteFormInput>>["control"]
  name: "notifyTeacher" | "notifyParents"
  label: string
  hint: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start gap-2">
          <Checkbox
            id={id}
            className="mt-0.5"
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          <div className="space-y-0.5">
            <Label htmlFor={id} className="cursor-pointer font-normal">
              {label}
            </Label>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
      )}
    />
  )
}

function HistoryTable({ rows }: { rows: SubstituteHistoryRow[] }) {
  const [search, setSearch] = React.useState("")

  const filtered = rows.filter((item) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true

    return (
      item.classRecord?.name.toLowerCase().includes(keyword) ||
      item.mainTeacherName?.toLowerCase().includes(keyword) ||
      item.substituteTeacherName?.toLowerCase().includes(keyword)
    )
  })

  const statusConfig: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" }
  > = {
    confirmed: { label: TEACHER_MSG.HISTORY_STATUS_CONFIRMED, variant: "success" },
    pending_confirm: { label: TEACHER_MSG.HISTORY_STATUS_PENDING, variant: "warning" },
    cancelled: { label: TEACHER_MSG.HISTORY_STATUS_CANCELLED, variant: "danger" },
  }

  return (
    <div className="space-y-4">
      <div className="w-full sm:w-72">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={TEACHER_MSG.HISTORY_SEARCH_PLACEHOLDER}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState variant="no-data" description={TEACHER_MSG.HISTORY_EMPTY} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{TEACHER_MSG.HISTORY_COL_SESSION}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_MAIN}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_SUBSTITUTE}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_REASON}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_ASSIGNER}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_TIME}</TableHead>
              <TableHead>{TEACHER_MSG.HISTORY_COL_STATUS}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const status = statusConfig[item.assignment.status]

              return (
                <TableRow key={item.assignment.id}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">
                      {item.classRecord?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <DateText value={item.session?.date} /> · Buổi {item.lessonOrder}
                    </p>
                  </TableCell>
                  <TableCell>
                    <UserCell name={item.mainTeacherName ?? "—"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <UserCell name={item.substituteTeacherName ?? "—"} />
                      <Badge variant="secondary" className="rounded-full text-[0.625rem]">
                        {TEACHER_MSG.SUBSTITUTE_BADGE}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 text-sm text-muted-foreground">
                    {item.assignment.reason}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.assignedByName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DateText value={item.assignment.assignedAt} format="datetime" />
                  </TableCell>
                  <TableCell>
                    {status && (
                      <Badge variant={status.variant} className="rounded-full">
                        {status.label}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export { SubstitutesView }
