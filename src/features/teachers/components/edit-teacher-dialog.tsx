"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { updateTeacherSchema, type UpdateTeacherFormInput } from "@/lib/validators/teacher"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { useUpdateTeacher } from "@/features/teachers/hooks/use-teachers"
import type { Teacher } from "@/types/catalog"

export interface EditTeacherDialogProps {
  teacher: Teacher
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Sửa hồ sơ giáo viên (quản lý trung tâm / admin). Nơi gọi truyền `key={teacher.id}` để form dựng lại đúng dữ liệu. */
function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const updateTeacher = useUpdateTeacher()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTeacherFormInput>({
    resolver: zodResolver(updateTeacherSchema),
    defaultValues: {
      name: teacher.name,
      phone: teacher.phone,
      specialty: teacher.specialty ?? "",
      subjectIds: teacher.subjectIds,
    },
  })

  const onSubmit = (values: UpdateTeacherFormInput) => {
    updateTeacher.mutate(
      { id: teacher.id, ...values },
      {
        onSuccess: () => {
          toast.success(TEACHER_MSG.EDIT_SUCCESS)
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
          <DialogTitle>{TEACHER_MSG.EDIT_MODAL_TITLE}</DialogTitle>
          <DialogDescription>{TEACHER_MSG.EDIT_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form id="edit-teacher-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-teacher-name" required>
              {TEACHER_MSG.INVITE_FIELD_NAME}
            </Label>
            <Input id="edit-teacher-name" error={Boolean(errors.name)} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-teacher-phone" required>
              {TEACHER_MSG.INVITE_FIELD_PHONE}
            </Label>
            <Input
              id="edit-teacher-phone"
              type="tel"
              error={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-teacher-specialty">{TEACHER_MSG.EDIT_FIELD_SPECIALTY}</Label>
            <Input
              id="edit-teacher-specialty"
              placeholder={TEACHER_MSG.EDIT_FIELD_SPECIALTY_PLACEHOLDER}
              error={Boolean(errors.specialty)}
              {...register("specialty")}
            />
            {errors.specialty && (
              <p className="text-xs text-destructive">{errors.specialty.message}</p>
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
            {errors.subjectIds && (
              <p className="text-xs text-destructive">{errors.subjectIds.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="edit-teacher-form"
            className="rounded-full"
            isLoading={updateTeacher.isPending}
          >
            {ACTION_LABEL.SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { EditTeacherDialog }
