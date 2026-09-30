"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClassOptionCard } from "@/components/shared/pickers/class-option-card"
import { SectionCard } from "@/components/shared/display/section-card"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { SUBJECT_MAP } from "@/constants/subjects"
import { getGradeOptions } from "@/features/catalog/selectors"
import {
  getClassOptionRows,
  getSubjectOptionsForGrade,
} from "@/features/enrollments/selectors"

export interface StepClassProps {
  studentProfileId: string
  /** Khối hồ sơ con đang học — dùng để nhắc khi chọn khối khác. */
  childGrade?: number
  grade: string
  subjectId: string
  classId: string
  onGradeChange: (grade: string) => void
  onSubjectChange: (subjectId: string) => void
  onClassChange: (classId: string) => void
  gradeError?: string
  subjectError?: string
  classError?: string
}

function StepClass({
  studentProfileId,
  childGrade,
  grade,
  subjectId,
  classId,
  onGradeChange,
  onSubjectChange,
  onClassChange,
  gradeError,
  subjectError,
  classError,
}: StepClassProps) {
  const gradeNumber = grade ? Number(grade) : undefined

  const gradeItems = React.useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        getGradeOptions().map((value) => [String(value), STUDENT_MSG.GRADE_LABEL(value)])
      ),
    []
  )

  const subjects = React.useMemo(() => getSubjectOptionsForGrade(gradeNumber), [gradeNumber])

  const options = React.useMemo(
    () => (subjectId ? getClassOptionRows(subjectId, gradeNumber, studentProfileId) : []),
    [subjectId, gradeNumber, studentProfileId]
  )

  const selectedOption = options.find((option) => option.classRecord.id === classId)

  return (
    <div className="space-y-4">
      <SectionCard title={ENROLLMENT_MSG.CLASS_GRADE_TITLE}>
        <div className="space-y-2">
          <Select
            items={gradeItems}
            value={grade || null}
            onValueChange={(value) => onGradeChange(String(value ?? ""))}
          >
            <SelectTrigger className="w-full rounded-xl sm:w-60" error={Boolean(gradeError)}>
              <SelectValue placeholder={ENROLLMENT_MSG.CLASS_GRADE_PLACEHOLDER} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(gradeItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {gradeError && <p className="text-xs text-destructive">{gradeError}</p>}

          {childGrade !== undefined && gradeNumber !== undefined && childGrade !== gradeNumber && (
            <Alert variant="warning">
              <HugeiconsIcon icon={Alert01Icon} />
              <AlertDescription>
                {ENROLLMENT_MSG.CLASS_GRADE_MISMATCH(childGrade, gradeNumber)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SectionCard>

      <SectionCard title={ENROLLMENT_MSG.CLASS_SUBJECT_TITLE}>
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {ENROLLMENT_MSG.CLASS_SUBJECT_EMPTY}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => {
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
          )}
          {subjectError && <p className="text-xs text-destructive">{subjectError}</p>}
        </div>
      </SectionCard>

      <SectionCard
        title={ENROLLMENT_MSG.CLASS_LIST_TITLE}
        description={
          gradeNumber !== undefined ? ENROLLMENT_MSG.CLASS_LIST_DESC(gradeNumber) : undefined
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
                {!option.isFull && option.conflictClass && (
                  <Badge
                    variant="warning"
                    className="absolute top-4 right-4 z-10 rounded-full"
                  >
                    {ENROLLMENT_MSG.CLASS_CONFLICT}
                  </Badge>
                )}
              </div>
            ))}
            {classError && <p className="text-xs text-destructive">{classError}</p>}

            {selectedOption?.conflictClass && (
              <Alert variant="warning">
                <HugeiconsIcon icon={Alert01Icon} />
                <AlertTitle>{ENROLLMENT_MSG.CLASS_CONFLICT_ALERT_TITLE}</AlertTitle>
                <AlertDescription>
                  {ENROLLMENT_MSG.CLASS_CONFLICT_ALERT_DESC(selectedOption.conflictClass.name)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export { StepClass }
