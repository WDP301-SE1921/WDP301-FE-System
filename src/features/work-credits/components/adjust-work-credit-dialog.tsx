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
import { WORK_CREDIT_MSG } from "@/constants/messages/events/work-credit"
import { useAdjustWorkCredit } from "@/features/work-credits/hooks/use-work-credits"
import { useCurrentUser } from "@/hooks/use-current-role"
import { adjustWorkCreditSchema, type AdjustWorkCreditFormInput } from "@/lib/validators/work-credit"
import { MOCK_DEFAULT_ACTOR_ID } from "@/mocks/data/auth"
import { MockError } from "@/mocks/utils/mock-query"

export interface AdjustWorkCreditTarget {
  classSessionId: string
  teacherId: string
  teacherName: string
  /** Mô tả buổi, vd "Sinh 6A · Buổi 12 (2026-09-14)". */
  sessionLabel: string
}

export interface AdjustWorkCreditDialogProps {
  target: AdjustWorkCreditTarget | null
  onClose: () => void
}

/** Ghi nhận công thủ công cho buổi đã dạy nhưng chưa điểm danh (quản lý trung tâm / admin). */
function AdjustWorkCreditDialog({ target, onClose }: AdjustWorkCreditDialogProps) {
  if (!target) return null

  return <AdjustWorkCreditForm key={target.classSessionId} target={target} onClose={onClose} />
}

function AdjustWorkCreditForm({
  target,
  onClose,
}: {
  target: AdjustWorkCreditTarget
  onClose: () => void
}) {
  const adjust = useAdjustWorkCredit()
  const user = useCurrentUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdjustWorkCreditFormInput>({
    resolver: zodResolver(adjustWorkCreditSchema),
    defaultValues: {
      classSessionId: target.classSessionId,
      teacherId: target.teacherId,
      reason: "",
    },
  })

  const onSubmit = (values: AdjustWorkCreditFormInput) => {
    adjust.mutate(
      { ...values, adjustedBy: user?.id ?? MOCK_DEFAULT_ACTOR_ID },
      {
        onSuccess: () => {
          toast.success(WORK_CREDIT_MSG.ADJUST_SUCCESS(target.teacherName))
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
          <DialogTitle>{WORK_CREDIT_MSG.ADJUST_MODAL_TITLE}</DialogTitle>
          <DialogDescription>
            {target.teacherName} · {target.sessionLabel}
          </DialogDescription>
        </DialogHeader>

        <form id="adjust-work-credit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-xs text-muted-foreground">{WORK_CREDIT_MSG.ADJUST_MODAL_DESC}</p>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-work-credit-reason" required>
              {WORK_CREDIT_MSG.ADJUST_FIELD_REASON}
            </Label>
            <Textarea
              id="adjust-work-credit-reason"
              rows={3}
              placeholder={WORK_CREDIT_MSG.ADJUST_FIELD_REASON_PLACEHOLDER}
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
            form="adjust-work-credit-form"
            className="rounded-full"
            isLoading={adjust.isPending}
          >
            {WORK_CREDIT_MSG.ADJUST_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AdjustWorkCreditDialog }
