"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { useCancelSession } from "@/features/work-credits/hooks/use-work-credits"
import { useCurrentUser } from "@/hooks/use-current-role"
import { cancelSessionSchema, type CancelSessionFormInput } from "@/lib/validators/work-credit"
import { MOCK_DEFAULT_ACTOR_ID } from "@/mocks/data/auth"
import { MockError } from "@/mocks/utils/mock-query"

export interface CancelSessionTarget {
  classSessionId: string
  /** Mô tả buổi, vd "Hóa 9B · Buổi 14 (2026-09-18)". */
  sessionLabel: string
  /** Lý do báo nghỉ của giáo viên, dùng làm gợi ý lý do hủy. */
  suggestedReason?: string
}

export interface CancelSessionDialogProps {
  target: CancelSessionTarget | null
  onClose: () => void
}

/** Hủy một buổi học khi không xếp được giáo viên dạy thay (quản lý trung tâm / admin). */
function CancelSessionDialog({ target, onClose }: CancelSessionDialogProps) {
  if (!target) return null

  return <CancelSessionForm key={target.classSessionId} target={target} onClose={onClose} />
}

function CancelSessionForm({
  target,
  onClose,
}: {
  target: CancelSessionTarget
  onClose: () => void
}) {
  const cancelSession = useCancelSession()
  const user = useCurrentUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelSessionFormInput>({
    resolver: zodResolver(cancelSessionSchema),
    defaultValues: {
      classSessionId: target.classSessionId,
      reason: target.suggestedReason ?? "",
    },
  })

  const onSubmit = (values: CancelSessionFormInput) => {
    cancelSession.mutate(
      { ...values, cancelledBy: user?.id ?? MOCK_DEFAULT_ACTOR_ID },
      {
        onSuccess: (result) => {
          toast.success(TEACHER_ABSENCE_MSG.CANCEL_SUCCESS(result.affectedStudents))
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
          <DialogTitle>{TEACHER_ABSENCE_MSG.CANCEL_MODAL_TITLE}</DialogTitle>
          <DialogDescription>
            {TEACHER_ABSENCE_MSG.CANCEL_MODAL_DESC(target.sessionLabel)}
          </DialogDescription>
        </DialogHeader>

        <form id="cancel-session-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-session-reason" required>
              {TEACHER_ABSENCE_MSG.CANCEL_FIELD_REASON}
            </Label>
            <Textarea
              id="cancel-session-reason"
              rows={3}
              placeholder={TEACHER_ABSENCE_MSG.CANCEL_FIELD_REASON_PLACEHOLDER}
              error={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="cancel-session-form"
            variant="danger"
            className="rounded-full"
            isLoading={cancelSession.isPending}
          >
            {TEACHER_ABSENCE_MSG.CANCEL_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CancelSessionDialog }
