"use client";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { academicApi, currentEnrollmentClass } from "@/features/academic/api";
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
  localDateTimeSchema,
  recipientsSchema,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import type {
  AssignmentDetail,
  EnrollmentRecord,
  SubmissionRecord,
} from "@/types/academic-workflows";
import { TEST_TYPE_TEXT } from "../assessment-labels";
const publishSchema = recipientsSchema.extend({
  confirmed: confirmationSchema.shape.confirmed,
});
const windowSchema = z.object({
  dueAt: localDateTimeSchema,
  maxAttempts: z.coerce.number().int().min(1).max(10),
});
export function LiveAssignmentsView() {
  const assignments = useLiveQuery(["assignments"], (signal) =>
    academicApi.assignments(signal),
  );
  return (
    <PageContainer>
      <PageHeader title="Bài tập và đề kiểm tra" />
      <Button render={<Link href="/teacher/assignments/new" />}>
        Tạo bài tập / bài kiểm tra
      </Button>
      <AsyncBoundary
        isLoading={assignments.isPending}
        isError={assignments.isError}
        error={assignments.error}
        onRetry={() => void assignments.refetch()}
        data={assignments.data}
        emptyProps={{ title: "Chưa có bài tập" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.data?.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline">
                  {assignment.kind === "TEST"
                    ? assignment.testType
                      ? TEST_TYPE_TEXT[assignment.testType]
                      : "Bài kiểm tra"
                    : "Bài tập"}
                </Badge>
                {assignment.session && (
                  <p className="text-sm text-muted-foreground">
                    Buổi kiểm tra: {displayMoment(assignment.session.startsAt)}
                  </p>
                )}
                <p>Hạn nộp: {displayMoment(assignment.dueAt)}</p>
                <Badge>{STATUS_TEXT[assignment.status]}</Badge>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={`/teacher/assignments/${assignment.id}/submissions`}
                      />
                    }
                  >
                    Đề bài, giao bài và bài nộp
                  </Button>
                  {assignment.status === "DRAFT" && (
                    <Button
                      variant="outline"
                      render={
                        <Link
                          href={`/teacher/assignments/${assignment.id}/edit`}
                        />
                      }
                    >
                      Sửa nháp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
export function LiveAssignmentSubmissions({ id }: { id: string }) {
  const data = useLiveQuery(["assignment-workspace", id], async (signal) => {
    const [assignment, submissions, enrollments] = await Promise.all([
      academicApi.assignment(id, signal),
      academicApi.submissions(id, signal),
      academicApi.enrollments(signal),
    ]);
    return { assignment, submissions, enrollments };
  });
  return (
    <PageContainer>
      <PageHeader title={data.data?.assignment.title ?? "Bài tập và bài nộp"} />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && <AssignmentWorkspace {...data.data} />}
      </AsyncBoundary>
    </PageContainer>
  );
}
function AssignmentWorkspace({
  assignment,
  submissions,
  enrollments,
}: {
  assignment: AssignmentDetail;
  submissions: SubmissionRecord[];
  enrollments: EnrollmentRecord[];
}) {
  const today = todayInVietnam();
  const eligible = enrollments.filter(
    (item) =>
      currentEnrollmentClass(item) === assignment.classId &&
      item.status === "ACTIVE" &&
      item.studentProfile &&
      item.startDate &&
      item.endDate &&
      item.startDate.slice(0, 10) <= today &&
      item.endDate.slice(0, 10) > today,
  );
  const recipients = new Map(
    assignment.recipients.map((item) => [
      item.id,
      enrollments.find((enrollment) => enrollment.id === item.enrollmentId)
        ?.studentProfile?.fullName ?? "Học sinh được giao bài",
    ]),
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Đề bài</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge>{STATUS_TEXT[assignment.status]}</Badge>
          <p>
            Hạn nộp {displayMoment(assignment.dueAt)} · tối đa{" "}
            {assignment.maxAttempts} lần
          </p>
          <p className="whitespace-pre-wrap">{assignment.instructions}</p>
          {assignment.questions.map((question, index) => (
            <div
              key={question.id}
              className="space-y-2 rounded-2xl border border-border p-4"
            >
              <p className="font-medium">
                Câu {index + 1} · {question.maxScore} điểm
              </p>
              <p className="whitespace-pre-wrap">{question.prompt}</p>
              {question.choices?.map((choice) => (
                <p key={choice}>{choice}</p>
              ))}
              {question.correctAnswer && (
                <p>Đáp án: {question.correctAnswer}</p>
              )}
              {question.rubric && (
                <p className="whitespace-pre-wrap">
                  Tiêu chí chấm: {question.rubric}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      {assignment.status === "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle>Giao bài cho học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            {eligible.length ? (
              <PublishRecipients
                key={assignment.id}
                assignment={assignment}
                enrollments={eligible}
              />
            ) : (
              <p>Chưa có học sinh đang trong kỳ học để giao bài.</p>
            )}
          </CardContent>
        </Card>
      )}
      {assignment.status === "PUBLISHED" && (
        <Card>
          <CardHeader>
            <CardTitle>Đóng nhận bài</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={confirmationSchema}
              defaults={{ confirmed: false }}
              fields={[
                {
                  name: "confirmed",
                  label: "Xác nhận đóng nhận bài của học sinh",
                  type: "checkbox",
                },
              ]}
              submitLabel="Đóng nhận bài"
              onSubmit={() => academicApi.closeAssignment(assignment.id)}
            />
          </CardContent>
        </Card>
      )}
      {assignment.status !== "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle>Gia hạn / mở lại nhận bài</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={windowSchema}
              defaults={{ maxAttempts: assignment.maxAttempts }}
              fields={[
                {
                  name: "dueAt",
                  label: "Hạn nộp mới (giờ Việt Nam)",
                  type: "datetime-local",
                },
                {
                  name: "maxAttempts",
                  label: "Số lần nộp tối đa",
                  type: "number",
                },
              ]}
              submitLabel="Mở lại nhận bài"
              onSubmit={(value) =>
                academicApi.reopenAssignment(assignment.id, {
                  ...value,
                  dueAt: vietnamDateTime(String(value.dueAt)),
                })
              }
            />
          </CardContent>
        </Card>
      )}
      {assignment.status === "CLOSED" && (
        <Card>
          <CardHeader>
            <CardTitle>Công bố đáp án</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiForm
              schema={confirmationSchema}
              defaults={{ confirmed: false }}
              fields={[
                {
                  name: "confirmed",
                  label:
                    "Tôi xác nhận cho phụ huynh xem đáp án đúng. Sau công bố không thể mở lại nhận bài.",
                  type: "checkbox",
                },
              ]}
              submitLabel="Công bố đáp án"
              onSubmit={() => academicApi.publishAnswers(assignment.id)}
            />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Bài nộp ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="space-y-3 rounded-2xl border border-border p-4"
            >
              <p className="font-medium">
                {recipients.get(submission.recipientId) ?? "Học sinh"} · lần{" "}
                {submission.attemptNo}
              </p>
              <p>{displayMoment(submission.submittedAt)}</p>
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
                  Xem bài và chấm
                </Button>
              </div>
            </div>
          ))}
          {!submissions.length && <p>Chưa có bài nộp.</p>}
        </CardContent>
      </Card>
    </>
  );
}
function PublishRecipients({
  assignment,
  enrollments,
}: {
  assignment: AssignmentDetail;
  enrollments: EnrollmentRecord[];
}) {
  const action = useLiveCommand();
  const form = useForm<z.infer<typeof publishSchema>>({
    resolver: zodResolver(publishSchema),
    defaultValues: { enrollmentIds: [], confirmed: false },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((value) =>
        action.mutate(() =>
          academicApi.publishAssignment(assignment.id, value),
        ),
      )}
    >
      <fieldset className="space-y-3" disabled={action.isPending}>
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="flex items-center gap-3">
            <Controller
              name="enrollmentIds"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id={`recipient-${enrollment.id}`}
                  checked={field.value.includes(enrollment.id)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked
                        ? [...field.value, enrollment.id]
                        : field.value.filter((id) => id !== enrollment.id),
                    )
                  }
                />
              )}
            />
            <Label htmlFor={`recipient-${enrollment.id}`}>
              {enrollment.studentProfile?.fullName}
            </Label>
          </div>
        ))}
        {form.formState.errors.enrollmentIds && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.enrollmentIds.message}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Controller
            name="confirmed"
            control={form.control}
            render={({ field }) => (
              <Checkbox
                id="publish-recipients-confirm"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="publish-recipients-confirm">
            Tôi đã kiểm tra đề bài và các học sinh được giao.
          </Label>
        </div>
        {form.formState.errors.confirmed && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.confirmed.message}
          </p>
        )}
        <Button type="submit">
          {action.isPending ? "Đang giao…" : "Giao bài"}
        </Button>
      </fieldset>
      <ApiFeedback error={action.error} />
    </form>
  );
}
