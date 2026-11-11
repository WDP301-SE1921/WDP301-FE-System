"use client";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { measuredLearningTargets } from "@/features/outcomes/rules";
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
import { CsvDownloadButton } from "@/components/shared/actions/csv-download-button";
import { assignmentCsv, assignmentCsvTemplate } from "../csv-export";
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
          data.data && (
            <div className="flex flex-wrap items-start gap-2">
              <CsvDownloadButton
                label="Tải mẫu CSV"
                createCsv={assignmentCsvTemplate}
                filename="bai-tap-mau"
              />
              <CsvDownloadButton
                createCsv={() => assignmentCsv(data.data!.assignment.questions)}
                filename={data.data.assignment.title}
                disabled={!data.data.assignment.questions.length}
              />
              {data.data.assignment.status === "DRAFT" && (
                <Button
                  variant="outline"
                  render={
                    <Link
                      href={ROUTES.TEACHER.ASSIGNMENT_EDIT(
                        data.data.assignment.id,
                      )}
                    />
                  }
                >
                  Sửa nháp
                </Button>
              )}
            </div>
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
  const measuredTargets = measuredLearningTargets(
    assignment.learningTargets,
    assignment.questions,
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
            {measuredTargets.length > 0 && (
              <section aria-label="Mục tiêu bài" className="space-y-2">
                <p className="font-medium">Mục tiêu bài (CLO)</p>
                <ul className="space-y-1 text-sm">
                  {measuredTargets.map((target) => (
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
          {assignment.status === "DRAFT" && eligible.length > 0 && (
            <PublishRecipients
              key={assignment.id}
              assignment={assignment}
              enrollments={eligible}
            />
          )}
          {assignment.status === "DRAFT" && eligible.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Giao bài cho học sinh</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Chưa có học sinh đang trong kỳ học để giao bài.</p>
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
  const selectedIds = useWatch({
    control: form.control,
    name: "enrollmentIds",
  });
  const confirmed = useWatch({ control: form.control, name: "confirmed" });
  const selectedCount = selectedIds.length;
  const allSelected = enrollments.every((item) =>
    selectedIds.includes(item.id),
  );
  const changeRecipients = (ids: string[]) => {
    form.setValue("enrollmentIds", ids, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
    // Confirmation applies to the reviewed recipients, not a later selection.
    form.setValue("confirmed", false, { shouldDirty: true });
  };
  return (
    <form
      aria-label="Giao bài cho học sinh"
      className="space-y-4"
      onSubmit={form.handleSubmit((value) =>
        action.mutate(() =>
          academicApi.publishAssignment(assignment.id, value),
        ),
      )}
    >
      <fieldset className="min-w-0 space-y-4" disabled={action.isPending}>
        <legend className="sr-only">
          Chọn người nhận và xác nhận giao bài
        </legend>
        <Card>
          <CardHeader>
            <CardTitle id="publish-students-title">
              Chọn học sinh nhận bài
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                id="publish-students-count"
                role="status"
                className="text-sm text-muted-foreground"
              >
                Đã chọn {selectedCount}/{enrollments.length} học sinh
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={action.isPending}
                onClick={() =>
                  changeRecipients(
                    allSelected ? [] : enrollments.map((item) => item.id),
                  )
                }
              >
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>
            </div>
            <fieldset
              aria-labelledby="publish-students-title"
              aria-describedby="publish-students-count"
              className="max-h-80 min-w-0 space-y-2 overflow-y-auto overscroll-contain"
            >
              <Controller
                name="enrollmentIds"
                control={form.control}
                render={({ field }) => (
                  <>
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-3 rounded-xl border border-border px-3"
                      >
                        <Checkbox
                          id={`recipient-${enrollment.id}`}
                          checked={field.value.includes(enrollment.id)}
                          disabled={action.isPending}
                          aria-invalid={!!form.formState.errors.enrollmentIds}
                          aria-describedby={
                            form.formState.errors.enrollmentIds
                              ? "publish-recipients-error"
                              : undefined
                          }
                          onCheckedChange={(checked) =>
                            changeRecipients(
                              checked
                                ? [...field.value, enrollment.id]
                                : field.value.filter(
                                    (id) => id !== enrollment.id,
                                  ),
                            )
                          }
                        />
                        <Label
                          className="min-h-11 flex-1 cursor-pointer py-3 leading-normal"
                          htmlFor={`recipient-${enrollment.id}`}
                        >
                          {enrollment.studentProfile?.fullName}
                        </Label>
                      </div>
                    ))}
                  </>
                )}
              />
            </fieldset>
            {form.formState.errors.enrollmentIds && (
              <p
                id="publish-recipients-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {form.formState.errors.enrollmentIds.message}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle id="publish-confirm-title">Xác nhận giao bài</CardTitle>
          </CardHeader>
          <CardContent>
            <section
              aria-labelledby="publish-confirm-title"
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {selectedCount > 0 ? (
                  <>
                    Bài tập sẽ được giao cho{" "}
                    <strong className="text-foreground">
                      {selectedCount} học sinh
                    </strong>{" "}
                    đã chọn ở trên.
                  </>
                ) : (
                  "Chọn ít nhất một học sinh ở danh sách phía trên để tiếp tục."
                )}
              </p>
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <Controller
                  name="confirmed"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="publish-recipients-confirm"
                      className="mt-0.5"
                      checked={field.value}
                      disabled={action.isPending || selectedCount === 0}
                      aria-invalid={!!form.formState.errors.confirmed}
                      aria-describedby={
                        form.formState.errors.confirmed
                          ? "publish-confirm-error"
                          : undefined
                      }
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label
                  className="cursor-pointer leading-normal"
                  htmlFor="publish-recipients-confirm"
                >
                  Tôi đã kiểm tra đề bài và danh sách học sinh nhận bài.
                </Label>
              </div>
              {form.formState.errors.confirmed && (
                <p
                  id="publish-confirm-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.confirmed.message}
                </p>
              )}
              <Button
                className="w-full"
                type="submit"
                isLoading={action.isPending}
                disabled={selectedCount === 0 || !confirmed}
              >
                {action.isPending ? "Đang giao…" : "Giao bài"}
              </Button>
            </section>
          </CardContent>
        </Card>
      </fieldset>
      <ApiFeedback error={action.error} />
    </form>
  );
}
