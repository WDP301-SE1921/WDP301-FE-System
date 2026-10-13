"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { SectionCard } from "@/components/shared/display/section-card"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { ERROR_MSG } from "@/constants/messages/error"
import { ROUTES } from "@/constants/routes"
import { QuestionEditor } from "@/features/assignments/components/question-editor"
import {
  useAssignmentDetail,
  useCreateAssignment,
  useUpdateAssignment,
} from "@/features/assignments/hooks/use-assignments"
import { getMyClassOptions, type AssignmentDetail } from "@/features/assignments/selectors"
import {
  ASSIGNMENT_TYPE_VALUE,
  QUESTION_TYPE_VALUE,
  SUBMISSION_METHOD_VALUE,
  assignmentFormSchema,
  type AssignmentFormInput,
  type QuestionFormInput,
} from "@/lib/validators/assignment"
import { type AssignmentInput } from "@/mocks/data/assignments"
import { MockError } from "@/mocks/utils/mock-query"
import type { Assignment, AssignmentStatus } from "@/types/assignment"
import { cn } from "cn"

const SUBMISSION_METHOD_ITEMS: Record<string, string> = {
  [SUBMISSION_METHOD_VALUE.ONLINE]: ASSIGNMENT_MSG.SUBMISSION_METHOD_ONLINE,
  [SUBMISSION_METHOD_VALUE.PHOTO_UPLOAD]: ASSIGNMENT_MSG.SUBMISSION_METHOD_PHOTO,
}

const TYPE_TOGGLE_OPTIONS = [
  { value: ASSIGNMENT_TYPE_VALUE.PRACTICE, label: ASSIGNMENT_MSG.TYPE_OPTION_PRACTICE },
  { value: ASSIGNMENT_TYPE_VALUE.TEST, label: ASSIGNMENT_MSG.TYPE_OPTION_TEST },
]

function createDefaultOptions(idPrefix: string): QuestionFormInput["options"] {
  return [
    { id: `${idPrefix}-opt-1`, content: "", isCorrect: true },
    { id: `${idPrefix}-opt-2`, content: "", isCorrect: false },
    { id: `${idPrefix}-opt-3`, content: "", isCorrect: false },
    { id: `${idPrefix}-opt-4`, content: "", isCorrect: false },
  ]
}

/**
 * Câu hỏi mới luôn dựng sẵn cả `options` (4 ô) lẫn `sampleAnswer` rỗng, bất kể
 * đang chọn loại nào — nhờ vậy đổi qua lại Trắc nghiệm/Tự luận không cần dựng lại
 * dữ liệu, tránh phải truyền thêm `getValues` vào `QuestionEditor`.
 */
function createDefaultQuestion(id: string): QuestionFormInput {
  return {
    id,
    type: QUESTION_TYPE_VALUE.MULTIPLE_CHOICE,
    content: "",
    points: 1,
    options: createDefaultOptions(id),
    sampleAnswer: "",
  }
}

function toDatetimeLocalValue(value: string): string {
  return value ? value.slice(0, 16) : ""
}

function toFormInput(assignment: Assignment): AssignmentFormInput {
  return {
    title: assignment.title,
    classId: assignment.classId,
    type: assignment.type,
    description: assignment.description ?? "",
    submissionMethod: assignment.submissionMethod,
    openAt: toDatetimeLocalValue(assignment.openAt),
    dueDate: toDatetimeLocalValue(assignment.dueDate),
    allowLateSubmission: assignment.allowLateSubmission,
    latePenaltyPerHour: assignment.latePenaltyPerHour,
    durationMinutes: assignment.durationMinutes,
    questions: assignment.questions.map((question) => ({
      id: question.id,
      type: question.type,
      content: question.content,
      points: question.points,
      options: question.options ?? createDefaultOptions(question.id),
      sampleAnswer: question.sampleAnswer ?? "",
    })),
  }
}

function toDefaultValues(): AssignmentFormInput {
  return {
    title: "",
    classId: "",
    type: ASSIGNMENT_TYPE_VALUE.PRACTICE,
    description: "",
    submissionMethod: SUBMISSION_METHOD_VALUE.ONLINE,
    openAt: "",
    dueDate: "",
    allowLateSubmission: false,
    latePenaltyPerHour: undefined,
    durationMinutes: undefined,
    questions: [createDefaultQuestion("q-1")],
  }
}

function toMutationInput(values: AssignmentFormInput, status: AssignmentStatus): AssignmentInput {
  return {
    title: values.title,
    classId: values.classId,
    type: values.type,
    description: values.description,
    submissionMethod: values.submissionMethod,
    openAt: values.openAt,
    dueDate: values.dueDate,
    allowLateSubmission: values.allowLateSubmission,
    latePenaltyPerHour: values.allowLateSubmission ? values.latePenaltyPerHour : undefined,
    durationMinutes: values.durationMinutes,
    status,
    questions: values.questions.map((question) => ({
      id: question.id,
      type: question.type,
      content: question.content,
      points: question.points,
      options: question.type === "multiple_choice" ? question.options : undefined,
      sampleAnswer: question.type === "essay" ? question.sampleAnswer : undefined,
    })),
  }
}

