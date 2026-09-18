"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { HelpCircleIcon, Invoice01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MoneyText } from "@/components/shared/display/money-text"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { REGISTRATION_TYPE, type RegistrationType } from "@/lib/validators/enrollment"

const TYPE_LABEL: Record<RegistrationType, string> = {
  [REGISTRATION_TYPE.FIRST_CHILD]: ENROLLMENT_MSG.TYPE_FIRST_CHILD,
  [REGISTRATION_TYPE.ADDITIONAL_CHILD]: ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD,
  [REGISTRATION_TYPE.ADDITIONAL_SUBJECT]: ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT,
}

export interface EnrollmentSummaryPanelProps {
  currentStep: number
  totalSteps: number
  registrationType: RegistrationType
  parentEmail: string
  studentName: string
  grade?: number
  subjectCode?: string
  className?: string
  expectedTuition: number
  discount: number
}

function EnrollmentSummaryPanel({
  currentStep,
  totalSteps,
  registrationType,
  parentEmail,
  studentName,
  grade,
  subjectCode,
  className,
  expectedTuition,
  discount,
}: EnrollmentSummaryPanelProps) {
  const total = Math.max(0, expectedTuition - discount)

  return (
    <div className="space-y-4">
      <Card className="gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
            <HugeiconsIcon icon={Invoice01Icon} className="size-4 text-primary" />
            {ENROLLMENT_MSG.SUMMARY_TITLE}
          </p>
          <Badge variant="secondary" className="rounded-full">
            {ENROLLMENT_MSG.SUMMARY_STEP(currentStep + 1, totalSteps)}
          </Badge>
        </div>

        <dl className="space-y-3 border-t border-border pt-3">
          <SummaryRow label={ENROLLMENT_MSG.SUMMARY_TYPE}>
            <Badge variant="info" className="rounded-full">
              {TYPE_LABEL[registrationType]}
            </Badge>
          </SummaryRow>

          <SummaryRow label={ENROLLMENT_MSG.SUMMARY_PARENT}>
            {parentEmail || <EmptyValue />}
          </SummaryRow>

          <SummaryRow label={ENROLLMENT_MSG.SUMMARY_STUDENT}>
            {studentName ? (
              <span>
                {studentName}
                {grade !== undefined && ` · ${STUDENT_MSG.GRADE_LABEL(grade)}`}
              </span>
            ) : (
              <EmptyValue />
            )}
          </SummaryRow>

          <SummaryRow label={ENROLLMENT_MSG.SUMMARY_CLASS}>
            {className ? (
              <span className="flex flex-wrap items-center gap-1.5">
                {subjectCode && <SubjectTag code={subjectCode} />}
                <span>{className}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {ENROLLMENT_MSG.SUMMARY_NO_CLASS}
              </span>
            )}
          </SummaryRow>
        </dl>
      </Card>

      <Card className="gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {ENROLLMENT_MSG.SUMMARY_TUITION_TITLE}
        </p>

        <dl className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">
              {ENROLLMENT_MSG.SUMMARY_TUITION_EXPECTED}
            </dt>
            <dd>
              <MoneyText amount={expectedTuition} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{ENROLLMENT_MSG.SUMMARY_DISCOUNT}</dt>
            <dd>
              <MoneyText amount={-discount} muted />
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {ENROLLMENT_MSG.SUMMARY_TOTAL}
            </p>
            <p className="text-xs text-muted-foreground">
              {ENROLLMENT_MSG.SUMMARY_TOTAL_NOTE}
            </p>
          </div>
          <MoneyText
            amount={total}
            className="shrink-0 font-heading text-lg font-bold text-primary"
          />
        </div>
      </Card>

      <Card size="sm" className="gap-2 border-primary/30 bg-primary/5">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HugeiconsIcon icon={HelpCircleIcon} className="size-4 text-primary" />
          {ENROLLMENT_MSG.SUMMARY_HELP_TITLE}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {ENROLLMENT_MSG.SUMMARY_HELP_DESC}
        </p>
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  )
}

function EmptyValue() {
  return (
    <span className="text-muted-foreground">{ENROLLMENT_MSG.SUMMARY_EMPTY}</span>
  )
}

export { EnrollmentSummaryPanel }
