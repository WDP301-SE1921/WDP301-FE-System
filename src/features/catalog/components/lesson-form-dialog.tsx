"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { useAddLesson, useUpdateLesson } from "@/features/catalog/hooks/use-catalog"
import { lessonFormSchema, type LessonFormInput } from "@/lib/validators/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import type { Lesson } from "@/types/catalog"

function toDefaultValues(lesson?: Lesson): LessonFormInput {
  return {
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
  }
}

export interface LessonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  programId: string
  /** Bắt buộc khi `mode === "edit"`. */
  lesson?: Lesson
}

/**
 * `defaultValues` chỉ đọc 1 lần lúc mount — nơi gọi phải truyền
 * `key={lesson?.id ?? "create"}` để form reset đúng khi đổi bài học đang sửa.
 */
function LessonFormDialog({
  open,
  onOpenChange,
  mode,
  programId,
  lesson,
}: LessonFormDialogProps) {
  const addLesson = useAddLesson()
  const updateLesson = useUpdateLesson()
  const isEdit = mode === "edit"
  const isPending = addLesson.isPending || updateLesson.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LessonFormInput>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: toDefaultValues(lesson),
  })

  const onSubmit = (values: LessonFormInput) => {
    const onError = (error: unknown) => {
      toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
    }

    if (isEdit && lesson) {
      updateLesson.mutate(
        { lessonId: lesson.id, programId, ...values },
        {
          onSuccess: () => {
            toast.success(CATALOG_MSG.LESSON_UPDATE_SUCCESS)
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    addLesson.mutate(
      { programId, ...values },
      {
        onSuccess: () => {
          toast.success(CATALOG_MSG.LESSON_CREATE_SUCCESS)
          reset(toDefaultValues())
          onOpenChange(false)
        },
        onError,
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(toDefaultValues(lesson))
        onOpenChange(next)
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? CATALOG_MSG.LESSON_MODAL_EDIT_TITLE : CATALOG_MSG.LESSON_MODAL_CREATE_TITLE}
          </DialogTitle>
        </DialogHeader>

        <form id="lesson-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title" required>
              {CATALOG_MSG.LESSON_FIELD_TITLE}
            </Label>
            <Input
              id="lesson-title"
              placeholder={CATALOG_MSG.LESSON_FIELD_TITLE_PLACEHOLDER}
              error={Boolean(errors.title)}
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-description">{CATALOG_MSG.LESSON_FIELD_DESCRIPTION}</Label>
            <Textarea
              id="lesson-description"
              rows={3}
              placeholder={CATALOG_MSG.LESSON_FIELD_DESCRIPTION_PLACEHOLDER}
              error={Boolean(errors.description)}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="lesson-form"
            className="rounded-full"
            isLoading={isPending}
            leftIcon={<HugeiconsIcon icon={isEdit ? FloppyDiskIcon : Add01Icon} />}
          >
            {ACTION_LABEL.SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { LessonFormDialog }
