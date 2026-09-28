"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, ArrowRight01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ClassOptionCard } from "@/components/shared/pickers/class-option-card"
import { StudentPicker } from "@/components/shared/pickers/entity-picker-presets"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROUTES } from "@/constants/routes"
import { useChangeClass, useClassChangeContext } from "@/features/absences/hooks/use-absences"
import { fetchActiveStudentOptions, getActiveEnrollmentOptions } from "@/features/absences/selectors"
import {
  changeClassFormSchema,
  type ChangeClassFormInput,
} from "@/lib/validators/absence"
import { findSubject, findTeacher } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"

function ChangeClassView() {
  const [selectedStudent, setSelectedStudent] = React.useState<EntityOption | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChangeClassFormInput>({
    resolver: zodResolver(changeClassFormSchema),
    defaultValues: {
      studentProfileId: "",
      enrollmentId: "",
      toClassId: "",
      effectiveDate: "",
      reason: "",
    },
  })

  const studentProfileId = useWatch({ control, name: "studentProfileId" })
  const enrollmentId = useWatch({ control, name: "enrollmentId" })
  const toClassId = useWatch({ control, name: "toClassId" })
  const effectiveDate = useWatch({ control, name: "effectiveDate" })
  const reason = useWatch({ control, name: "reason" })

  const enrollmentOptions = React.useMemo(
    () => (studentProfileId ? getActiveEnrollmentOptions(studentProfileId) : []),
    [studentProfileId]
  )
  const enrollmentItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(enrollmentOptions.map((item) => [item.enrollment.id, item.label])),
    [enrollmentOptions]
  )

  const contextQuery = useClassChangeContext(enrollmentId || null)
  const changeClass = useChangeClass()
  const context = contextQuery.data

  const subjectCode = context ? findSubject(context.currentClass.subjectId)?.code ?? "" : ""
  const selectedCandidate = context?.candidates.find((item) => item.classRecord.id === toClassId)

  const resetAll = () => {
    reset()
    setSelectedStudent(null)
  }

  const onSubmit = () => {
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!context || !selectedCandidate) return

    changeClass.mutate(
      {
        studentProfileId,
        enrollmentId,
        toClassId,
        effectiveDate,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(
            ABSENCE_MSG.CHANGE_CLASS_SUCCESS(
              selectedStudent?.name ?? "",
              selectedCandidate.classRecord.name
            )
          )
          resetAll()
          setIsConfirmOpen(false)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
          setIsConfirmOpen(false)
        },
      }
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={ABSENCE_MSG.CHANGE_CLASS_TITLE}
        description={ABSENCE_MSG.CHANGE_CLASS_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Nghỉ học & học bù" },
          { label: ABSENCE_MSG.CHANGE_CLASS_TITLE },
        ]}
      />

      <SectionCard title={ABSENCE_MSG.PICK_STUDENT_TITLE}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StudentPicker
            fetcher={fetchActiveStudentOptions}
            value={studentProfileId || null}
            selectedEntity={selectedStudent}
            onChange={(id, entity) => {
              setValue("studentProfileId", id, { shouldValidate: true })
              setValue("enrollmentId", "")
              setValue("toClassId", "")
              setSelectedStudent(entity)
            }}
            onClear={resetAll}
            error={errors.studentProfileId?.message}
          />

          {studentProfileId && (
            <div className="space-y-1.5">
              <Label htmlFor="change-class-enrollment" required>
                {ABSENCE_MSG.FIELD_ENROLLMENT}
              </Label>
              <Select
                items={enrollmentItems}
                value={enrollmentId || null}
                onValueChange={(value) => {
                  setValue("enrollmentId", String(value ?? ""), { shouldValidate: true })
                  setValue("toClassId", "")
                }}
              >
                <SelectTrigger
                  id="change-class-enrollment"
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
        </div>
      </SectionCard>

      {!enrollmentId ? (
        <EmptyState description={ABSENCE_MSG.SELECT_ENROLLMENT_FIRST} />
      ) : contextQuery.isPending ? (
        <SkeletonCardList count={3} />
      ) : (
        context && (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_auto_2fr]">
            <SectionCard title={ABSENCE_MSG.CURRENT_CLASS_TITLE}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SubjectTag code={subjectCode} />
                  <p className="font-semibold text-foreground">{context.currentClass.name}</p>
                </div>
                <ScheduleText
                  days={context.currentClass.weekdays}
                  time={`${context.currentClass.startTime}–${context.currentClass.endTime}`}
                  room={context.currentClass.room}
                />
                <p className="text-sm text-muted-foreground">
                  GV: {findTeacher(context.currentClass.teacherId)?.name ?? "—"}
                </p>
                <ProgressStat
                  value={context.currentProgress.completed}
                  max={context.currentProgress.total}
                  description={ABSENCE_MSG.PROGRESS_LABEL(
                    context.currentProgress.completed,
                    context.currentProgress.total
                  )}
                />
              </div>
            </SectionCard>

            <div className="flex items-center justify-center py-2 text-muted-foreground lg:py-0">
              <HugeiconsIcon icon={ArrowRight01Icon} className="hidden size-8 lg:block" />
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-8 lg:hidden" />
            </div>

            <SectionCard title={ABSENCE_MSG.CANDIDATE_CLASS_TITLE}>
              {context.candidates.length === 0 ? (
                <EmptyState
                  title={ABSENCE_MSG.NO_CANDIDATE_TITLE}
                  description={ABSENCE_MSG.NO_CANDIDATE_DESC}
                />
              ) : (
                <div className="space-y-3">
                  {context.candidates.map((candidate) => (
                    <div key={candidate.classRecord.id}>
                      <ClassOptionCard
                        name={candidate.classRecord.name}
                        subjectCode={subjectCode}
                        schedule={candidate.classRecord.weekdays.join(" - ")}
                        time={`${candidate.classRecord.startTime}–${candidate.classRecord.endTime}`}
                        room={candidate.classRecord.room}
                        teacherName={candidate.teacherName ?? "—"}
                        enrolled={candidate.enrolled}
                        capacity={candidate.classRecord.capacity}
                        selected={toClassId === candidate.classRecord.id}
                        onSelect={
                          candidate.isFull
                            ? undefined
                            : () => setValue("toClassId", candidate.classRecord.id, { shouldValidate: true })
                        }
                        className={candidate.isFull ? "pointer-events-none opacity-60" : undefined}
                      />
                      {candidate.progressGap !== 0 && (
                        <Alert variant="warning" className="mt-2">
                          <HugeiconsIcon icon={Alert01Icon} />
                          <AlertDescription>
                            {ABSENCE_MSG.PROGRESS_MISMATCH(
                              candidate.progress.completed,
                              candidate.progressGap
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )
      )}

      {toClassId && (
        <SectionCard title={ABSENCE_MSG.FIELD_REASON}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="change-class-date" required>
                  {ABSENCE_MSG.FIELD_EFFECTIVE_DATE}
                </Label>
                <Input
                  id="change-class-date"
                  type="date"
                  error={Boolean(errors.effectiveDate)}
                  {...register("effectiveDate")}
                />
                {errors.effectiveDate && (
                  <p className="text-xs text-destructive">{errors.effectiveDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="change-class-reason" required>
                {ABSENCE_MSG.FIELD_REASON}
              </Label>
              <Textarea
                id="change-class-reason"
                rows={3}
                placeholder={ABSENCE_MSG.FIELD_REASON_PLACEHOLDER}
                error={Boolean(errors.reason)}
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                {ABSENCE_MSG.SUBMIT_CHANGE_CLASS}
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {context && selectedCandidate && (
        <ConfirmDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title={ABSENCE_MSG.CHANGE_CLASS_CONFIRM_TITLE}
          description={ABSENCE_MSG.CHANGE_CLASS_CONFIRM_DESC(
            effectiveDate,
            selectedStudent?.name ?? "",
            selectedCandidate.classRecord.name,
            `${selectedCandidate.classRecord.weekdays.join("-")} ${selectedCandidate.classRecord.startTime}–${selectedCandidate.classRecord.endTime}`
          )}
          confirmText={ACTION_LABEL.CONFIRM}
          isLoading={changeClass.isPending}
          onConfirm={handleConfirm}
        />
      )}
    </PageContainer>
  )
}

export { ChangeClassView }
