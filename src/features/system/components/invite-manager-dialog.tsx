"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, UserAdd01Icon, UserIcon } from "@hugeicons/core-free-icons"

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
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import {
  inviteManagerSchema,
  type InviteManagerFormInput,
} from "@/lib/validators/system"
import { MockError } from "@/mocks/utils/mock-query"
import { useInviteManager } from "@/features/system/hooks/use-managers"

export interface InviteManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal mời quản lý (PROMPT 14). Chỉ có Email + Họ tên — không có phần chọn quyền
 * vì mọi quản lý có đủ quyền như nhau, không phân quyền chi tiết.
 */
function InviteManagerDialog({ open, onOpenChange }: InviteManagerDialogProps) {
  const inviteManager = useInviteManager()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteManagerFormInput>({
    resolver: zodResolver(inviteManagerSchema),
    defaultValues: { email: "", name: "" },
  })

  const onSubmit = (values: InviteManagerFormInput) => {
    inviteManager.mutate(values, {
      onSuccess: (manager) => {
        toast.success(SYSTEM_MSG.INVITE_SUCCESS(manager.email))
        reset()
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{SYSTEM_MSG.INVITE_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{SYSTEM_MSG.INVITE_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form
          id="invite-manager-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="invite-manager-email" required>
              {SYSTEM_MSG.INVITE_FIELD_EMAIL}
            </Label>
            <Input
              id="invite-manager-email"
              type="email"
              autoComplete="email"
              placeholder="quanly@gmail.com"
              error={Boolean(errors.email)}
              prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-manager-name" required>
              {SYSTEM_MSG.INVITE_FIELD_NAME}
            </Label>
            <Input
              id="invite-manager-name"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              error={Boolean(errors.name)}
              prefixIcon={<HugeiconsIcon icon={UserIcon} />}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="invite-manager-form"
            className="rounded-full"
            isLoading={inviteManager.isPending}
            leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
          >
            {SYSTEM_MSG.INVITE_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { InviteManagerDialog }
