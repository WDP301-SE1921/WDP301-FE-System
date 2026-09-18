"use client"

import * as React from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, Mail01Icon, UserIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionCard } from "@/components/shared/display/section-card"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { MOCK_PARENTS } from "@/mocks/data/parents"
import {
  REGISTRATION_TYPE,
  type EnrollmentInput,
} from "@/lib/validators/enrollment"
import {
  getParentOptions,
  getStudentOptions,
} from "@/features/enrollments/selectors"

const GRADE_OPTIONS = [6, 7, 8, 9]

const GRADE_ITEMS: Record<string, string> = Object.fromEntries(
  GRADE_OPTIONS.map((grade) => [String(grade), STUDENT_MSG.GRADE_LABEL(grade)])
)

export interface StepInfoProps {
  form: UseFormReturn<EnrollmentInput>
  onSwitchToExistingParent: () => void
}

function StepInfo({ form, onSwitchToExistingParent }: StepInfoProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form

  const registrationType = watch("registrationType")
  const parentEmail = watch("parentEmail")

  const parentItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(getParentOptions().map((o) => [o.value, o.label])),
    []
  )
  const studentItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(getStudentOptions().map((o) => [o.value, o.label])),
    []
  )

  /** Cảnh báo A1 → A2: email đã tồn tại thì nên gom về tài khoản cũ. */
  const hasExistingParentEmail = React.useMemo(() => {
    const normalized = parentEmail.trim().toLowerCase()
    if (!normalized) return false
    return MOCK_PARENTS.some((item) => item.email.toLowerCase() === normalized)
  }, [parentEmail])

  if (registrationType === REGISTRATION_TYPE.ADDITIONAL_SUBJECT) {
    return (
      <SectionCard title={ENROLLMENT_MSG.INFO_STUDENT_TITLE}>
        <div className="space-y-2">
          <Label htmlFor="enrollment-student" required>
            {ENROLLMENT_MSG.FIELD_EXISTING_STUDENT}
          </Label>
          <Controller
            control={control}
            name="studentProfileId"
            render={({ field }) => (
              <Select
                items={studentItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(String(value ?? ""))}
              >
                <SelectTrigger
                  id="enrollment-student"
                  className="rounded-xl"
                  error={Boolean(errors.studentProfileId)}
                >
                  <SelectValue
                    placeholder={ENROLLMENT_MSG.FIELD_EXISTING_STUDENT_PLACEHOLDER}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(studentItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.studentProfileId && (
            <p className="text-xs text-destructive">
              {errors.studentProfileId.message}
            </p>
          )}
        </div>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard title={ENROLLMENT_MSG.INFO_STUDENT_TITLE}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="enrollment-student-name" required>
              {ENROLLMENT_MSG.FIELD_STUDENT_NAME}
            </Label>
            <Input
              id="enrollment-student-name"
              placeholder={ENROLLMENT_MSG.FIELD_STUDENT_NAME_PLACEHOLDER}
              error={Boolean(errors.studentName)}
              prefixIcon={<HugeiconsIcon icon={UserIcon} />}
              {...register("studentName")}
            />
            {errors.studentName && (
              <p className="text-xs text-destructive">{errors.studentName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrollment-grade" required>
              {ENROLLMENT_MSG.FIELD_GRADE}
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
                    id="enrollment-grade"
                    className="rounded-xl"
                    error={Boolean(errors.grade)}
                  >
                    <SelectValue placeholder={ENROLLMENT_MSG.FIELD_GRADE_PLACEHOLDER} />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={String(grade)}>
                        {STUDENT_MSG.GRADE_LABEL(grade)}
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
      </SectionCard>

      <SectionCard title={ENROLLMENT_MSG.INFO_PARENT_TITLE}>
        {registrationType === REGISTRATION_TYPE.ADDITIONAL_CHILD ? (
          <div className="space-y-2">
            <Label htmlFor="enrollment-parent" required>
              {ENROLLMENT_MSG.FIELD_EXISTING_PARENT}
            </Label>
            <Controller
              control={control}
              name="parentAccountId"
              render={({ field }) => (
                <Select
                  items={parentItems}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(String(value ?? ""))}
                >
                  <SelectTrigger
                    id="enrollment-parent"
                    className="rounded-xl"
                    error={Boolean(errors.parentAccountId)}
                  >
                    <SelectValue
                      placeholder={ENROLLMENT_MSG.FIELD_EXISTING_PARENT_PLACEHOLDER}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(parentItems).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parentAccountId && (
              <p className="text-xs text-destructive">
                {errors.parentAccountId.message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enrollment-parent-email" required>
                {ENROLLMENT_MSG.FIELD_PARENT_EMAIL}
              </Label>
              <Input
                id="enrollment-parent-email"
                type="email"
                autoComplete="email"
                placeholder="phuhuynh@gmail.com"
                error={Boolean(errors.parentEmail)}
                prefixIcon={<HugeiconsIcon icon={Mail01Icon} />}
                {...register("parentEmail")}
              />
              <p
                className={
                  errors.parentEmail
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {errors.parentEmail?.message ?? ENROLLMENT_MSG.FIELD_PARENT_EMAIL_HINT}
              </p>

              {hasExistingParentEmail && (
                <Alert variant="warning">
                  <HugeiconsIcon icon={Alert01Icon} />
                  <AlertTitle>{ENROLLMENT_MSG.EMAIL_EXISTS_TITLE}</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>{ENROLLMENT_MSG.EMAIL_EXISTS_DESC}</span>
                    <Button
                      variant="outline"
                      size="xs"
                      className="shrink-0 rounded-full"
                      onClick={onSwitchToExistingParent}
                    >
                      {ENROLLMENT_MSG.EMAIL_EXISTS_ACTION}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollment-parent-phone" required>
                {ENROLLMENT_MSG.FIELD_PARENT_PHONE}
              </Label>
              <Input
                id="enrollment-parent-phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912345678"
                error={Boolean(errors.parentPhone)}
                {...register("parentPhone")}
              />
              <p
                className={
                  errors.parentPhone
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {errors.parentPhone?.message ?? ENROLLMENT_MSG.FIELD_PARENT_PHONE_HINT}
              </p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export { StepInfo }
