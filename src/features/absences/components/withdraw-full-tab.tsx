"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { StudentPicker } from "@/components/shared/pickers/entity-picker-presets"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import { DateText } from "@/components/shared/display/date-text"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { SectionCard } from "@/components/shared/display/section-card"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ERROR_MSG } from "@/constants/messages/error"
import { useWithdraw } from "@/features/absences/hooks/use-absences"
import { fetchActiveStudentOptions, getWithdrawableEnrollments } from "@/features/absences/selectors"
import { withdrawSchema, WITHDRAWAL_KIND, type WithdrawFormInput } from "@/lib/validators/absence"
import { MockError } from "@/mocks/utils/mock-query"

const EMPTY_DEFAULTS: WithdrawFormInput = {
  studentProfileId: "",
  kind: WITHDRAWAL_KIND.FULL,
  enrollmentIds: [],
  effectiveDate: "",
  reason: "",
}

function WithdrawFullTab() {
  const [selectedStudent, setSelectedStudent] = React.useState<EntityOption | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const withdraw = useWithdraw()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormInput>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const studentProfileId = useWatch({ control, name: "studentProfileId" })
  const effectiveDate = useWatch({ control, name: "effectiveDate" })
  const reason = useWatch({ control, name: "reason" })

  const enrollments = React.useMemo(
    () => (studentProfileId ? getWithdrawableEnrollments(studentProfileId) : []),
    [studentProfileId]
  )

  const resetAll = () => {
    reset(EMPTY_DEFAULTS)
    setSelectedStudent(null)
  }

  const handleConfirm = () => {
    withdraw.mutate(
      {
        studentProfileId,
        kind: WITHDRAWAL_KIND.FULL,
        enrollmentIds: enrollments.map((item) => item.enrollment.id),
        effectiveDate,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(ABSENCE_MSG.WITHDRAW_FULL_SUCCESS(selectedStudent?.name ?? ""))
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
    <div className="space-y-4">
      <SectionCard title={ABSENCE_MSG.FIELD_STUDENT}>
        <StudentPicker
          fetcher={fetchActiveStudentOptions}
          value={studentProfileId || null}
          selectedEntity={selectedStudent}
          onChange={(id, entity) => {
            setValue("studentProfileId", id, { shouldValidate: true })
            setSelectedStudent(entity)
          }}
          onClear={resetAll}
          error={errors.studentProfileId?.message}
        />
      </SectionCard>

      {studentProfileId && (
        <>
          {enrollments.length === 0 ? (
            <EmptyState
              title={ABSENCE_MSG.NO_ACTIVE_ENROLLMENT_TITLE}
              description={ABSENCE_MSG.NO_ACTIVE_ENROLLMENT_DESC}
            />
          ) : (
            <SectionCard title={ABSENCE_MSG.FULL_ENDING_TITLE}>
              <div className="space-y-3">
                {enrollments.map((item) => (
                  <div
                    key={item.enrollment.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {item.classRecord.name}
                    </p>
                    <ScheduleText
                      days={item.classRecord.weekdays}
                      time={`${item.classRecord.startTime}–${item.classRecord.endTime}`}
                      room={item.classRecord.room}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hết gói: <DateText value={item.enrollment.endDate} />
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <Alert variant="info">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>{ABSENCE_MSG.FULL_INFO_ALERT_TITLE}</AlertTitle>
            <AlertDescription>{ABSENCE_MSG.FULL_INFO_ALERT_DESC}</AlertDescription>
          </Alert>

          <SectionCard title={ABSENCE_MSG.FIELD_REASON}>
            <form
              className="space-y-4"
              noValidate
              onSubmit={handleSubmit(() => setIsConfirmOpen(true))}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wd-full-date" required>
                    {ABSENCE_MSG.FIELD_END_DATE}
                  </Label>
                  <Input
                    id="wd-full-date"
                    type="date"
                    error={Boolean(errors.effectiveDate)}
                    {...register("effectiveDate")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wd-full-reason" required>
                  {ABSENCE_MSG.FIELD_REASON}
                </Label>
                <Textarea
                  id="wd-full-reason"
                  rows={2}
                  placeholder={ABSENCE_MSG.FIELD_WITHDRAW_REASON_PLACEHOLDER}
                  error={Boolean(errors.reason)}
                  {...register("reason")}
                />
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="danger"
                  className="rounded-full"
                  disabled={enrollments.length === 0}
                >
                  {ABSENCE_MSG.SUBMIT_WITHDRAW_FULL}
                </Button>
              </div>
            </form>
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={ABSENCE_MSG.CONFIRM_WITHDRAW_FULL_TITLE}
        description={ABSENCE_MSG.CONFIRM_WITHDRAW_FULL_DESC}
        variant="danger"
        requireTypedText={selectedStudent?.name}
        isLoading={withdraw.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export { WithdrawFullTab }
