"use client"

import * as React from "react"
import { useWatch, type UseFormReturn } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"

import { EntityPicker } from "@/components/shared/pickers/entity-picker"
import { SectionCard } from "@/components/shared/display/section-card"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { findEnrollmentsByStudent, findStudent } from "@/mocks/data/students"
import {
  createChildOptionsFetcher,
  getChildCount,
  toChildOption,
} from "@/features/enrollments/selectors"
import { getSubjectCodes } from "@/features/students/selectors"
import type { EnrollmentInput } from "@/lib/validators/enrollment"

export interface StepChildProps {
  form: UseFormReturn<EnrollmentInput>
}

/**
 * Bước 2: chọn hồ sơ con của phụ huynh đã chọn — dùng `EntityPicker` có sẵn (cần `queryKey`
 * riêng theo phụ huynh để cache kết quả không lẫn giữa các phụ huynh).
 */
function StepChild({ form }: StepChildProps) {
  const {
    control,
    setValue,
    formState: { errors },
  } = form

  const parentAccountId = useWatch({ control, name: "parentAccountId" })
  const studentProfileId = useWatch({ control, name: "studentProfileId" })

  const fetcher = React.useMemo(() => createChildOptionsFetcher(parentAccountId), [parentAccountId])
  const student = studentProfileId ? findStudent(studentProfileId) : undefined
  const childCount = getChildCount(parentAccountId)

  const resetSelection = (childGrade?: number) => {
    // Khối mặc định theo hồ sơ con; đổi con thì môn / lớp đã chọn không còn hợp lệ.
    setValue("grade", childGrade ? String(childGrade) : "")
    setValue("subjectId", "")
    setValue("classId", "")
  }

  return (
    <SectionCard title={ENROLLMENT_MSG.CHILD_TITLE} description={ENROLLMENT_MSG.CHILD_DESC}>
      {childCount === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Alert01Icon} />}
          title={ENROLLMENT_MSG.CHILD_EMPTY_TITLE}
          description={ENROLLMENT_MSG.CHILD_EMPTY_DESC}
        />
      ) : (
        <div className="space-y-3">
          <EntityPicker
            queryKey={`enrollment-children-${parentAccountId}`}
            label={ENROLLMENT_MSG.CHILD_PICKER_LABEL}
            placeholder={ENROLLMENT_MSG.CHILD_PICKER_PLACEHOLDER}
            fetcher={fetcher}
            value={studentProfileId || null}
            selectedEntity={student ? toChildOption(student) : null}
            error={errors.studentProfileId?.message}
            onChange={(id, entity) => {
              setValue("studentProfileId", id, { shouldValidate: true })
              resetSelection(findStudent(entity.id)?.grade)
            }}
            onClear={() => {
              setValue("studentProfileId", "")
              resetSelection()
            }}
          />

          {student && (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge category="student" status={student.status} />
              {getSubjectCodes(findEnrollmentsByStudent(student.id)).map((code) => (
                <SubjectTag key={code} code={code} />
              ))}
              {student.status === "withdrawn" && (
                <span className="text-xs text-muted-foreground">
                  {ENROLLMENT_MSG.CHILD_WITHDRAWN_NOTE}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}

export { StepChild }
