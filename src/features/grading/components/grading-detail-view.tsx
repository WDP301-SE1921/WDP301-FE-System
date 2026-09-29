"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary"
import { ErrorState } from "@/components/shared/feedback/error-state"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { SectionCard } from "@/components/shared/display/section-card"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { ERROR_MSG } from "@/constants/messages/error"
import { GRADING_MSG } from "@/constants/messages/events/grading"
import { ROUTES } from "@/constants/routes"
import {
  useGradingDetail,
  usePublishGrading,
  useSaveGradingReview,
} from "@/features/grading/hooks/use-grading"
import type { GradingDetail, QuestionReviewRow } from "@/features/grading/selectors"
import { MockError } from "@/mocks/utils/mock-query"
import { gradingReviewSchema, type GradingReviewFormInput } from "@/lib/validators/grading"
import type { GradingReviewInput } from "@/mocks/data/assignments"
import type { AnswerRecord, Question } from "@/types/assignment"
import { cn } from "cn"

function toDefaultValues(detail: GradingDetail): GradingReviewFormInput {
  return {
    scores: detail.questionRows.map((row) => row.answer?.finalScore ?? row.answer?.aiScore ?? 0),
    finalComment: detail.submission.finalComment ?? detail.submission.aiComment ?? "",
  }
}

function toGradingReviewInput(
  detail: GradingDetail,
  values: GradingReviewFormInput
): GradingReviewInput {
  return {
    scores: detail.questionRows.map((row, index) => ({
      questionId: row.question.id,
      finalScore: values.scores[index] ?? 0,
    })),
    finalComment: values.finalComment,
  }
}

export interface GradingDetailViewProps {
  submissionId: string
}

