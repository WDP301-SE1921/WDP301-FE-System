"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { StudentPicker } from "@/components/shared/pickers/entity-picker-presets"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
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
  kind: WITHDRAWAL_KIND.SUBJECT,
  enrollmentIds: [],
  effectiveDate: "",
  reason: "",
}

function WithdrawSubjectTab() {
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
  const enrollmentIds = useWatch({ control, name: "enrollmentIds" })
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
      { studentProfileId, kind: WITHDRAWAL_KIND.SUBJECT, enrollmentIds, effectiveDate, reason },
      {
        onSuccess: () => {
          toast.success(ABSENCE_MSG.WITHDRAW_SUBJECT_SUCCESS(selectedStudent?.name ?? ""))
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
            setValue("enrollmentIds", [])
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
            <SectionCard title={ABSENCE_MSG.SUBJECT_FIELD_ENROLLMENTS}>
              <div className="space-y-3">
                {enrollments.map((item) => {
                  const checked = enrollmentIds.includes(item.enrollment.id)
                  return (
                    <label
                      key={item.enrollment.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const isChecked = value === true
                          setValue(
                            "enrollmentIds",
                            isChecked
                              ? [...enrollmentIds, item.enrollment.id]
                              : enrollmentIds.filter((id) => id !== item.enrollment.id),
                            { shouldValidate: true }
                          )
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.classRecord.name}
                        </p>
                        <ScheduleText
                          days={item.classRecord.weekdays}
                          time={`${item.classRecord.startTime}–${item.classRecord.endTime}`}
                          room={item.classRecord.room}
                        />
                      </div>
                    </label>
                  )
                })}
                {errors.enrollmentIds && (
                  <p className="text-xs text-destructive">{errors.enrollmentIds.message}</p>
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard title={ABSENCE_MSG.FIELD_REASON}>
            <form
              className="space-y-4"
              noValidate
              onSubmit={handleSubmit(() => setIsConfirmOpen(true))}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wd-subject-date" required>
                    {ABSENCE_MSG.FIELD_END_DATE}
                  </Label>
                  <Input
                    id="wd-subject-date"
                    type="date"
                    error={Boolean(errors.effectiveDate)}
                    {...register("effectiveDate")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wd-subject-reason" required>
                  {ABSENCE_MSG.FIELD_REASON}
                </Label>
                <Textarea
                  id="wd-subject-reason"
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
                <Button type="submit" className="rounded-full" disabled={enrollments.length === 0}>
                  {ABSENCE_MSG.SUBMIT_WITHDRAW_SUBJECT}
                </Button>
              </div>
            </form>
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={ABSENCE_MSG.CONFIRM_WITHDRAW_SUBJECT_TITLE}
        description={ABSENCE_MSG.CONFIRM_WITHDRAW_SUBJECT_DESC}
        isLoading={withdraw.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export { WithdrawSubjectTab }
