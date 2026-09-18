"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  UserAdd01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SelectableCard } from "@/components/shared/pickers/selectable-card"
import { SectionCard } from "@/components/shared/display/section-card"
import { ENROLLMENT_MSG } from "@/constants/messages/events/enrollment"
import { REGISTRATION_TYPE, type RegistrationType } from "@/lib/validators/enrollment"

interface TypeOption {
  value: RegistrationType
  icon: IconSvgElement
  title: string
  badge: string
  description: string
  notes: [string, string]
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: REGISTRATION_TYPE.FIRST_CHILD,
    icon: UserAdd01Icon,
    title: ENROLLMENT_MSG.TYPE_FIRST_CHILD,
    badge: ENROLLMENT_MSG.TYPE_FIRST_CHILD_BADGE,
    description: ENROLLMENT_MSG.TYPE_FIRST_CHILD_DESC,
    notes: [
      ENROLLMENT_MSG.TYPE_FIRST_CHILD_NOTE_1,
      ENROLLMENT_MSG.TYPE_FIRST_CHILD_NOTE_2,
    ],
  },
  {
    value: REGISTRATION_TYPE.ADDITIONAL_CHILD,
    icon: UserGroupIcon,
    title: ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD,
    badge: ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD_BADGE,
    description: ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD_DESC,
    notes: [
      ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD_NOTE_1,
      ENROLLMENT_MSG.TYPE_ADDITIONAL_CHILD_NOTE_2,
    ],
  },
  {
    value: REGISTRATION_TYPE.ADDITIONAL_SUBJECT,
    icon: UserIcon,
    title: ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT,
    badge: ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT_BADGE,
    description: ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT_DESC,
    notes: [
      ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT_NOTE_1,
      ENROLLMENT_MSG.TYPE_ADDITIONAL_SUBJECT_NOTE_2,
    ],
  },
]

export interface StepRegistrationTypeProps {
  value: RegistrationType
  onChange: (value: RegistrationType) => void
}

function StepRegistrationType({ value, onChange }: StepRegistrationTypeProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title={ENROLLMENT_MSG.TYPE_TITLE}
        description={ENROLLMENT_MSG.TYPE_DESC}
        action={
          <Badge variant="warning" className="rounded-full">
            {ENROLLMENT_MSG.TYPE_REQUIRED_BADGE}
          </Badge>
        }
      >
        <div className="space-y-3">
          {TYPE_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              selected={value === option.value}
              onSelect={() => onChange(option.value)}
            >
              <div className="flex gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={option.icon} className="size-5" />
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-base font-semibold text-foreground">
                      {option.title}
                    </p>
                    <Badge variant="info" className="rounded-full">
                      {option.badge}
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {option.notes.map((note) => (
                      <span
                        key={note}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="size-3.5 text-primary"
                        />
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SelectableCard>
          ))}
        </div>
      </SectionCard>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>{ENROLLMENT_MSG.ACCOUNT_RULE_TITLE}</AlertTitle>
        <AlertDescription>{ENROLLMENT_MSG.ACCOUNT_RULE_DESC}</AlertDescription>
      </Alert>
    </div>
  )
}

export { StepRegistrationType }
