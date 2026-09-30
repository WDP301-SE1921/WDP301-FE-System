"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { ACCOUNT_MANAGE_TARGETS } from "@/constants/role-access"
import { ROLE_LABEL, isBackOfficeRole, type WebRole } from "@/constants/roles"
import {
  inviteStaffSchema,
  type InviteStaffFormInput,
} from "@/lib/validators/system"
import { MockError } from "@/mocks/utils/mock-query"
import { useInviteStaff } from "@/features/system/hooks/use-staff-accounts"

export interface InviteStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Role người đang mời — quyết định các vai trò được chọn (`ACCOUNT_MANAGE_TARGETS`). */
  inviterRole: WebRole | null
}

/**
 * Modal mời nhân sự (PROMPT 14). Vai trò chọn được bị giới hạn theo người mời: admin mời
 * quản lý trung tâm / thiết kế giáo trình / nhân viên; quản lý trung tâm chỉ mời nhân viên.
 */
function InviteStaffDialog({ open, onOpenChange, inviterRole }: InviteStaffDialogProps) {
  const inviteStaff = useInviteStaff()
  const allowedRoles = React.useMemo(
    () => (inviterRole ? (ACCOUNT_MANAGE_TARGETS[inviterRole] ?? []) : []),
    [inviterRole]
  )
  const roleItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(allowedRoles.map((role) => [role, ROLE_LABEL[role]])),
    [allowedRoles]
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteStaffFormInput>({
    resolver: zodResolver(inviteStaffSchema),
    // Chỉ có một vai trò được phép (vd quản lý trung tâm → nhân viên) thì chọn sẵn.
    defaultValues: { email: "", name: "", role: allowedRoles.length === 1 ? allowedRoles[0] : undefined },
  })

  const onSubmit = (values: InviteStaffFormInput) => {
    if (!inviterRole || !isBackOfficeRole(inviterRole)) return

    inviteStaff.mutate(
      { ...values, inviterRole },
      {
        onSuccess: (account) => {
          toast.success(SYSTEM_MSG.INVITE_SUCCESS(account.email))
          reset()
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{SYSTEM_MSG.INVITE_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{SYSTEM_MSG.INVITE_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form
          id="invite-staff-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="invite-staff-email" required>
              {SYSTEM_MSG.INVITE_FIELD_EMAIL}
            </Label>
            <Input
              id="invite-staff-email"
              type="email"
              autoComplete="email"
              placeholder="nhanvien@gmail.com"
              error={Boolean(errors.email)}
              prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-staff-name" required>
              {SYSTEM_MSG.INVITE_FIELD_NAME}
            </Label>
            <Input
              id="invite-staff-name"
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

          <div className="space-y-2">
            <Label htmlFor="invite-staff-role" required>
              {SYSTEM_MSG.INVITE_FIELD_ROLE}
            </Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  items={roleItems}
                  value={field.value ?? null}
                  onValueChange={(value) =>
                    field.onChange(value ? (String(value) as InviteStaffFormInput["role"]) : undefined)
                  }
                >
                  <SelectTrigger
                    id="invite-staff-role"
                    className="rounded-xl"
                    error={Boolean(errors.role)}
                  >
                    <SelectValue placeholder={SYSTEM_MSG.INVITE_FIELD_ROLE_PLACEHOLDER} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleItems).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
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
            form="invite-staff-form"
            className="rounded-full"
            isLoading={inviteStaff.isPending}
            leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
          >
            {SYSTEM_MSG.INVITE_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { InviteStaffDialog }