export interface AssignmentFormViewProps {
  assignmentId?: string
}

function AssignmentFormView({ assignmentId }: AssignmentFormViewProps) {
  const router = useRouter()
  const isEdit = Boolean(assignmentId)

  const detailQuery = useAssignmentDetail(assignmentId ?? "")
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const isSubmitting = createAssignment.isPending || updateAssignment.isPending

  const classItems = React.useMemo<Record<string, string>>(
    () => Object.fromEntries(getMyClassOptions().map((option) => [option.value, option.label])),
    []
  )

  const form = useForm<AssignmentFormInput>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: toDefaultValues(),
  })
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
    keyName: "fieldKey",
  })

  // Đồng bộ form theo dữ liệu bài tập vừa tải (chế độ Sửa) — "adjust state during
  // render" thay vì useEffect, tránh lỗi lint react-hooks/set-state-in-effect.
  const [syncedAssignment, setSyncedAssignment] = React.useState<AssignmentDetail | null>(null)
  if (isEdit && detailQuery.data && detailQuery.data !== syncedAssignment) {
    setSyncedAssignment(detailQuery.data)
    form.reset(toFormInput(detailQuery.data))
  }

  const allowLateSubmission = useWatch({ control, name: "allowLateSubmission" })

  const handleAddQuestion = () => {
    const newId = `q-${crypto.randomUUID()}`
    append(createDefaultQuestion(newId))
  }

  const submitAssignment = (values: AssignmentFormInput, status: AssignmentStatus) => {
    const input = toMutationInput(values, status)
    const successMessage =
      status === "draft" ? ASSIGNMENT_MSG.DRAFT_SAVED : ASSIGNMENT_MSG.CREATE_SUCCESS
    const onError = (error: unknown) => {
      toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
    }

    if (isEdit && assignmentId) {
      updateAssignment.mutate(
        { id: assignmentId, input },
        {
          onSuccess: () => {
            toast.success(status === "draft" ? ASSIGNMENT_MSG.DRAFT_SAVED : ASSIGNMENT_MSG.UPDATE_SUCCESS)
            router.push(ROUTES.TEACHER.ASSIGNMENTS)
          },
          onError,
        }
      )
      return
    }

    createAssignment.mutate(input, {
      onSuccess: () => {
        toast.success(successMessage)
        router.push(ROUTES.TEACHER.ASSIGNMENTS)
      },
      onError,
    })
  }

  const handleSaveDraft = handleSubmit((values) => submitAssignment(values, "draft"))
  const handleAssignNow = handleSubmit((values) => submitAssignment(values, "assigned"))

  if (isEdit && detailQuery.isPending) {
    return (
      <PageContainer>
        <SkeletonDetailHeader />
      </PageContainer>
    )
  }

  if (isEdit && detailQuery.data === null) {
    return (
      <PageContainer>
        <ErrorState
          title={ASSIGNMENT_MSG.NOT_FOUND_TITLE}
          message={ASSIGNMENT_MSG.NOT_FOUND_DESC}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEdit ? ASSIGNMENT_MSG.EDIT_TITLE : ASSIGNMENT_MSG.CREATE_TITLE}
        description={isEdit ? ASSIGNMENT_MSG.EDIT_DESC : ASSIGNMENT_MSG.CREATE_DESC}
        backHref={ROUTES.TEACHER.ASSIGNMENTS}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
          { label: ASSIGNMENT_MSG.LIST_TITLE, href: ROUTES.TEACHER.ASSIGNMENTS },
          { label: isEdit ? ASSIGNMENT_MSG.EDIT_TITLE : ASSIGNMENT_MSG.CREATE_TITLE },
        ]}
      />

      <form onSubmit={(event) => event.preventDefault()} noValidate className="space-y-4">
        <SectionCard title={ASSIGNMENT_MSG.SECTION_INFO_TITLE}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-title" required>
                {ASSIGNMENT_MSG.FIELD_TITLE}
              </Label>
              <Input
                id="assignment-title"
                placeholder={ASSIGNMENT_MSG.FIELD_TITLE_PLACEHOLDER}
                error={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-class" required>
                  {ASSIGNMENT_MSG.FIELD_CLASS}
                </Label>
                <Controller
                  control={control}
                  name="classId"
                  render={({ field }) => (
                    <Select
                      items={classItems}
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(String(value ?? ""))}
                    >
                      <SelectTrigger
                        id="assignment-class"
                        className="rounded-xl"
                        error={Boolean(errors.classId)}
                      >
                        <SelectValue placeholder={ASSIGNMENT_MSG.FIELD_CLASS_PLACEHOLDER} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(classItems).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.classId && (
                  <p className="text-xs text-destructive">{errors.classId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label required>{ASSIGNMENT_MSG.FIELD_TYPE}</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <div className="flex gap-1.5 rounded-xl border border-border bg-muted/40 p-1">
                      {TYPE_TOGGLE_OPTIONS.map((option) => {
                        const isActive = field.value === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-open-at" required>
                  {ASSIGNMENT_MSG.FIELD_OPEN_AT}
                </Label>
                <Input
                  id="assignment-open-at"
                  type="datetime-local"
                  error={Boolean(errors.openAt)}
                  {...register("openAt")}
                />
                {errors.openAt && (
                  <p className="text-xs text-destructive">{errors.openAt.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignment-due-date" required>
                  {ASSIGNMENT_MSG.FIELD_DUE_DATE}
                </Label>
                <Input
                  id="assignment-due-date"
                  type="datetime-local"
                  error={Boolean(errors.dueDate)}
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="text-xs text-destructive">{errors.dueDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignment-duration">{ASSIGNMENT_MSG.FIELD_DURATION}</Label>
                <Controller
                  control={control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <Input
                      id="assignment-duration"
                      type="number"
                      min={0}
                      placeholder={ASSIGNMENT_MSG.FIELD_DURATION_PLACEHOLDER}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value
                        field.onChange(raw === "" ? undefined : Number(raw))
                      }}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignment-description">{ASSIGNMENT_MSG.FIELD_DESCRIPTION}</Label>
              <Textarea
                id="assignment-description"
                rows={3}
                placeholder={ASSIGNMENT_MSG.FIELD_DESCRIPTION_PLACEHOLDER}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-submission-method">
                  {ASSIGNMENT_MSG.FIELD_SUBMISSION_METHOD}
                </Label>
                <Controller
                  control={control}
                  name="submissionMethod"
                  render={({ field }) => (
                    <Select
                      items={SUBMISSION_METHOD_ITEMS}
                      value={field.value}
                      onValueChange={(value) => field.onChange(String(value))}
                    >
                      <SelectTrigger id="assignment-submission-method" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SUBMISSION_METHOD_ITEMS).map(([value, label]) => (
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
                <Controller
                  control={control}
                  name="allowLateSubmission"
                  render={({ field }) => (
                    <div className="flex h-9 items-center justify-between rounded-xl border border-border px-3">
                      <Label htmlFor="assignment-allow-late" className="cursor-pointer">
                        {ASSIGNMENT_MSG.FIELD_ALLOW_LATE}
                      </Label>
                      <Switch
                        id="assignment-allow-late"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
                {allowLateSubmission && (
                  <Controller
                    control={control}
                    name="latePenaltyPerHour"
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        placeholder={ASSIGNMENT_MSG.FIELD_LATE_PENALTY}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value
                          field.onChange(raw === "" ? undefined : Number(raw))
                        }}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={ASSIGNMENT_MSG.SECTION_QUESTIONS_TITLE}
          description={ASSIGNMENT_MSG.SECTION_QUESTIONS_DESC}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title={ASSIGNMENT_MSG.FEATURE_IN_PROGRESS}
              >
                {ASSIGNMENT_MSG.IMPORT_WORD}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title={ASSIGNMENT_MSG.FEATURE_IN_PROGRESS}
              >
                {ASSIGNMENT_MSG.QUESTION_BANK}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title={ASSIGNMENT_MSG.FEATURE_IN_PROGRESS}
              >
                {ASSIGNMENT_MSG.SHUFFLE_QUESTIONS}
              </Button>
            </div>

            {errors.questions?.message && (
              <Alert variant="danger">
                <HugeiconsIcon icon={InformationCircleIcon} />
                <AlertDescription>{errors.questions.message}</AlertDescription>
              </Alert>
            )}

            {fields.map((field, index) => (
              <QuestionEditor
                key={field.fieldKey}
                control={control}
                register={register}
                setValue={setValue}
                errors={errors.questions?.[index]}
                index={index}
                order={index + 1}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-dashed"
              leftIcon={<HugeiconsIcon icon={Add01Icon} />}
              onClick={handleAddQuestion}
            >
              {ASSIGNMENT_MSG.QUESTION_ADD}
            </Button>
          </div>
        </SectionCard>
      </form>

      <StickyFormFooter>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push(ROUTES.TEACHER.ASSIGNMENTS)}
          >
            {ASSIGNMENT_MSG.CANCEL}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              isLoading={isSubmitting}
              onClick={() => void handleSaveDraft()}
            >
              {ASSIGNMENT_MSG.SAVE_DRAFT}
            </Button>
            <Button
              type="button"
              className="rounded-full"
              isLoading={isSubmitting}
              onClick={() => void handleAssignNow()}
            >
              {ASSIGNMENT_MSG.ASSIGN_NOW}
            </Button>
          </div>
        </div>
      </StickyFormFooter>
    </PageContainer>
  )
}

export { AssignmentFormView }
