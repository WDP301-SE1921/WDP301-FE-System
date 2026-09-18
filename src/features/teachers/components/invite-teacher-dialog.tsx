"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, UserAdd01Icon, UserIcon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
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
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import { SUBJECT_MAP } from "@/constants/subjects"
import {
  inviteTeacherSchema,
  type InviteTeacherFormInput,
} from "@/lib/validators/teacher"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { useInviteTeacher } from "@/features/teachers/hooks/use-teachers"

export interface InviteTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function InviteTeacherDialog({ open, onOpenChange }: InviteTeacherDialogProps) {
  const inviteTeacher = useInviteTeacher()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteTeacherFormInput>({
    resolver: zodResolver(inviteTeacherSchema),
    defaultValues: { email: "", name: "", phone: "", subjectIds: [] },
  })

  const onSubmit = (values: InviteTeacherFormInput) => {
    inviteTeacher.mutate(values, {
      onSuccess: (invitation) => {
        toast.success(TEACHER_MSG.INVITE_SUCCESS(invitation.email))
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
          <DialogTitle>{TEACHER_MSG.INVITE_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{TEACHER_MSG.INVITE_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form
          id="invite-teacher-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="invite-email" required>
              {TEACHER_MSG.INVITE_FIELD_EMAIL}
            </Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="giaovien@gmail.com"
              error={Boolean(errors.email)}
              prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name" required>
              {TEACHER_MSG.INVITE_FIELD_NAME}
            </Label>
            <Input
              id="invite-name"
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
            <Label htmlFor="invite-phone" required>
              {TEACHER_MSG.INVITE_FIELD_PHONE}
            </Label>
            <Input
              id="invite-phone"
              type="tel"
              autoComplete="tel"
              placeholder="0912345678"
              error={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label required>{TEACHER_MSG.INVITE_FIELD_SUBJECTS}</Label>
            <Controller
              control={control}
              name="subjectIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {MOCK_SUBJECTS.map((subject) => {
                    const isSelected = field.value.includes(subject.id)

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            isSelected
                              ? field.value.filter((id) => id !== subject.id)
                              : [...field.value, subject.id]
                          )
                        }
                        aria-pressed={isSelected}
                      >
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer rounded-full px-3.5 py-1.5"
                        >
                          {SUBJECT_MAP[subject.code]?.name ?? subject.name}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              )}
            />
            <p
              className={
                errors.subjectIds
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {errors.subjectIds?.message ?? TEACHER_MSG.INVITE_FIELD_SUBJECTS_HINT}
            </p>
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
            form="invite-teacher-form"
            className="rounded-full"
            isLoading={inviteTeacher.isPending}
            leftIcon={<HugeiconsIcon icon={UserAdd01Icon} />}
          >
            {TEACHER_MSG.INVITE_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { InviteTeacherDialog }
