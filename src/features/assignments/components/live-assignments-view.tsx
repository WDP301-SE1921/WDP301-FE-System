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
import { ROUTES } from "@/constants/routes";
import { AssignmentsTable } from "./assignments-table";
import { AssignmentSubmissionsTable } from "./assignment-submissions-table";
const publishSchema = recipientsSchema.extend({
  confirmed: confirmationSchema.shape.confirmed,
});
const windowSchema = z.object({
  dueAt: localDateTimeSchema,
  maxAttempts: z.coerce.number().int().min(1).max(10),
});
/** Danh sách bài tập của giáo viên (bảng có lọc `?filter=`). */
export function LiveAssignmentsView() {
  return <AssignmentsTable />;
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
      <PageHeader
        title={data.data?.assignment.title ?? "Bài tập và bài nộp"}
        breadcrumbs={[
          { label: "Bài tập & chấm bài", href: ROUTES.TEACHER.ASSIGNMENTS },
          { label: data.data?.assignment.title ?? "Bài nộp" },
        ]}
        description={
          data.data
            ? `${STATUS_TEXT[data.data.assignment.status]} · hạn nộp ${displayMoment(data.data.assignment.dueAt)} · tối đa ${data.data.assignment.maxAttempts} lần nộp`
            : undefined
        }
        actions={
          data.data?.assignment.status === "DRAFT" && (
            <Button
              variant="outline"
              render={
                <Link href={ROUTES.TEACHER.ASSIGNMENT_EDIT(data.data.assignment.id)} />
              }
            >
              Sửa nháp
            </Button>
          )
        }
      />
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
  return (
    <>
      {assignment.status !== "DRAFT" && (
        <AssignmentSubmissionsTable
          assignment={assignment}
          submissions={submissions}
          enrollments={enrollments}
        />
      )}
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
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
            {!!assignment.learningTargets?.length && (
              <section aria-label="Mục tiêu bài" className="space-y-2">
                <p className="font-medium">Mục tiêu bài (CLO)</p>
                <ul className="space-y-1 text-sm">
                  {assignment.learningTargets.map((target) => (
                    <li key={target.id}>
                      <span className="font-medium">{target.code}</span> ·{" "}
                      {target.title}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {assignment.questions.map((question, index) => (
              <div
                key={question.id}
                className="space-y-2 rounded-2xl border border-border p-4"
              >
                <p className="font-medium">
                  Câu {index + 1} · {question.maxScore} điểm
                </p>
                {question.outcomeId && (
                  <Badge variant="outline">
                    CLO{" "}
                    {assignment.learningTargets?.find(
                      (target) => target.id === question.outcomeId,
                    )?.code ?? ""}
                  </Badge>
                )}
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
        <div className="min-w-0 space-y-6">
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
        </div>
      </div>
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