function GradingDetailView({ submissionId }: GradingDetailViewProps) {
  const router = useRouter()
  const detailQuery = useGradingDetail(submissionId)
  const saveReview = useSaveGradingReview()
  const publishGrading = usePublishGrading()

  const form = useForm<GradingReviewFormInput>({
    resolver: zodResolver(gradingReviewSchema),
    defaultValues: { scores: [], finalComment: "" },
  })
  const { control, register, handleSubmit } = form

  // Đồng bộ form theo dữ liệu vừa tải — "adjust state during render" thay vì
  // useEffect, tránh lỗi lint react-hooks/set-state-in-effect.
  const [syncedDetail, setSyncedDetail] = React.useState<GradingDetail | null>(null)
  if (detailQuery.data && detailQuery.data !== syncedDetail) {
    setSyncedDetail(detailQuery.data)
    form.reset(toDefaultValues(detailQuery.data))
  }

  const scores = useWatch({ control, name: "scores" })
  const totalScore = React.useMemo(
    () => (scores ?? []).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0),
    [scores]
  )

  const isSubmitting = saveReview.isPending || publishGrading.isPending

  const goToNextOrQueue = (nextId: string | undefined) => {
    router.push(nextId ? ROUTES.TEACHER.GRADING_DETAIL(nextId) : ROUTES.TEACHER.GRADING)
  }

  const handleError = (error: unknown) => {
    toast.error(error instanceof MockError ? error.message : ERROR_MSG.DEFAULT)
  }

  const handleSaveChanges = handleSubmit((values) => {
    if (!syncedDetail) return
    saveReview.mutate(
      { submissionId, input: toGradingReviewInput(syncedDetail, values) },
      {
        onSuccess: () => toast.success(GRADING_MSG.SAVE_SUCCESS),
        onError: handleError,
      }
    )
  })

  const handleReviewOnly = handleSubmit((values) => {
    if (!syncedDetail) return
    saveReview.mutate(
      { submissionId, input: toGradingReviewInput(syncedDetail, values) },
      {
        onSuccess: () => {
          toast.success(GRADING_MSG.REVIEW_ONLY_SUCCESS)
          goToNextOrQueue(syncedDetail.nextId)
        },
        onError: handleError,
      }
    )
  })

  const handlePublish = handleSubmit((values) => {
    if (!syncedDetail) return
    publishGrading.mutate(
      { submissionId, input: toGradingReviewInput(syncedDetail, values) },
      {
        onSuccess: () => {
          toast.success(GRADING_MSG.PUBLISH_SUCCESS)
          goToNextOrQueue(syncedDetail.nextId)
        },
        onError: handleError,
      }
    )
  })

  return (
    <PageContainer>
      <AsyncBoundary
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        error={detailQuery.error}
        onRetry={() => detailQuery.refetch()}
        skeleton={<SkeletonDetailHeader />}
      >
        {detailQuery.data === null ? (
          <ErrorState title={GRADING_MSG.NOT_FOUND_TITLE} message={GRADING_MSG.NOT_FOUND_DESC} />
        ) : (
          detailQuery.data && (
            <div className="space-y-4">
              <PageHeader
                title={detailQuery.data.student.name}
                description={detailQuery.data.assignment.title}
                backHref={ROUTES.TEACHER.GRADING}
                breadcrumbs={[
                  { label: "Trang chủ", href: ROUTES.TEACHER.DASHBOARD },
                  { label: GRADING_MSG.QUEUE_TITLE, href: ROUTES.TEACHER.GRADING },
                  {
                    label: GRADING_MSG.DETAIL_BREADCRUMB(
                      detailQuery.data.student.name,
                      detailQuery.data.assignment.title
                    ),
                  },
                ]}
              />

              <Alert variant="warning">
                <HugeiconsIcon icon={Alert01Icon} />
                <AlertDescription>{GRADING_MSG.DETAIL_ALERT_DESC}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(320px,380px)]">
                <div className="space-y-4">
                  {detailQuery.data.questionRows.map((row, index) => (
                    <QuestionReviewCard key={row.question.id} row={row} order={index + 1} />
                  ))}
                </div>

                <div className="lg:sticky lg:top-6 lg:self-start">
                  <SectionCard title={GRADING_MSG.RESULT_CARD_TITLE}>
                    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
                      <div className="space-y-3">
                        {detailQuery.data.questionRows.map((row, index) => (
                          <div key={row.question.id} className="flex items-center justify-between gap-3">
                            <Label htmlFor={`score-${row.question.id}`} className="text-sm font-normal">
                              {ASSIGNMENT_MSG.QUESTION_LABEL(index + 1)}{" "}
                              <span className="text-xs text-muted-foreground">
                                / {row.question.points}
                              </span>
                            </Label>
                            <Controller
                              control={control}
                              name={`scores.${index}`}
                              render={({ field }) => (
                                <Input
                                  id={`score-${row.question.id}`}
                                  type="number"
                                  min={0}
                                  max={row.question.points}
                                  step={0.25}
                                  className="w-24 text-right"
                                  value={field.value ?? 0}
                                  onChange={(event) => {
                                    const raw = Number(event.target.value)
                                    const clamped = Number.isFinite(raw)
                                      ? Math.min(Math.max(raw, 0), row.question.points)
                                      : 0
                                    field.onChange(clamped)
                                  }}
                                />
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {GRADING_MSG.TOTAL_SCORE_LABEL}
                        </span>
                        <span className="text-2xl font-bold text-foreground tabular-nums">
                          {totalScore}/{detailQuery.data.totalPoints}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="grading-ai-comment">{GRADING_MSG.FIELD_AI_COMMENT}</Label>
                        <Textarea id="grading-ai-comment" rows={4} {...register("finalComment")} />
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          isLoading={saveReview.isPending}
                          disabled={isSubmitting}
                          onClick={() => void handleSaveChanges()}
                        >
                          {GRADING_MSG.ACTION_SAVE_CHANGES}
                        </Button>
                        <Button
                          type="button"
                          className="rounded-full"
                          isLoading={publishGrading.isPending}
                          disabled={isSubmitting}
                          onClick={() => void handlePublish()}
                        >
                          {GRADING_MSG.ACTION_PUBLISH}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-full"
                          isLoading={saveReview.isPending}
                          disabled={isSubmitting}
                          onClick={() => void handleReviewOnly()}
                        >
                          {GRADING_MSG.ACTION_REVIEW_ONLY}
                        </Button>
                      </div>
                    </form>
                  </SectionCard>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {detailQuery.data.previousId ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    render={<Link href={ROUTES.TEACHER.GRADING_DETAIL(detailQuery.data.previousId)} />}
                  >
                    {GRADING_MSG.NAV_PREVIOUS}
                  </Button>
                ) : (
                  <Button variant="outline" className="rounded-full" disabled>
                    {GRADING_MSG.NAV_PREVIOUS}
                  </Button>
                )}

                {detailQuery.data.nextId ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    render={<Link href={ROUTES.TEACHER.GRADING_DETAIL(detailQuery.data.nextId)} />}
                  >
                    {GRADING_MSG.NAV_NEXT}
                  </Button>
                ) : (
                  <Button variant="outline" className="rounded-full" disabled>
                    {GRADING_MSG.NAV_NEXT}
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </AsyncBoundary>
    </PageContainer>
  )
}

function QuestionReviewCard({ row, order }: { row: QuestionReviewRow; order: number }) {
  const { question, answer, correctOption } = row
  const isMultipleChoice = question.type === "multiple_choice"

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-heading text-sm font-semibold text-foreground">
          {ASSIGNMENT_MSG.QUESTION_LABEL(order)}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {GRADING_MSG.POINTS_LABEL(question.points)}
        </span>
      </div>
      <p className="text-sm text-foreground">{question.content}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {GRADING_MSG.SECTION_STUDENT_ANSWER}
          </p>
          {isMultipleChoice ? (
            <StudentChoiceAnswer question={question} answer={answer} />
          ) : (
            <p className="whitespace-pre-line text-sm text-foreground">
              {answer?.essayAnswer || GRADING_MSG.NO_ANSWER}
            </p>
          )}
        </div>

        <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {isMultipleChoice
              ? GRADING_MSG.SECTION_CORRECT_ANSWER
              : GRADING_MSG.SECTION_SAMPLE_ANSWER}
          </p>
          {isMultipleChoice ? (
            <p className="text-sm font-medium text-emerald-600">{correctOption?.content ?? "—"}</p>
          ) : (
            <p className="whitespace-pre-line text-sm text-foreground">
              {question.sampleAnswer || "—"}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function StudentChoiceAnswer({
  question,
  answer,
}: {
  question: Question
  answer?: AnswerRecord
}) {
  const selectedOption = question.options?.find((option) => option.id === answer?.selectedOptionId)

  if (!selectedOption) {
    return <p className="text-sm text-muted-foreground">{GRADING_MSG.NO_ANSWER}</p>
  }

  return (
    <p className={cn("text-sm font-medium", selectedOption.isCorrect ? "text-emerald-600" : "text-red-600")}>
      {selectedOption.content}
    </p>
  )
}

export { GradingDetailView }
