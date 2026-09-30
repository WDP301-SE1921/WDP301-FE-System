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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import {
  useSetParentStatus,
  useUpdateParentContact,
} from "@/features/parents/hooks/use-parents"
import { parentContactSchema, type ParentContactFormInput } from "@/lib/validators/parent"
import { MockError } from "@/mocks/utils/mock-query"
import type { ParentAccount } from "@/types/student"

export interface ParentAccountDialogTarget {
  parent: ParentAccount
  action: "edit" | "toggle-lock"
}

export interface ParentAccountDialogsProps {
  target: ParentAccountDialogTarget | null
  onClose: () => void
}

/**
 * Sửa liên hệ và khóa / mở khóa tài khoản phụ huynh — chỉ admin / quản lý trung tâm (nơi gọi
 * ẩn nút với role khác). Web không tạo phụ huynh và không đổi email / mật khẩu.
 */
function ParentAccountDialogs({ target, onClose }: ParentAccountDialogsProps) {
  if (!target) return null

  return target.action === "edit" ? (
    <ParentContactDialog key={target.parent.id} parent={target.parent} onClose={onClose} />
  ) : (
    <ParentLockDialog key={target.parent.id} parent={target.parent} onClose={onClose} />
  )
}

function ParentContactDialog({
  parent,
  onClose,
}: {
  parent: ParentAccount
  onClose: () => void
}) {
  const updateContact = useUpdateParentContact()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentContactFormInput>({
    resolver: zodResolver(parentContactSchema),
    defaultValues: { phone: parent.phone },
  })

  const onSubmit = (values: ParentContactFormInput) => {
    updateContact.mutate(
      { id: parent.id, phone: values.phone },
      {
        onSuccess: () => {
          toast.success(PARENT_MSG.CONTACT_UPDATE_SUCCESS)
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
          <DialogTitle>{PARENT_MSG.CONTACT_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{PARENT_MSG.CONTACT_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form id="parent-contact-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="parent-contact-email">{PARENT_MSG.INFO_EMAIL}</Label>
            <Input id="parent-contact-email" value={parent.email} disabled readOnly />
            <p className="text-xs text-muted-foreground">{PARENT_MSG.CONTACT_EMAIL_HINT}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parent-contact-phone" required>
              {PARENT_MSG.INFO_PHONE}
            </Label>
            <Input
              id="parent-contact-phone"
              type="tel"
              error={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="parent-contact-form"
            className="rounded-full"
            isLoading={updateContact.isPending}
          >
            {ACTION_LABEL.SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ParentLockDialog({
  parent,
  onClose,
}: {
  parent: ParentAccount
  onClose: () => void
}) {
  const setStatus = useSetParentStatus()
  const willLock = parent.status === "activated"

  const handleConfirm = () => {
    setStatus.mutate(
      { id: parent.id, status: willLock ? "disabled" : "activated" },
      {
        onSuccess: () => {
          toast.success(
            willLock ? PARENT_MSG.LOCK_SUCCESS(parent.email) : PARENT_MSG.UNLOCK_SUCCESS(parent.email)
          )
          onClose()
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      onConfirm={handleConfirm}
      variant={willLock ? "danger" : "default"}
      title={willLock ? PARENT_MSG.LOCK_CONFIRM_TITLE : PARENT_MSG.UNLOCK_CONFIRM_TITLE}
      description={
        willLock ? PARENT_MSG.LOCK_CONFIRM_DESC(parent.email) : PARENT_MSG.UNLOCK_CONFIRM_DESC(parent.email)
      }
      confirmText={willLock ? PARENT_MSG.ACTION_LOCK_ACCOUNT : PARENT_MSG.ACTION_UNLOCK_ACCOUNT}
      isLoading={setStatus.isPending}
    />
  )
}

export { ParentAccountDialogs }
