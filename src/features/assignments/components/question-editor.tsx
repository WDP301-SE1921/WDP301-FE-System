"use client"

import * as React from "react"
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { QUESTION_TYPE_VALUE, type AssignmentFormInput } from "@/lib/validators/assignment"

type QuestionFieldErrors = NonNullable<FieldErrors<AssignmentFormInput>["questions"]>[number]

const QUESTION_TYPE_ITEMS: Record<string, string> = {
  [QUESTION_TYPE_VALUE.MULTIPLE_CHOICE]: ASSIGNMENT_MSG.QUESTION_TYPE_MULTIPLE_CHOICE,
  [QUESTION_TYPE_VALUE.ESSAY]: ASSIGNMENT_MSG.QUESTION_TYPE_ESSAY,
}

export interface QuestionEditorProps {
  control: Control<AssignmentFormInput>
  register: UseFormRegister<AssignmentFormInput>
  setValue: UseFormSetValue<AssignmentFormInput>
  errors?: QuestionFieldErrors
  index: number
  order: number
  onRemove: () => void
  canRemove: boolean
}

function QuestionEditor({
  control,
  register,
  setValue,
  errors,
  index,
  order,
  onRemove,
  canRemove,
}: QuestionEditorProps) {
  const questionType = useWatch({ control, name: `questions.${index}.type` })

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {order}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          <span className="sr-only">{ASSIGNMENT_MSG.QUESTION_DELETE}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem_6rem]">
        <div className="space-y-1.5">
          <Label required>{ASSIGNMENT_MSG.QUESTION_FIELD_CONTENT}</Label>
          <Textarea
            rows={2}
            placeholder={ASSIGNMENT_MSG.QUESTION_FIELD_CONTENT_PLACEHOLDER}
            error={Boolean(errors?.content)}
            {...register(`questions.${index}.content`)}
          />
          {errors?.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{ASSIGNMENT_MSG.QUESTION_FIELD_TYPE}</Label>
          <Controller
            control={control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <Select
                items={QUESTION_TYPE_ITEMS}
                value={field.value}
                onValueChange={(value) => field.onChange(String(value))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_ITEMS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label required>{ASSIGNMENT_MSG.QUESTION_FIELD_POINTS}</Label>
          <Input
            type="number"
            step={0.25}
            min={0}
            error={Boolean(errors?.points)}
            {...register(`questions.${index}.points`, { valueAsNumber: true })}
          />
        </div>
      </div>

      {questionType === QUESTION_TYPE_VALUE.MULTIPLE_CHOICE ? (
        <MultipleChoiceEditor
          control={control}
          register={register}
          setValue={setValue}
          index={index}
          error={errors?.options?.message}
        />
      ) : (
        <div className="space-y-1.5">
          <Label required>{ASSIGNMENT_MSG.QUESTION_FIELD_SAMPLE_ANSWER}</Label>
          <Textarea
            rows={3}
            placeholder={ASSIGNMENT_MSG.QUESTION_FIELD_SAMPLE_ANSWER_PLACEHOLDER}
            error={Boolean(errors?.sampleAnswer)}
            {...register(`questions.${index}.sampleAnswer`)}
          />
          {errors?.sampleAnswer && (
            <p className="text-xs text-destructive">{errors.sampleAnswer.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

function MultipleChoiceEditor({
  control,
  register,
  setValue,
  index,
  error,
}: {
  control: Control<AssignmentFormInput>
  register: UseFormRegister<AssignmentFormInput>
  setValue: UseFormSetValue<AssignmentFormInput>
  index: number
  error?: string
}) {
  const options = useWatch({ control, name: `questions.${index}.options` }) ?? []
  const correctOptionId = options.find((option) => option.isCorrect)?.id ?? ""

  const handleCorrectChange = (optionId: string) => {
    setValue(
      `questions.${index}.options`,
      options.map((option) => ({ ...option, isCorrect: option.id === optionId })),
      { shouldValidate: true }
    )
  }

  return (
    <div className="space-y-2">
      <Label required>{ASSIGNMENT_MSG.QUESTION_OPTION_CORRECT_HINT}</Label>
      <RadioGroup
        value={correctOptionId}
        onValueChange={(value) => handleCorrectChange(String(value))}
        className="gap-2"
      >
        {options.map((option, optionIndex) => (
          <div key={option.id} className="flex items-center gap-2">
            <RadioGroupItem
              id={`${option.id}-radio`}
              value={option.id}
              className="shrink-0"
            />
            <Input
              className="flex-1"
              placeholder={ASSIGNMENT_MSG.QUESTION_OPTION_LABEL(optionIndex)}
              {...register(`questions.${index}.options.${optionIndex}.content`)}
            />
          </div>
        ))}
      </RadioGroup>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export { QuestionEditor }
