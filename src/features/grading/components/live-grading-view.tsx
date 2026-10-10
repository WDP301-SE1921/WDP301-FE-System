"use client";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseAsString, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  academicApi,
  findSubmission,
  teacherSubmissionQueue,
} from "@/features/academic/api";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  confirmationSchema,
  gradeSchema,
} from "@/lib/validators/web-workflows";
import type {
  AssignmentDetail,
  GradeScore,
  SubmissionRecord,
} from "@/types/academic-workflows";
const gradeFormSchema = z.object({
  scores: z
    .array(
      z.object({
        questionId: z.string(),
        score: z.number().min(0).max(100),
        feedback: z.string().max(5000),
      }),
    )
    .min(1),
  feedback: gradeSchema.shape.feedback,
  confirmed: confirmationSchema.shape.confirmed,
});

export function LiveGradingQueue() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const queue = useLiveQuery(["grading-queue"], async (signal) => {
    const [rows, enrollments] = await Promise.all([
      teacherSubmissionQueue(signal),
      academicApi.enrollments(signal),
    ]);
    return rows.map(({ assignment, submission }) => {
      const recipient = assignment.recipients.find(
        (item) => item.id === submission.recipientId,
      );
      return {
        assignment,
        submission,
        studentName:
          enrollments.find((item) => item.id === recipient?.enrollmentId)
            ?.studentProfile?.fullName ?? "Học sinh được giao bài",
      };
    });
  });
  const rows = queue.data?.filter(
    (row) =>
      status === "all" ||
      (status === "ungraded"
        ? !row.submission.grades.length
        : row.submission.grades[0]?.status === status),
  );
  return (
    <PageContainer>
      <PageHeader title="Bài nộp và chấm bài" />
      <div className="flex flex-wrap gap-3">
        {[
          ["all", "Tất cả"],
          ["ungraded", "Chưa chấm"],
          ["DRAFT", "Chờ duyệt"],
          ["APPROVED", "Chờ công bố"],
          ["PUBLISHED", "Đã công bố"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={status === value ? "default" : "outline"}
            onClick={() => void setStatus(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <AsyncBoundary
        isLoading={queue.isPending}
        isError={queue.isError}
        error={queue.error}
        onRetry={() => void queue.refetch()}
        data={rows}
        emptyProps={{ title: "Không có bài nộp trong nhóm này" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {rows?.map(({ assignment, submission, studentName }) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>
                  {studentName} · {assignment.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Lần nộp {submission.attemptNo} ·{" "}
                  {displayMoment(submission.submittedAt)}
                </p>
                <Badge>
                  {submission.grades[0]
                    ? STATUS_TEXT[submission.grades[0].status]
                    : "Chưa chấm"}
                </Badge>
                <div>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={`/teacher/grading/${submission.id}?assignmentId=${assignment.id}`}
                      />
                    }
                  >
                    Xem và chấm bài
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
export function LiveGradingDetail({ submissionId }: { submissionId: string }) {
  const [assignmentId] = useQueryState(
    "assignmentId",
    parseAsString.withDefault(""),
  );
  const [jobId, setJobId] = useQueryState(
    "jobId",
    parseAsString.withDefault(""),
  );
  const data = useLiveQuery(
    ["grading-detail", submissionId, assignmentId],
    (signal) => findSubmission(submissionId, assignmentId || undefined, signal),
  );
  const ai = useLiveCommand();
  const objective = useLiveCommand();
  const job = useLiveQuery(
    ["grading-job", jobId],
    (signal) => academicApi.gradingJob(jobId, signal),
    !!jobId && !!data.data,
    (value) =>
      value.submissionId === submissionId &&
      (value.status === "QUEUED" || value.status === "PROCESSING"),
  );
  const latest = data.data?.submission.grades[0];
  return (
    <PageContainer>
      <PageHeader
        title={
          data.data ? `Chấm bài · ${data.data.assignment.title}` : "Chấm bài"
        }
        description="Kết quả AI là đề xuất. Kiểm tra, lưu bản chấm, duyệt rồi công bố cho phụ huynh."
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  Bài làm · lần {data.data.submission.attemptNo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{displayMoment(data.data.submission.submittedAt)}</p>
                {data.data.assignment.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="space-y-2 rounded-2xl border border-border p-4"
                  >
                    <p className="font-medium">
                      Câu {index + 1} · {question.maxScore} điểm
                    </p>
                    <p className="whitespace-pre-wrap">{question.prompt}</p>
                    <p className="whitespace-pre-wrap">
                      Bài làm:{" "}
                      {data.data!.submission.answers.find(
                        (answer) => answer.questionId === question.id,
                      )?.answer ?? "Chưa có câu trả lời"}
                    </p>
                    {question.correctAnswer && (
                      <p>Đáp án: {question.correctAnswer}</p>
                    )}
                    {question.rubric && (
                      <p className="whitespace-pre-wrap">
                        Tiêu chí: {question.rubric}
                      </p>
                    )}
                  </div>
                ))}
                {data.data.submission.files.map((file) => (
                  <SignedFileButton key={file.fileId} id={file.fileId} />
                ))}
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={
                  objective.isPending ||
                  !data.data.assignment.questions.every(
                    (question) => question.kind === "MULTIPLE_CHOICE",
                  )
                }
                onClick={() =>
                  objective.mutate(() =>
                    academicApi.gradeObjective(submissionId),
                  )
                }
              >
                {objective.isPending ? "Đang chấm…" : "Chấm trắc nghiệm"}
              </Button>
              <Button
                variant="outline"
                disabled={
                  ai.isPending ||
                  data.data.submission.files.length > 0 ||
                  job.data?.status === "QUEUED" ||
                  job.data?.status === "PROCESSING"
                }
                onClick={() =>
                  ai.mutate(async () => {
                    const result = await academicApi.gradeAi(submissionId);
                    await setJobId(result.id);
                    return result;
                  })
                }
              >
                {ai.isPending ? "Đang gửi…" : "Yêu cầu AI đề xuất điểm"}
              </Button>
            </div>
            <ApiFeedback error={objective.error ?? ai.error ?? job.error} />
            {job.data?.submissionId === submissionId && (
              <Card>
                <CardContent className="space-y-2 pt-6">
                  <Badge>{STATUS_TEXT[job.data.status]}</Badge>
                  {job.data.error && <p role="alert">{job.data.error}</p>}
                  <p className="text-sm text-muted-foreground">
                    Đề xuất không được tự lưu hoặc công bố thành điểm.
                  </p>
                </CardContent>
              </Card>
            )}
            <GradeEditor
              key={`${submissionId}-${latest?.id ?? "new"}`}
              assignment={data.data.assignment}
              submission={data.data.submission}
              suggestions={
                job.data?.submissionId === submissionId &&
                job.data.status === "SUCCEEDED"
                  ? job.data.result?.scores
                  : undefined
              }
            />
            {latest && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Phiên bản điểm {latest.revision} ·{" "}
                    {STATUS_TEXT[latest.status]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    {latest.totalScore} /{" "}
                    {data.data.assignment.questions.reduce(
                      (sum, question) => sum + question.maxScore,
                      0,
                    )}{" "}
                    điểm
                  </p>
                  <p className="whitespace-pre-wrap">{latest.feedback}</p>
                  {latest.status === "DRAFT" && (
                    <ApiForm
                      schema={confirmationSchema}
                      defaults={{ confirmed: false }}
                      fields={[
                        {
                          name: "confirmed",
                          label:
                            "Tôi đã kiểm tra từng câu và xác nhận duyệt bản chấm này.",
                          type: "checkbox",
                        },
                      ]}
                      submitLabel="Duyệt điểm"
                      onSubmit={() => academicApi.approveGrade(latest.id)}
                    />
                  )}
                  {latest.status === "APPROVED" && (
                    <ApiForm
                      schema={confirmationSchema}
                      defaults={{ confirmed: false }}
                      fields={[
                        {
                          name: "confirmed",
                          label: "Xác nhận công bố điểm cho phụ huynh/học sinh",
                          type: "checkbox",
                        },
                      ]}
                      submitLabel="Công bố điểm"
                      onSubmit={() => academicApi.publishGrade(latest.id)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử phiên bản điểm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.data.submission.grades.map((grade) => (
                  <p key={grade.id}>
                    Phiên bản {grade.revision} · {STATUS_TEXT[grade.status]} ·{" "}
                    {grade.totalScore} điểm
                    {grade.publishedAt
                      ? ` · ${displayMoment(grade.publishedAt)}`
                      : ""}
                  </p>
                ))}
                {!data.data.submission.grades.length && (
                  <p>Chưa có bản chấm.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
function GradeEditor({
  assignment,
  submission,
  suggestions,
}: {
  assignment: AssignmentDetail;
  submission: SubmissionRecord;
  suggestions?: GradeScore[];
}) {
  const latest = submission.grades[0];
  const action = useLiveCommand();
  const form = useForm<z.infer<typeof gradeFormSchema>>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      scores: assignment.questions.map((question) => ({
        questionId: question.id,
        score:
          latest?.scores.find((score) => score.questionId === question.id)
            ?.score ?? 0,
        feedback:
          latest?.scores.find((score) => score.questionId === question.id)
            ?.feedback ?? "",
      })),
      feedback: latest?.feedback ?? "",
      confirmed: false,
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kiểm tra và lưu bản chấm</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((value) => {
            const invalid = value.scores.some(
              (score) =>
                score.score >
                (assignment.questions.find(
                  (question) => question.id === score.questionId,
                )?.maxScore ?? -1),
            );
            if (invalid) {
              value.scores.forEach((score, index) => {
                if (score.score > assignment.questions[index].maxScore)
                  form.setError(`scores.${index}.score`, {
                    message: "Điểm vượt điểm tối đa của câu.",
                  });
              });
              return;
            }
            action.mutate(() => academicApi.grade(submission.id, value));
          })}
        >
          <fieldset className="space-y-4" disabled={action.isPending}>
            {suggestions && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  assignment.questions.forEach((question, index) => {
                    const proposed = suggestions.find(
                      (score) => score.questionId === question.id,
                    );
                    if (proposed) {
                      form.setValue(`scores.${index}.score`, proposed.score, {
                        shouldValidate: true,
                      });
                      form.setValue(
                        `scores.${index}.feedback`,
                        proposed.feedback,
                      );
                    }
                  });
                  form.setValue("confirmed", false);
                }}
              >
                Đưa đề xuất AI vào bản chấm để kiểm tra
              </Button>
            )}
            {assignment.questions.map((question, index) => (
              <div
                key={question.id}
                className="space-y-2 rounded-2xl border border-border p-4"
              >
                <Label htmlFor={`grade-score-${index}`}>
                  Câu {index + 1} · Điểm tối đa {question.maxScore}
                </Label>
                <Input
                  id={`grade-score-${index}`}
                  type="number"
                  step="0.01"
                  {...form.register(`scores.${index}.score`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.scores?.[index]?.score && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.scores[index]?.score?.message}
                  </p>
                )}
                <Label htmlFor={`grade-feedback-${index}`}>
                  Nhận xét câu {index + 1}
                </Label>
                <Textarea
                  id={`grade-feedback-${index}`}
                  {...form.register(`scores.${index}.feedback`)}
                />
                {form.formState.errors.scores?.[index]?.feedback && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.scores[index]?.feedback?.message}
                  </p>
                )}
              </div>
            ))}
            <Label htmlFor="grade-feedback">Nhận xét chung</Label>
            <Textarea id="grade-feedback" {...form.register("feedback")} />
            {form.formState.errors.feedback && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.feedback.message}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Controller
                name="confirmed"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="grade-reviewed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="grade-reviewed">
                Tôi đã kiểm tra điểm và nhận xét từng câu.
              </Label>
            </div>
            {form.formState.errors.confirmed && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.confirmed.message}
              </p>
            )}
            <Button type="submit">
              {action.isPending ? "Đang lưu…" : "Lưu bản chấm nháp"}
            </Button>
          </fieldset>
          <ApiFeedback error={action.error} />
        </form>
      </CardContent>
    </Card>
  );
}
function SignedFileButton({ id }: { id: string }) {
  const action = useMutation({
    mutationFn: async () => {
      const file = await academicApi.file(id);
      const url = new URL(file.url);
      if (!["https:", "http:"].includes(url.protocol))
        throw new Error("Đường dẫn file không hợp lệ.");
      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    },
  });
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={action.isPending}
        onClick={() => action.mutate()}
      >
        Tải file bài làm
      </Button>
      <ApiFeedback error={action.error} />
    </div>
  );
}
