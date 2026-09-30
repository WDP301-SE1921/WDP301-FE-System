"use client"

import * as React from "react"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ParentPicker } from "@/components/shared/pickers/entity-picker-presets"
import { SectionCard } from "@/components/shared/display/section-card"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { findParent } from "@/mocks/data/parents"
import {
  fetchRegistrableParentOptions,
  toParentOption,
} from "@/features/enrollments/selectors"
import type { EnrollmentInput } from "@/lib/validators/enrollment"

export interface StepLookupProps {
  form: UseFormReturn<EnrollmentInput>
}

/** Bước 1: chọn phụ huynh bằng `ParentPicker` có sẵn — tìm theo Gmail hoặc số điện thoại. */
function StepLookup({ form }: StepLookupProps) {
  const {
    control,
    setValue,
    formState: { errors },
  } = form

  const parentAccountId = useWatch({ control, name: "parentAccountId" })
  const parent = parentAccountId ? findParent(parentAccountId) : undefined

  return (
    <div className="space-y-4">
      <SectionCard title={ENROLLMENT_MSG.LOOKUP_TITLE} description={ENROLLMENT_MSG.LOOKUP_DESC}>
        <ParentPicker
          label={ENROLLMENT_MSG.LOOKUP_PICKER_LABEL}
          placeholder={ENROLLMENT_MSG.LOOKUP_PICKER_PLACEHOLDER}
          fetcher={fetchRegistrableParentOptions}
          value={parentAccountId || null}
          selectedEntity={parent ? toParentOption(parent) : null}
          error={errors.parentAccountId?.message}
          onChange={(id) => {
            setValue("parentAccountId", id, { shouldValidate: true })
            // Đổi phụ huynh thì hồ sơ con / khối / môn / lớp đã chọn không còn hợp lệ.
            setValue("studentProfileId", "")
            setValue("grade", "")
            setValue("subjectId", "")
            setValue("classId", "")
          }}
          onClear={() => {
            setValue("parentAccountId", "")
            setValue("studentProfileId", "")
            setValue("grade", "")
            setValue("subjectId", "")
            setValue("classId", "")
          }}
        />
      </SectionCard>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{ENROLLMENT_MSG.LOOKUP_ALERT_TITLE}</AlertTitle>
        <AlertDescription>{ENROLLMENT_MSG.LOOKUP_ALERT_DESC}</AlertDescription>
      </Alert>
    </div>
  )
}

export { StepLookup }
