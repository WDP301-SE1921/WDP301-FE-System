"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { ClassOptionCard } from "@/components/shared/pickers/class-option-card"
import { SectionCard } from "@/components/shared/display/section-card"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { SUBJECT_MAP } from "@/constants/subjects"
import { MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { getClassOptionRows } from "@/features/enrollments/selectors"

export interface StepClassProps {
  subjectId: string
  classId: string
  grade?: number
  onSubjectChange: (subjectId: string) => void
  onClassChange: (classId: string) => void
  subjectError?: string
  classError?: string
}

function StepClass({
  subjectId,
  classId,
  grade,
  onSubjectChange,
  onClassChange,
  subjectError,
  classError,
}: StepClassProps) {
  const options = React.useMemo(
    () => (subjectId ? getClassOptionRows(subjectId, grade) : []),
    [subjectId, grade]
  )

  return (
    <div className="space-y-4">
      <SectionCard title={ENROLLMENT_MSG.CLASS_SUBJECT_TITLE}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {MOCK_SUBJECTS.map((subject) => {
              const config = SUBJECT_MAP[subject.code]
              const isSelected = subjectId === subject.id

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onSubjectChange(subject.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {config?.name ?? subject.name}
                </button>
              )
            })}
          </div>
          {subjectError && <p className="text-xs text-destructive">{subjectError}</p>}
        </div>
      </SectionCard>

      <SectionCard
        title={ENROLLMENT_MSG.CLASS_LIST_TITLE}
        description={
          grade !== undefined ? ENROLLMENT_MSG.CLASS_LIST_DESC(grade) : undefined
        }
        action={
          <Badge variant="secondary" className="rounded-full">
            {options.length} lớp
          </Badge>
        }
      >
        {options.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={Alert01Icon} />}
            title={ENROLLMENT_MSG.CLASS_NO_OPTION_TITLE}
            description={ENROLLMENT_MSG.CLASS_NO_OPTION_DESC}
          />
        ) : (
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.classRecord.id} className="relative">
                <ClassOptionCard
                  name={option.classRecord.name}
                  subjectCode={option.subjectCode}
                  schedule={option.classRecord.weekdays.join(" - ")}
                  time={`${option.classRecord.startTime}–${option.classRecord.endTime}`}
                  room={option.classRecord.room}
                  teacherName={option.teacherName}
                  enrolled={option.enrolled}
                  capacity={option.classRecord.capacity}
                  fee={option.monthlyFee}
                  selected={classId === option.classRecord.id}
                  onSelect={
                    option.isFull ? undefined : () => onClassChange(option.classRecord.id)
                  }
                  className={option.isFull ? "pointer-events-none opacity-60" : undefined}
                />
                {option.isFull && (
                  <Badge
                    variant="danger"
                    className="absolute top-4 right-4 z-10 rounded-full"
                  >
                    {ENROLLMENT_MSG.CLASS_FULL}
                  </Badge>
                )}
              </div>
            ))}
            {classError && <p className="text-xs text-destructive">{classError}</p>}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export { StepClass }
