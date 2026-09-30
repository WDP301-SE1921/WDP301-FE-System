"use client"

import * as React from "react"
import { parseAsString, useQueryState } from "nuqs"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ConditionChips } from "@/components/shared/pickers/condition-chips"
import { StudentPicker } from "@/components/shared/pickers/entity-picker-presets"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import { SessionOptionList, type SessionOption } from "@/components/shared/pickers/session-option-list"
import { DateText } from "@/components/shared/display/date-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonCardList, SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROUTES } from "@/constants/routes"
import {
  useAssignMakeup,
  useMakeupCandidates,
  useMarkAbsentOnly,
  useReportableSessions,
} from "@/features/absences/hooks/use-absences"
import {
  fetchActiveStudentOptions,
  getActiveEnrollmentOptions,
  getMakeupPrefill,
} from "@/features/absences/selectors"
import { CancelledSessionsMakeupCard } from "@/features/absences/components/cancelled-sessions-makeup-card"
import { PendingMakeupTable } from "@/features/absences/components/pending-makeup-table"
import { MAKEUP_KIND, assignMakeupSchema, type AssignMakeupFormInput } from "@/lib/validators/absence"
import { findClassSession, resolveLessonTitle } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import type { MakeupKind } from "@/types/absence"

export interface MakeupWorkflowViewProps {
  mode: MakeupKind
}

const EMPTY_DEFAULTS: AssignMakeupFormInput = {
  kind: MAKEUP_KIND.MAKEUP,
  studentProfileId: "",
  enrollmentId: "",
  originalSessionId: "",
  makeupSessionId: "",
  markOriginalAbsent: false,
  note: "",
}

