"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { SUBJECT_MAP } from "@/constants/subjects"
import { useCreateProgram, useUpdateProgram } from "@/features/catalog/hooks/use-catalog"
import { programFormSchema, type ProgramFormInput } from "@/lib/validators/catalog"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import type { Program } from "@/types/catalog"

const GRADE_OPTIONS = [6, 7, 8, 9]

const SUBJECT_ITEMS: Record<string, string> = Object.fromEntries(
  MOCK_SUBJECTS.map((subject) => [subject.id, SUBJECT_MAP[subject.code]?.name ?? subject.name])
)

const GRADE_ITEMS: Record<string, string> = Object.fromEntries(
  GRADE_OPTIONS.map((grade) => [String(grade), STUDENT_MSG.GRADE_LABEL(grade)])
)

function toDefaultValues(program?: Program): ProgramFormInput {
  return {
    name: program?.name ?? "",
    subjectId: program?.subjectId ?? "",
    grade: program ? String(program.grade) : "",
    monthlyFee: program?.monthlyFee ?? 0,
    description: program?.description ?? "",
    isActive: program?.isActive ?? true,
  }
}

export interface ProgramFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  /** Bắt buộc khi `mode === "edit"`. */
  program?: Program
}

/**
 * `defaultValues` chỉ đọc 1 lần lúc mount — nơi gọi component này phải truyền
 * `key={program?.id ?? "create"}` để form reset đúng khi đổi chương trình đang sửa.
 */

function ProgramFormDialog({ open, onOpenChange, mode, program }: ProgramFormDialogProps) {
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const isEdit = mode === "edit"
  const isPending = createProgram.isPending || updateProgram.isPending

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramFormInput>({
    resolver: zodResolver(programFormSchema),
    defaultValues: toDefaultValues(program),
  })

  const onSubmit = (values: ProgramFormInput) => {
    const onError = (error: unknown) => {
      toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
    }

    if (isEdit && program) {
      updateProgram.mutate(
        { programId: program.id, input: values },
        {
          onSuccess: () => {
            toast.success(CATALOG_MSG.PROGRAM_UPDATE_SUCCESS)
            onOpenChange(false)
          },
          onError,
        }
      )
      return
    }

    createProgram.mutate(values, {
      onSuccess: () => {
        toast.success(CATALOG_MSG.PROGRAM_CREATE_SUCCESS)
        reset(toDefaultValues())
        onOpenChange(false)
      },
      onError,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(toDefaultValues(program))
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? CATALOG_MSG.PROGRAM_MODAL_EDIT_TITLE : CATALOG_MSG.PROGRAM_MODAL_CREATE_TITLE}
          </DialogTitle>
        </DialogHeader>

        <form
          id="program-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="program-name" required>
              {CATALOG_MSG.PROGRAM_FIELD_NAME}
            </Label>
            <Input
              id="program-name"
              placeholder={CATALOG_MSG.PROGRAM_FIELD_NAME_PLACEHOLDER}
              error={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="program-subject" required>
                {CATALOG_MSG.PROGRAM_FIELD_SUBJECT}
              </Label>
              <Controller
                control={control}
                name="subjectId"
                render={({ field }) => (
                  <Select
                    items={SUBJECT_ITEMS}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(String(value ?? ""))}
                  >
                    <SelectTrigger
                      id="program-subject"
                      className="rounded-xl"
                      error={Boolean(errors.subjectId)}
                    >
                      <SelectValue placeholder={CATALOG_MSG.PROGRAM_FIELD_SUBJECT_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUBJECT_ITEMS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subjectId && (
                <p className="text-xs text-destructive">{errors.subjectId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="program-grade" required>
                {CATALOG_MSG.PROGRAM_FIELD_GRADE}
              </Label>
              <Controller
                control={control}
                name="grade"
                render={({ field }) => (
                  <Select
                    items={GRADE_ITEMS}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(String(value ?? ""))}
                  >
                    <SelectTrigger
                      id="program-grade"
                      className="rounded-xl"
                      error={Boolean(errors.grade)}
                    >
                      <SelectValue placeholder={CATALOG_MSG.PROGRAM_FIELD_GRADE_PLACEHOLDER} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GRADE_ITEMS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.grade && (
                <p className="text-xs text-destructive">{errors.grade.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="program-fee" required>
              {CATALOG_MSG.PROGRAM_FIELD_FEE}
            </Label>
            <Controller
              control={control}
              name="monthlyFee"
              render={({ field }) => (
                <Input
                  id="program-fee"
                  inputMode="numeric"
                  placeholder="0"
                  error={Boolean(errors.monthlyFee)}
                  suffixIcon={<span className="text-sm font-medium text-foreground">₫</span>}
                  value={field.value ? new Intl.NumberFormat("vi-VN").format(field.value) : ""}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, "")
                    field.onChange(digitsOnly ? Number(digitsOnly) : 0)
                  }}
                />
              )}
            />
            {errors.monthlyFee && (
              <p className="text-xs text-destructive">{errors.monthlyFee.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="program-description">{CATALOG_MSG.PROGRAM_FIELD_DESCRIPTION}</Label>
            <Textarea
              id="program-description"
              rows={3}
              placeholder={CATALOG_MSG.PROGRAM_FIELD_DESCRIPTION_PLACEHOLDER}
              error={Boolean(errors.description)}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="program-active" className="cursor-pointer">
                  {CATALOG_MSG.PROGRAM_FIELD_ACTIVE}
                </Label>
                <Switch
                  id="program-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {ACTION_LABEL.CANCEL}
          </Button>
          <Button
            type="submit"
            form="program-form"
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

export { ProgramFormDialog }
