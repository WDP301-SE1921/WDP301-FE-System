"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseAsString, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { useUnsavedChanges } from "@/components/shared/feedback/unsaved-changes-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { academicApi, findSubmission } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { useCurrentUser } from "@/hooks/use-current-role";
import { parseStoredUser, readStoredUserRaw } from "@/lib/auth/session";
import { gradeSchema } from "@/lib/validators/web-workflows";
import type {
  AssignmentDetail,
  GradeReview,
  SubmissionRecord,
} from "@/types/academic-workflows";
import {
  createGradeWorkflow,
  latestGrade,
  sameGrade,
  type GradeInput,
} from "../grade-workflow";
import { gradingJobFailureMessage } from "../presentation";
import { ROUTES } from "@/constants/routes";
import { latestSubmissions } from "@/features/assignments/submission-selectors";
import { SubmissionFile } from "./submission-file";

const formSchema = z.object({
  scores: z
    .array(
      z.object({
        questionId: z.string(),
        score: z.number().min(0).max(100),
        feedback: z.string().max(5000),
      }),
    )
    .min(1)
    .max(100),
  feedback: gradeSchema.shape.feedback,
});

export function GradingWorkspace({ submissionId }: { submissionId: string }) {
  const user = useCurrentUser();
  const [assignmentId] = useQueryState(
    "assignmentId",
    parseAsString.withDefault(""),
  );
  const data = useLiveQuery(
    ["grading-detail", submissionId, assignmentId],
    (signal) => findSubmission(submissionId, assignmentId || undefined, signal),
  );
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title={
          data.data ? `Chấm bài · ${data.data.assignment.title}` : "Chấm bài"
        }
        description="Lưu nháp để tiếp tục sửa. Gửi điểm sẽ lưu, duyệt và công bố cho phụ huynh sau khi bạn xác nhận."
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && user && (
          <GradeWorkspace
            key={`${user.id}:${submissionId}`}
            ownerId={user.id}
            {...data.data}
          />
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}

function GradeWorkspace({
  assignment,
  submission,
  ownerId,
}: {
  assignment: AssignmentDetail;
  submission: SubmissionRecord;
  ownerId: string;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const initial = latestGrade(submission);
  const [baselineRevision, setBaselineRevision] = useState(
    initial?.revision ?? 0,
  );
  const [saved, setSaved] = useState<GradeReview | undefined>(initial);
  const [confirming, setConfirming] = useState<GradeInput | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [jobId, setJobId] = useQueryState(
    "jobId",
    parseAsString.withDefault(""),
  );
  const form = useForm<GradeInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scores: assignment.questions.map((question) => ({
        questionId: question.id,
        score:
          initial?.scores.find((item) => item.questionId === question.id)
            ?.score ??
          (question.kind === "MULTIPLE_CHOICE" &&
          question.correctAnswer &&
          submission.answers.find((answer) => answer.questionId === question.id)
            ?.answer === question.correctAnswer
            ? question.maxScore
            : 0),
        feedback:
          initial?.scores.find((item) => item.questionId === question.id)
            ?.feedback ?? "",
      })),
      feedback: initial?.feedback ?? "",
    },
  });
  const scores = useWatch({ control: form.control, name: "scores" });
  const total = (scores ?? []).reduce(
    (sum, score) => sum + (Number.isFinite(score.score) ? score.score : 0),
    0,
  );
  const maximum = assignment.questions.reduce(
    (sum, question) => sum + question.maxScore,
    0,
  );
  const requireOwner = () => {
    if (parseStoredUser(readStoredUserRaw())?.id !== ownerId)
      throw new Error(
        "Phiên đăng nhập đã thay đổi. Tải lại trang trước khi chấm bài.",
      );
  };
  const [workflow] = useState(() => {
    const checked = async <T,>(work: () => Promise<T>) => {
      requireOwner();
      const value = await work();
      requireOwner();
      return value;
    };
    return createGradeWorkflow({
      read: () =>
        checked(
          async () =>
            (await findSubmission(submission.id, assignment.id)).submission,
        ),
      save: (input) => checked(() => academicApi.grade(submission.id, input)),
      approve: (id) => checked(() => academicApi.approveGrade(id)),
      publish: (id) => checked(() => academicApi.publishGrade(id)),
      objective: () => checked(() => academicApi.gradeObjective(submission.id)),
      onSaved: (grade) => {
        setBaselineRevision(grade.revision);
        setSaved(grade);
        // Recovering an uncertain save must not erase edits made since that request.
        if (sameGrade(form.getValues(), grade))
          form.reset({ scores: grade.scores, feedback: grade.feedback });
      },
    });
  });
  const lock = useRef(false);
  const action = useMutation({
    mutationFn: async ({
      mode,
      input,
    }: {
      mode: "draft" | "send" | "objective";
      input?: GradeInput;
    }) => {
      try {
        if (mode === "objective") return await workflow.objective();
        return mode === "send"
          ? await workflow.send(input!, baselineRevision)
          : await workflow.saveDraft(input!, baselineRevision);
      } finally {
        lock.current = false;
      }
    },
    onSuccess: (grade, variables) => {
      if (parseStoredUser(readStoredUserRaw())?.id !== ownerId) return;
      setSaved(grade);
      setBaselineRevision(grade.revision);
      form.reset({ scores: grade.scores, feedback: grade.feedback });
      if (variables.mode === "send") setConfirming(null);
      toast.success(
        variables.mode === "send"
          ? "Đã gửi điểm cho phụ huynh."
          : "Đã lưu bản chấm nháp.",
      );
    },
    onSettled: () => {
      if (parseStoredUser(readStoredUserRaw())?.id === ownerId)
        void client.invalidateQueries({ queryKey: ["web-api", ownerId] });
    },
  });
  const ai = useMutation({
    mutationFn: async () => {
      requireOwner();
      const result = await academicApi.gradeAi(submission.id);
      requireOwner();
      await setJobId(result.id);
      return result;
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  const job = useLiveQuery(
    ["grading-job", jobId],
    (signal) => academicApi.gradingJob(jobId, signal),
    !!jobId,
    (value) =>
      value.submissionId === submission.id &&
      (value.status === "QUEUED" || value.status === "PROCESSING"),
  );
  const aiBusy =
    job.data?.submissionId === submission.id &&
    ["QUEUED", "PROCESSING"].includes(job.data.status);
  const suggestions =
    job.data?.submissionId === submission.id && job.data.status === "SUCCEEDED"
      ? job.data.result?.scores
      : undefined;
  const busy = action.isPending || ai.isPending;
  useUnsavedChanges(form.formState.isDirty || busy);
  const peers = useLiveQuery(["grading-peers", assignment.id], (signal) =>
    academicApi.submissions(assignment.id, signal),
  );
  const next = [...latestSubmissions(peers.data ?? []).values()].find(
    (item) => item.id !== submission.id && !item.grades.length,
  );
  const nextHref = next
    ? `${ROUTES.TEACHER.GRADING_DETAIL(next.id)}?assignmentId=${assignment.id}`
    : "";
  const latest = latestGrade(submission);
  const current =
    saved && (!latest || saved.revision >= latest.revision) ? saved : latest;
  const history = [...submission.grades];
  if (saved && !history.some((grade) => grade.id === saved.id))
    history.unshift(saved);
  const validateMaximum = (input: GradeInput) => {
    let valid = true;
    input.scores.forEach((score, index) => {
      const question = assignment.questions.find(
        (item) => item.id === score.questionId,
      );
      if (!question || score.score > question.maxScore) {
        form.setError(`scores.${index}.score`, {
          message: "Điểm vượt điểm tối đa của câu.",
        });
        valid = false;
      }
    });
    return valid;
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    void form.handleSubmit((input) => {
      if (!busy && validateMaximum(input)) begin("draft", input);
    })(event);
  };
  const askSend = () => {
    void form.handleSubmit((input) => {
      if (!busy && validateMaximum(input))
        setConfirming({
          scores: input.scores.map((score) => ({ ...score })),
          feedback: input.feedback,
        });
    })();
  };
  const begin = (mode: "draft" | "send" | "objective", input?: GradeInput) => {
    if (lock.current) return;
    lock.current = true;
    action.mutate({ mode, input });
  };
  const guardNavigation = (event: React.MouseEvent, href: string) => {
    if (busy || form.formState.isDirty) {
      event.preventDefault();
      if (!busy) setLeaving(href);
    }
  };
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge>{current ? STATUS_TEXT[current.status] : "Chưa chấm"}</Badge>
        <span className="text-sm text-muted-foreground">
          Lần nộp {submission.attemptNo}/{assignment.maxAttempts} ·{" "}
          {displayMoment(submission.submittedAt)}
        </span>
        <Button
          variant="outline"
          disabled={busy}
          onClick={(event) =>
            guardNavigation(
              event,
              ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(assignment.id),
            )
          }
          render={
            <Link href={ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(assignment.id)} />
          }
        >
          Danh sách bài nộp
        </Button>
        {next && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={(event) => guardNavigation(event, nextHref)}
            render={<Link href={nextHref} />}
          >
            Bài chưa chấm tiếp theo
          </Button>
        )}
      </div>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Bài làm">
          {assignment.questions.map((question, index) => {
            const answer = submission.answers.find(
              (item) => item.questionId === question.id,
            )?.answer;
            const targetOutcome = assignment.learningTargets?.find(
              (item) => item.id === question.outcomeId,
            );
            return (
              <Card key={question.id} className="min-w-0">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    Câu {index + 1} ·{" "}
                    {question.kind === "ESSAY" ? "Tự luận" : "Trắc nghiệm"} ·{" "}
                    {question.maxScore} điểm
                  </CardTitle>
                  {targetOutcome && (
                    <Badge variant="info" title={targetOutcome.statement}>
                      {targetOutcome.code} · {targetOutcome.title}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap break-words">
                    {question.prompt}
                  </p>
                  {question.choices?.map((choice, choiceIndex) => (
                    <div
                      key={`${choiceIndex}:${choice}`}
                      className={`rounded-xl border p-3 text-sm ${answer === choice ? "border-primary bg-primary/5 font-medium" : "border-border"}`}
                    >
                      {choice}
                      {answer === choice ? " · Học sinh chọn" : ""}
                      {choice === question.correctAnswer
                        ? " · Đáp án đúng"
                        : ""}
                    </div>
                  ))}
                  {question.kind === "ESSAY" && (
                    <div className="rounded-xl bg-muted p-4">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Bài làm của học sinh
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {answer || "Chưa có câu trả lời bằng chữ."}
                      </p>
                    </div>
                  )}
                  {question.rubric && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      Tiêu chí chấm: {question.rubric}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {submission.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tệp bài làm · {submission.files.length}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Các tệp thuộc cả bài nộp. Đối chiếu nội dung với câu hỏi trước
                  khi chấm.
                </p>
                {submission.files.map((file, index) => (
                  <SubmissionFile
                    key={file.fileId}
                    id={file.fileId}
                    index={index}
                  />
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử phiên bản điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {history.map((grade) => (
                <p key={grade.id}>
                  Phiên bản {grade.revision} ·{" "}
                  {
                    STATUS_TEXT[
                      grade.id === current?.id ? current.status : grade.status
                    ]
                  }{" "}
                  · {grade.totalScore} / {maximum} điểm
                  {grade.publishedAt
                    ? ` · ${displayMoment(grade.publishedAt)}`
                    : ""}
                </p>
              ))}
              {!history.length && (
                <p className="text-muted-foreground">Chưa có bản chấm.</p>
              )}
            </CardContent>
          </Card>
        </section>
        <aside className="min-w-0 xl:sticky xl:top-20" aria-label="Chấm điểm">
          <Card>
            <CardHeader>
              <CardTitle>
                Chấm điểm · {Math.round(total * 100) / 100} / {maximum}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" noValidate onSubmit={submit}>
                <fieldset className="space-y-4" disabled={busy}>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !assignment.questions.every(
                          (question) => question.kind === "MULTIPLE_CHOICE",
                        )
                      }
                      onClick={() => begin("objective")}
                    >
                      Chấm trắc nghiệm tự động
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={aiBusy}
                      onClick={() => {
                        if (!lock.current) {
                          lock.current = true;
                          ai.mutate();
                        }
                      }}
                    >
                      {aiBusy ? "AI đang xử lý…" : "Gợi ý AI"}
                    </Button>
                    {submission.files.length > 0 && (
                      <p className="w-full text-xs text-muted-foreground">
                        Bài nộp có {submission.files.length} tệp đính kèm. AI sẽ đề xuất điểm dựa trên câu trả lời chữ và nhắc giáo viên kiểm tra tệp đính kèm.
                      </p>
                    )}
                  </div>
                  {!assignment.questions.every(
                    (question) => question.kind === "MULTIPLE_CHOICE",
                  ) && (
                    <p className="text-xs text-muted-foreground">
                      Chấm tự động toàn bài chỉ dành cho bài có toàn bộ câu trắc
                      nghiệm.
                    </p>
                  )}
                  {job.data?.submissionId === submission.id && (
                    <div className="space-y-2 rounded-xl border border-border p-3">
                      <Badge>{STATUS_TEXT[job.data.status]}</Badge>
                      {job.data.status === "FAILED" && (
                        <p role="alert" className="text-sm">
                          {gradingJobFailureMessage(job.data.error)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        AI chỉ đề xuất; giáo viên kiểm tra trước khi lưu hoặc
                        gửi.
                      </p>
                      {suggestions && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            assignment.questions.forEach((question, index) => {
                              const score = suggestions.find(
                                (item) => item.questionId === question.id,
                              );
                              if (score && question.kind === "ESSAY") {
                                form.setValue(
                                  `scores.${index}.score`,
                                  score.score,
                                  { shouldValidate: true, shouldDirty: true },
                                );
                                form.setValue(
                                  `scores.${index}.feedback`,
                                  score.feedback,
                                  { shouldValidate: true, shouldDirty: true },
                                );
                              }
                            });
                          }}
                        >
                          Dùng gợi ý cho câu tự luận
                        </Button>
                      )}
                    </div>
                  )}
                  {assignment.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="space-y-2 rounded-xl border border-border p-3"
                    >
                      <Label htmlFor={`grade-score-${index}`}>
                        Câu {index + 1} · Điểm tối đa {question.maxScore}
                      </Label>
                      {question.kind === "ESSAY" ? (
                        <Input
                          id={`grade-score-${index}`}
                          type="number"
                          min={0}
                          max={question.maxScore}
                          step="0.01"
                          {...form.register(`scores.${index}.score`, {
                            valueAsNumber: true,
                          })}
                        />
                      ) : (
                        <p className="rounded-xl bg-muted p-3 text-sm">
                          Kết quả trắc nghiệm: {scores?.[index]?.score ?? 0} /{" "}
                          {question.maxScore} điểm
                          {initial?.scores.some(
                            (item) => item.questionId === question.id,
                          )
                            ? " · Theo bản chấm đã lưu"
                            : " · Đối chiếu đáp án đúng"}
                        </p>
                      )}
                      {form.formState.errors.scores?.[index]?.score && (
                        <p role="alert" className="text-sm text-destructive">
                          {form.formState.errors.scores[index]?.score?.message}
                        </p>
                      )}
                      {question.kind === "ESSAY" && (
                        <>
                          <Label htmlFor={`grade-feedback-${index}`}>
                            Nhận xét câu {index + 1}
                          </Label>
                          <Textarea
                            id={`grade-feedback-${index}`}
                            {...form.register(`scores.${index}.feedback`)}
                          />
                        </>
                      )}
                      {form.formState.errors.scores?.[index]?.feedback && (
                        <p role="alert" className="text-sm text-destructive">
                          {
                            form.formState.errors.scores[index]?.feedback
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  ))}
                  <Label htmlFor="grade-feedback">Nhận xét chung</Label>
                  <Textarea
                    id="grade-feedback"
                    {...form.register("feedback")}
                  />
                  {form.formState.errors.feedback && (
                    <p role="alert" className="text-sm text-destructive">
                      {form.formState.errors.feedback.message}
                    </p>
                  )}
                  {latest &&
                    latest.revision !== baselineRevision &&
                    !sameGrade(form.getValues(), latest) && (
                      <p role="alert" className="text-sm text-destructive">
                        Có bản chấm mới ở phiên khác. Điểm đang nhập được giữ;
                        ghi lại thay đổi rồi tải lại trang để xem bản mới.
                      </p>
                    )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="submit" variant="outline">
                      Lưu nháp
                    </Button>
                    <Button type="button" onClick={() => void askSend()}>
                      Gửi điểm
                    </Button>
                  </div>
                </fieldset>
                <ApiFeedback error={action.error ?? ai.error ?? job.error} />
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
      <Dialog
        open={!!confirming}
        onOpenChange={(open) => {
          if (!open && !action.isPending) setConfirming(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi điểm cho phụ huynh?</DialogTitle>
            <DialogDescription>
              Điểm và nhận xét sẽ được lưu, duyệt và công bố. Nếu đã lưu bản
              chấm này, hệ thống tiếp tục từ bước còn lại.
            </DialogDescription>
          </DialogHeader>
          <p className="font-semibold">
            Tổng điểm{" "}
            {Math.round(
              (confirming?.scores.reduce((sum, item) => sum + item.score, 0) ??
                0) * 100,
            ) / 100}{" "}
            / {maximum}
          </p>
          <ApiFeedback error={action.error} />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={action.isPending}
              onClick={() => setConfirming(null)}
            >
              Kiểm tra lại
            </Button>
            <Button
              isLoading={action.isPending}
              onClick={() => {
                if (confirming) begin("send", confirming);
              }}
            >
              Xác nhận gửi điểm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!leaving}
        onOpenChange={(open) => {
          if (!open) setLeaving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rời bản chấm đang sửa?</DialogTitle>
            <DialogDescription>
              Thay đổi điểm và nhận xét chưa lưu sẽ bị bỏ. Bạn có thể ở lại để
              lưu nháp trước.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaving(null)}>
              Ở lại
            </Button>
            <Button
              onClick={() => {
                const href = leaving;
                setLeaving(null);
                if (href) router.push(href);
              }}
            >
              Rời trang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
