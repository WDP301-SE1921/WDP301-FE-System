"use client"

import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ACTION_LABEL } from "@/constants/messages/common"
import { ERROR_MSG } from "@/constants/messages/error"
import { TEACHER_MSG } from "@/constants/messages/events/teacher"
import {
  changeClassTeacherSchema,
  type ChangeClassTeacherFormInput,
} from "@/lib/validators/teacher"
import { findTeacher } from "@/mocks/data/catalog"
import { MockError } from "@/mocks/utils/mock-query"
import { getClassTeacherCandidates } from "@/features/teachers/selectors"
import { useChangeClassTeacher } from "@/features/teachers/hooks/use-teachers"
import type { ClassDetail } from "@/features/classes/selectors"

export interface ChangeClassTeacherDialogProps {
  detail: ClassDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChangeClassTeacherDialog({
  detail,
  open,
  onOpenChange,
}: ChangeClassTeacherDialogProps) {
  const changeTeacher = useChangeClassTeacher()
  const currentTeacher = findTeacher(detail.classRecord.teacherId)

  const candidates = React.useMemo(
    () => getClassTeacherCandidates(detail.classRecord.id),
    [detail.classRecord.id]
  )

  const candidateItems = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        candidates.map((c) => [
          c.teacher.id,
          `${c.teacher.name} · ${c.teacher.code}`,
        ])
      ),
    [candidates]
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeClassTeacherFormInput>({
    resolver: zodResolver(changeClassTeacherSchema),
    defaultValues: {
      classId: detail.classRecord.id,
      teacherId: "",
      effectiveFrom: "",
      reason: "",
      notifyTeacher: true,
      notifyParents: true,
    },
  })

  const selectedTeacherId = useWatch({ control, name: "teacherId" })
  const selectedCandidate = candidates.find((c) => c.teacher.id === selectedTeacherId)
  const scheduleLabel = `${detail.classRecord.weekdays.join(" - ")} (${detail.classRecord.startTime}–${detail.classRecord.endTime})`

  const onSubmit = (values: ChangeClassTeacherFormInput) => {
    changeTeacher.mutate(values, {
      onSuccess: (result) => {
        toast.success(
          TEACHER_MSG.CHANGE_SUCCESS(
            selectedCandidate?.teacher.name ?? "",
            result.affectedSessions
          )
        )
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
          <DialogTitle>
            {TEACHER_MSG.CHANGE_MODAL_TITLE(detail.classRecord.name)}
          </DialogTitle>
          <DialogDescription>{TEACHER_MSG.CHANGE_MODAL_DESC}</DialogDescription>
        </DialogHeader>

        <form
          id="change-teacher-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>{TEACHER_MSG.CHANGE_CURRENT_LABEL}</Label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                  {(currentTeacher?.name ?? "—")
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {currentTeacher?.name ?? "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentTeacher?.email}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 rounded-full">
                Đang giữ
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-teacher-select" required>
              {TEACHER_MSG.CHANGE_FIELD_TEACHER}
            </Label>
            <Controller
              control={control}
              name="teacherId"
              render={({ field }) => (
                <Select
                  items={candidateItems}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(String(value ?? ""))}
                >
                  <SelectTrigger
                    id="change-teacher-select"
                    className="rounded-xl"
                    error={Boolean(errors.teacherId)}
                  >
                    <SelectValue
                      placeholder={TEACHER_MSG.CHANGE_FIELD_TEACHER_PLACEHOLDER}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(candidateItems).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.teacherId && (
              <p className="text-xs text-destructive">{errors.teacherId.message}</p>
            )}
          </div>

          {selectedCandidate &&
            (selectedCandidate.hasConflict ? (
              <Alert variant="warning">
                <HugeiconsIcon icon={Alert01Icon} />
                <AlertTitle>
                  {TEACHER_MSG.CHANGE_AVAILABILITY_CONFLICT_TITLE}
                </AlertTitle>
                <AlertDescription>
                  {TEACHER_MSG.CHANGE_AVAILABILITY_CONFLICT(
                    selectedCandidate.teacher.name,
                    scheduleLabel
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="success">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                <AlertTitle>{TEACHER_MSG.CHANGE_AVAILABILITY_TITLE}</AlertTitle>
                <AlertDescription>
                  {TEACHER_MSG.CHANGE_AVAILABILITY_OK(
                    selectedCandidate.teacher.name,
                    scheduleLabel
                  )}
                </AlertDescription>
              </Alert>
            ))}

          <div className="space-y-1.5">
            <Label htmlFor="change-effective-date" required>
              {TEACHER_MSG.CHANGE_FIELD_DATE}
            </Label>
            <Input
              id="change-effective-date"
              type="date"
              error={Boolean(errors.effectiveFrom)}
              {...register("effectiveFrom")}
            />
            <p
              className={
                errors.effectiveFrom
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
              }
            >
              {errors.effectiveFrom?.message ??
                TEACHER_MSG.CHANGE_FIELD_DATE_HINT(
                  detail.sessions.filter((s) => s.state === "upcoming").length
                )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-reason" required>
              {TEACHER_MSG.CHANGE_FIELD_REASON}
            </Label>
            <Textarea
              id="change-reason"
              rows={2}
              placeholder={TEACHER_MSG.CHANGE_FIELD_REASON_PLACEHOLDER}
              error={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <NotifyRow
            control={control}
            name="notifyTeacher"
            label={TEACHER_MSG.CHANGE_NOTIFY_TEACHER}
          />
          <NotifyRow
            control={control}
            name="notifyParents"
            label={TEACHER_MSG.CHANGE_NOTIFY_PARENTS}
          />
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
            form="change-teacher-form"
            className="rounded-full"
            isLoading={changeTeacher.isPending}
            leftIcon={<HugeiconsIcon icon={RefreshIcon} />}
          >
            {TEACHER_MSG.CHANGE_SUBMIT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NotifyRow({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<ChangeClassTeacherFormInput>>["control"]
  name: "notifyTeacher" | "notifyParents"
  label: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start gap-2">
          <Checkbox
            id={`change-${name}`}
            className="mt-0.5"
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          <Label htmlFor={`change-${name}`} className="cursor-pointer text-xs font-normal">
            {label}
          </Label>
        </div>
      )}
    />
  )
}

export { ChangeClassTeacherDialog }
