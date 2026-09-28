"use client"

import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { StudentPicker } from "@/components/shared/pickers/entity-picker-presets"
import type { EntityOption } from "@/components/shared/pickers/entity-picker"
import { DateText } from "@/components/shared/display/date-text"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ERROR_MSG } from "@/constants/messages/error"
import { useCreateLongLeave } from "@/features/absences/hooks/use-absences"
import {
  fetchActiveStudentOptions,
  getActiveEnrollmentOptions,
  getLongLeaveAffectedSessions,
} from "@/features/absences/selectors"
import {
  LONG_LEAVE_SCOPE,
  createLongLeaveSchema,
  type CreateLongLeaveFormInput,
} from "@/lib/validators/absence"
import { MockError } from "@/mocks/utils/mock-query"

export interface CreateLongLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_DEFAULTS: CreateLongLeaveFormInput = {
  studentProfileId: "",
  scope: LONG_LEAVE_SCOPE.ALL,
  subjectIds: [],
  startDate: "",
  endDate: "",
  reason: "",
}

function CreateLongLeaveDialog({ open, onOpenChange }: CreateLongLeaveDialogProps) {
  const [selectedStudent, setSelectedStudent] = React.useState<EntityOption | null>(null)
  const createLongLeave = useCreateLongLeave()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateLongLeaveFormInput>({
    resolver: zodResolver(createLongLeaveSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const studentProfileId = useWatch({ control, name: "studentProfileId" })
  const scope = useWatch({ control, name: "scope" })
  const subjectIds = useWatch({ control, name: "subjectIds" })
  const startDate = useWatch({ control, name: "startDate" })
  const endDate = useWatch({ control, name: "endDate" })

  const enrollmentOptions = React.useMemo(
    () => (studentProfileId ? getActiveEnrollmentOptions(studentProfileId) : []),
    [studentProfileId]
  )

  const preview = React.useMemo(
    () =>
      studentProfileId
        ? getLongLeaveAffectedSessions(
            studentProfileId,
            scope === LONG_LEAVE_SCOPE.ALL ? [] : subjectIds,
            startDate,
            endDate
          )
        : [],
    [studentProfileId, scope, subjectIds, startDate, endDate]
  )

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(EMPTY_DEFAULTS)
      setSelectedStudent(null)
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = (values: CreateLongLeaveFormInput) => {
    createLongLeave.mutate(
      {
        studentProfileId: values.studentProfileId,
        subjectIds: values.scope === LONG_LEAVE_SCOPE.ALL ? [] : values.subjectIds,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          toast.success(ABSENCE_MSG.LL_CREATE_SUCCESS(selectedStudent?.name ?? ""))
          handleClose(false)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{ABSENCE_MSG.LL_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{ABSENCE_MSG.LL_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form
          id="create-long-leave-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <StudentPicker
            fetcher={fetchActiveStudentOptions}
            value={studentProfileId || null}
            selectedEntity={selectedStudent}
            onChange={(id, entity) => {
              setValue("studentProfileId", id, { shouldValidate: true })
              setValue("subjectIds", [])
              setSelectedStudent(entity)
            }}
            onClear={() => {
              setValue("studentProfileId", "")
              setValue("subjectIds", [])
              setSelectedStudent(null)
            }}
            error={errors.studentProfileId?.message}
          />

          {studentProfileId && (
            <div className="space-y-2">
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(String(value ?? LONG_LEAVE_SCOPE.ALL))
                      setValue("subjectIds", [])
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="ll-scope-all" value={LONG_LEAVE_SCOPE.ALL} />
                      <Label htmlFor="ll-scope-all" className="cursor-pointer font-normal">
                        {ABSENCE_MSG.LL_SCOPE_ALL}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="ll-scope-selected" value={LONG_LEAVE_SCOPE.SELECTED} />
                      <Label htmlFor="ll-scope-selected" className="cursor-pointer font-normal">
                        {ABSENCE_MSG.LL_SCOPE_SELECTED}
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />

              {scope === LONG_LEAVE_SCOPE.SELECTED && (
                <div className="flex flex-wrap gap-3 rounded-xl border border-border p-3">
                  {enrollmentOptions.map((item) => {
                    const checked = subjectIds.includes(item.enrollment.subjectId)
                    return (
                      <div key={item.enrollment.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`ll-subject-${item.enrollment.id}`}
                          checked={checked}
                          onCheckedChange={(value) => {
                            const isChecked = value === true
                            setValue(
                              "subjectIds",
                              isChecked
                                ? [...subjectIds, item.enrollment.subjectId]
                                : subjectIds.filter((id) => id !== item.enrollment.subjectId),
                              { shouldValidate: true }
                            )
                          }}
                        />
                        <Label
                          htmlFor={`ll-subject-${item.enrollment.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {item.label}
                        </Label>
                      </div>
                    )
                  })}
                  {errors.subjectIds && (
                    <p className="w-full text-xs text-destructive">{errors.subjectIds.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ll-start-date" required>
                {ABSENCE_MSG.LL_FIELD_FROM}
              </Label>
              <Input
                id="ll-start-date"
                type="date"
                error={Boolean(errors.startDate)}
                {...register("startDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ll-end-date" required>
                {ABSENCE_MSG.LL_FIELD_TO}
              </Label>
              <Input
                id="ll-end-date"
                type="date"
                error={Boolean(errors.endDate)}
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ll-reason" required>
              {ABSENCE_MSG.FIELD_REASON}
            </Label>
            <Textarea
              id="ll-reason"
              rows={2}
              placeholder={ABSENCE_MSG.FIELD_WITHDRAW_REASON_PLACEHOLDER}
              error={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-sm font-medium text-foreground">
              {ABSENCE_MSG.LL_PREVIEW_TITLE(preview.length)}
            </p>
            {preview.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{ABSENCE_MSG.LL_PREVIEW_EMPTY}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {preview.slice(0, 8).map((item, index) => (
                  <li key={`${item.classId}-${item.date}-${index}`}>
                    <DateText value={item.date} className="text-xs" /> · {item.subjectCode} ·{" "}
                    {item.lessonTitle}
                  </li>
                ))}
                {preview.length > 8 && <li>… và {preview.length - 8} buổi khác</li>}
              </ul>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => handleClose(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="create-long-leave-form"
            className="rounded-full"
            isLoading={createLongLeave.isPending}
          >
            {ABSENCE_MSG.LL_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CreateLongLeaveDialog }