function MakeupWorkflowView({ mode }: MakeupWorkflowViewProps) {
  const isSwap = mode === MAKEUP_KIND.SWAP
  const [studentIdParam] = useQueryState("studentId", parseAsString)
  const [sessionIdParam] = useQueryState("sessionId", parseAsString)
  // Deep-link từ danh sách buổi bị hủy: học sinh + buổi nghỉ chọn sẵn.
  const [prefill] = React.useState(() => getMakeupPrefill(studentIdParam, sessionIdParam))
  const [selectedStudent, setSelectedStudent] = React.useState<EntityOption | null>(
    prefill?.student ?? null
  )

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssignMakeupFormInput>({
    resolver: zodResolver(assignMakeupSchema),
    defaultValues: {
      ...EMPTY_DEFAULTS,
      kind: mode,
      ...(prefill
        ? {
            studentProfileId: prefill.student.id,
            enrollmentId: prefill.enrollmentId,
            originalSessionId: prefill.originalSessionId,
          }
        : {}),
    },
  })

  const studentProfileId = useWatch({ control, name: "studentProfileId" })
  const enrollmentId = useWatch({ control, name: "enrollmentId" })
  const originalSessionId = useWatch({ control, name: "originalSessionId" })
  const makeupSessionId = useWatch({ control, name: "makeupSessionId" })

  const enrollmentOptions = React.useMemo(
    () => (studentProfileId ? getActiveEnrollmentOptions(studentProfileId) : []),
    [studentProfileId]
  )
  const enrollmentItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(enrollmentOptions.map((item) => [item.enrollment.id, item.label])),
    [enrollmentOptions]
  )
  const selectedEnrollment = enrollmentOptions.find(
    (item) => item.enrollment.id === enrollmentId
  )

  const sessionsQuery = useReportableSessions(selectedEnrollment?.classRecord.id ?? null, isSwap)
  const candidatesQuery = useMakeupCandidates(originalSessionId || null)
  const assignMakeup = useAssignMakeup()
  const markAbsentOnly = useMarkAbsentOnly()

  const originalSession = originalSessionId ? findClassSession(originalSessionId) : undefined
  const originalLessonTitle = originalSession ? resolveLessonTitle(originalSession.lessonId) : ""

  const sessionOptions: SessionOption[] = (sessionsQuery.data ?? []).map((row) => ({
    id: row.session.id,
    sessionNo: row.order,
    date: row.session.date,
    time: `${row.session.startTime}–${row.session.endTime}`,
    room: row.room,
    topic: row.lessonTitle,
    available: true,
  }))

  const resetAll = () => {
    reset({ ...EMPTY_DEFAULTS, kind: mode })
    setSelectedStudent(null)
  }

  const onSubmit = (values: AssignMakeupFormInput) => {
    assignMakeup.mutate(
      {
        kind: values.kind,
        studentProfileId: values.studentProfileId,
        originalSessionId: values.originalSessionId,
        makeupSessionId: values.makeupSessionId,
        markOriginalAbsent: isSwap ? true : values.markOriginalAbsent,
        note: values.note,
      },
      {
        onSuccess: () => {
          toast.success(
            isSwap
              ? ABSENCE_MSG.ASSIGN_SWAP_SUCCESS(selectedStudent?.name ?? "")
              : ABSENCE_MSG.ASSIGN_MAKEUP_SUCCESS(selectedStudent?.name ?? "")
          )
          resetAll()
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  const handleMarkAbsentOnly = () => {
    if (!originalSessionId || !studentProfileId) return

    markAbsentOnly.mutate(
      { originalSessionId, studentProfileId },
      {
        onSuccess: () => {
          toast.success(ABSENCE_MSG.MARK_ABSENT_ONLY_SUCCESS)
          resetAll()
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
        title={isSwap ? ABSENCE_MSG.SWAP_TITLE : ABSENCE_MSG.MAKEUP_TITLE}
        description={isSwap ? ABSENCE_MSG.SWAP_DESC : ABSENCE_MSG.MAKEUP_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Nghỉ học & học bù" },
          { label: isSwap ? ABSENCE_MSG.SWAP_TITLE : ABSENCE_MSG.MAKEUP_TITLE },
        ]}
      />

      {isSwap && (
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>{ABSENCE_MSG.SWAP_INFO_ALERT_TITLE}</AlertTitle>
          <AlertDescription>{ABSENCE_MSG.SWAP_INFO_ALERT_DESC}</AlertDescription>
        </Alert>
      )}

      {!isSwap && <CancelledSessionsMakeupCard />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
        <div className="lg:col-span-2">
          <SectionCard title={ABSENCE_MSG.STEP_ORIGINAL_TITLE}>
            <div className="space-y-4">
              <StudentPicker
                fetcher={fetchActiveStudentOptions}
                value={studentProfileId || null}
                selectedEntity={selectedStudent}
                onChange={(id, entity) => {
                  setValue("studentProfileId", id, { shouldValidate: true })
                  setValue("enrollmentId", "")
                  setValue("originalSessionId", "")
                  setValue("makeupSessionId", "")
                  setSelectedStudent(entity)
                }}
                onClear={resetAll}
                error={errors.studentProfileId?.message}
              />

              {studentProfileId && (
                <div className="space-y-1.5">
                  <Label htmlFor="makeup-enrollment" required>
                    {ABSENCE_MSG.FIELD_ENROLLMENT}
                  </Label>
                  <Select
                    items={enrollmentItems}
                    value={enrollmentId || null}
                    onValueChange={(value) => {
                      setValue("enrollmentId", String(value ?? ""), { shouldValidate: true })
                      setValue("originalSessionId", "")
                      setValue("makeupSessionId", "")
                    }}
                  >
                    <SelectTrigger
                      id="makeup-enrollment"
                      className="rounded-xl"
                      error={Boolean(errors.enrollmentId)}
                    >
                      <SelectValue placeholder={ABSENCE_MSG.FIELD_ENROLLMENT_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(enrollmentItems).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedEnrollment && (
                <div className="space-y-1.5">
                  <Label required>{ABSENCE_MSG.SESSION_LIST_TITLE}</Label>
                  {sessionsQuery.isPending ? (
                    <SkeletonCardList count={2} />
                  ) : sessionOptions.length === 0 ? (
                    <EmptyState description={ABSENCE_MSG.SESSION_LIST_EMPTY} />
                  ) : (
                    <SessionOptionList
                      sessions={sessionOptions}
                      value={originalSessionId || null}
                      onChange={(id) => {
                        setValue("originalSessionId", id, { shouldValidate: true })
                        setValue("makeupSessionId", "")
                      }}
                    />
                  )}
                  {errors.originalSessionId && (
                    <p className="text-xs text-destructive">{errors.originalSessionId.message}</p>
                  )}
                </div>
              )}

              {!isSwap && originalSessionId && (
                <Controller
                  control={control}
                  name="markOriginalAbsent"
                  render={({ field }) => (
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="mark-original-absent"
                        className="mt-0.5"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <Label
                        htmlFor="mark-original-absent"
                        className="cursor-pointer text-sm font-normal"
                      >
                        {ABSENCE_MSG.MARK_ABSENT_LABEL}
                      </Label>
                    </div>
                  )}
                />
              )}

              {originalSessionId && (
                <div className="space-y-1.5">
                  <Label htmlFor="absence-note">{ABSENCE_MSG.NOTE_LABEL}</Label>
                  <Textarea
                    id="absence-note"
                    rows={2}
                    placeholder={ABSENCE_MSG.NOTE_PLACEHOLDER}
                    {...register("note")}
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title={ABSENCE_MSG.STEP_MAKEUP_TITLE}>
            {!originalSessionId ? (
              <EmptyState
                icon={<HugeiconsIcon icon={Calendar01Icon} />}
                description={ABSENCE_MSG.SELECT_SESSION_FIRST}
              />
            ) : candidatesQuery.isPending ? (
              <SkeletonTable rows={3} cols={5} />
            ) : (
              <div className="space-y-4">
                <ConditionChips
                  conditions={[
                    { id: "program", label: ABSENCE_MSG.CONDITION_SAME_PROGRAM, status: "pass" },
                    {
                      id: "lesson",
                      label: ABSENCE_MSG.CONDITION_SAME_LESSON(originalLessonTitle),
                      status: "pass",
                    },
                    { id: "future", label: ABSENCE_MSG.CONDITION_NOT_HAPPENED, status: "pass" },
                    { id: "seat", label: ABSENCE_MSG.CONDITION_HAS_SEAT, status: "pass" },
                  ]}
                />

                {(candidatesQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<HugeiconsIcon icon={Calendar01Icon} />}
                    title={ABSENCE_MSG.EMPTY_CANDIDATE_TITLE}
                    description={ABSENCE_MSG.EMPTY_CANDIDATE_DESC}
                    actionLabel={!isSwap ? ABSENCE_MSG.EMPTY_CANDIDATE_ACTION : undefined}
                    onAction={!isSwap ? handleMarkAbsentOnly : undefined}
                  />
                ) : (
                  <>
                    <RadioGroup
                      value={makeupSessionId}
                      onValueChange={(value) =>
                        setValue("makeupSessionId", String(value ?? ""), { shouldValidate: true })
                      }
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{ABSENCE_MSG.CANDIDATE_COL_DATETIME}</TableHead>
                            <TableHead>{ABSENCE_MSG.CANDIDATE_COL_CLASS}</TableHead>
                            <TableHead>{ABSENCE_MSG.CANDIDATE_COL_TEACHER}</TableHead>
                            <TableHead>{ABSENCE_MSG.CANDIDATE_COL_ROOM}</TableHead>
                            <TableHead>{ABSENCE_MSG.CANDIDATE_COL_SEATS}</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(candidatesQuery.data ?? []).map((candidate) => (
                            <TableRow
                              key={candidate.session.id}
                              className={cn(
                                makeupSessionId === candidate.session.id && "bg-primary/5"
                              )}
                            >
                              <TableCell className="whitespace-nowrap">
                                <DateText value={candidate.session.date} />
                                <span className="block text-xs text-muted-foreground">
                                  {candidate.session.startTime}–{candidate.session.endTime}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-foreground">
                                {candidate.classRecord.name}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {candidate.teacherName ?? "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {candidate.classRecord.room}
                              </TableCell>
                              <TableCell>
                                <Badge variant="info" className="rounded-full">
                                  {ABSENCE_MSG.CANDIDATE_SEATS(candidate.availableSlots)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <RadioGroupItem value={candidate.session.id} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </RadioGroup>
                    {errors.makeupSessionId && (
                      <p className="text-xs text-destructive">{errors.makeupSessionId.message}</p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">{ABSENCE_MSG.FOOTER_NOTE}</p>
                      <Button
                        className="rounded-full"
                        isLoading={assignMakeup.isPending}
                        onClick={handleSubmit(onSubmit)}
                      >
                        {isSwap ? ABSENCE_MSG.SUBMIT_SWAP : ABSENCE_MSG.SUBMIT_MAKEUP}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <PendingMakeupTable kind={mode} />
    </PageContainer>
  )
}

export { MakeupWorkflowView }
