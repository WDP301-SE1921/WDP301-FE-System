"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { TEACHER_ABSENCE_MSG } from "@/constants/messages/events/teacher-absence"
import { useReportTeacherAbsence } from "@/features/work-credits/hooks/use-work-credits"
import { reportAbsenceSchema, type ReportAbsenceFormInput } from "@/lib/validators/work-credit"
import { MockError } from "@/mocks/utils/mock-query"

export interface ReportAbsenceDialogProps {
  /** Buổi cần báo nghỉ; `null` thì đóng. */
  session: { id: string; title: string; date: string; time: string } | null
  teacherId: string
  onClose: () => void
}

/** Giáo viên báo nghỉ một buổi của mình — chỉ là thông báo cho quản lý, không phải xin đổi lịch. */
function ReportAbsenceDialog({ session, teacherId, onClose }: ReportAbsenceDialogProps) {
  if (!session) return null

  return <ReportAbsenceForm key={session.id} session={session} teacherId={teacherId} onClose={onClose} />
}

function ReportAbsenceForm({
  session,
  teacherId,
  onClose,
}: {
  session: NonNullable<ReportAbsenceDialogProps["session"]>
  teacherId: string
  onClose: () => void
}) {
  const reportAbsence = useReportTeacherAbsence()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportAbsenceFormInput>({
    resolver: zodResolver(reportAbsenceSchema),
    defaultValues: { classSessionId: session.id, reason: "" },
  })

  const onSubmit = (values: ReportAbsenceFormInput) => {
    reportAbsence.mutate(
      { classSessionId: values.classSessionId, reason: values.reason, teacherId },
      {
        onSuccess: () => {
          toast.success(TEACHER_ABSENCE_MSG.REPORT_SUCCESS)
          onClose()
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{TEACHER_ABSENCE_MSG.REPORT_MODAL_TITLE}</DialogTitle>
          <DialogDescription>
            {session.title} · {session.date} ({session.time})
          </DialogDescription>
        </DialogHeader>

        <form id="report-absence-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Alert variant="info">
            <AlertDescription>{TEACHER_ABSENCE_MSG.REPORT_MODAL_DESC}</AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <Label htmlFor="report-absence-reason" required>
              {TEACHER_ABSENCE_MSG.REPORT_FIELD_REASON}
            </Label>
            <Textarea
              id="report-absence-reason"
              rows={3}
              placeholder={TEACHER_ABSENCE_MSG.REPORT_FIELD_REASON_PLACEHOLDER}
              error={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason ? (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {TEACHER_ABSENCE_MSG.REPORT_URGENT_HINT}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="report-absence-form"
            className="rounded-full"
            isLoading={reportAbsence.isPending}
          >
            {TEACHER_ABSENCE_MSG.REPORT_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ReportAbsenceDialog }
