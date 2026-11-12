"use client";
import { SubmissionFile } from "@/features/grading/components/submission-file";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { parseAsStringLiteral, useQueryStates } from "nuqs";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateTimeInput } from "@/components/shared/pickers/date-time-input";
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
} from "@/lib/validators/web-workflows";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import type {
  AssignmentDetail,
  EnrollmentRecord,
  SubmissionRecord,
  SupplementalAssignmentResult,
} from "@/types/academic-workflows";
import { ROUTES } from "@/constants/routes";
import { FlowSteps } from "@/components/shared/workflows/flow-steps";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
  ASSIGNMENT_STEP_KEYS,
  assignmentSteps,
  defaultAssignmentStep,
  type AssignmentStepKey,
} from "../assignment-steps";
import { latestSubmissions, submissionSummary } from "../submission-selectors";
import {
  CollectPanel,
  GradePanel,
  ReturnPanel,
} from "./assignment-step-panels";
import { AssignmentsTable } from "./assignments-table";
import { AssignmentSubmissionsTable } from "./assignment-submissions-table";
import { CsvDownloadButton } from "@/components/shared/actions/csv-download-button";
import { assignmentCsv, assignmentCsvTemplate } from "../csv-export";
const publishSchema = recipientsSchema.extend({
  confirmed: confirmationSchema.shape.confirmed,
});
const supplementalFormSchema = recipientsSchema.extend({
  enrollmentIds: recipientsSchema.shape.enrollmentIds.max(100),
  dueAt: localDateTimeSchema.refine(
    (value) => Date.parse(`${value}:00+07:00`) > Date.now(),
    "Hạn nộp phải ở tương lai.",
  ),
});

function tomorrowDeadline() {
  const vietnam = new Date(Date.now() + 7 * 60 * 60 * 1000);
  vietnam.setUTCDate(vietnam.getUTCDate() + 1);
  return `${vietnam.toISOString().slice(0, 10)}T23:59`;
}
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
  const now = useCurrentTime();
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
  const summary = submissionSummary(assignment, submissions);
  const recipientIds = new Set(assignment.recipients.map((item) => item.id));
  const latest = [...latestSubmissions(submissions).values()].filter((item) =>
    recipientIds.has(item.recipientId),
  );
  const steps = assignmentSteps({
    status: assignment.status,
    dueAt: assignment.dueAt,
    answersPublishedAt: assignment.answersPublishedAt,
    questionCount: assignment.questions.length,
    summary,
    now,
  });
  const [{ step: chosen }, setChosen] = useQueryStates({
    step: parseAsStringLiteral(ASSIGNMENT_STEP_KEYS),
  });
  // Bước người dùng bấm chọn; không chọn (hoặc bước chưa tới) thì mở bước đang làm.
  const active =
    steps.find((item) => item.key === chosen && item.status !== "todo")?.key ??
    defaultAssignmentStep(steps);
  const go = (key: AssignmentStepKey | null) => void setChosen({ step: key });
  const isOverdue = now >= Date.parse(assignment.dueAt);
  const isDraft = assignment.status === "DRAFT";
  const hasQuestions = assignment.questions.length > 0;
  const questionsCard = (
    <QuestionsCard assignment={assignment} measuredTargets={measuredTargets} />
  );
  const recipientNames = assignment.recipients.map(
    (recipient) =>
      enrollments.find((item) => item.id === recipient.enrollmentId)
        ?.studentProfile?.fullName ?? "Học sinh được giao bài",
  );
  const afterSubmissions =
    active === "collect" || active === "grade" || active === "return";
  return (
    <div className="min-w-0 space-y-6">
      <FlowSteps
        steps={steps}
        activeKey={active}
        onSelect={(key) => go(key as AssignmentStepKey)}
        label="Các bước của bài tập"
      />
      {assignment.canAssignSupplemental && (
        <SupplementalRecipientsCard assignment={assignment} />
      )}
      {assignment.status === "CLOSED" &&
        (assignment.activeSupplementalRecipientCount ?? 0) > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent>
              <p className="font-medium">
                Đợt chung đã đóng — còn{" "}
                {assignment.activeSupplementalRecipientCount} học sinh được nộp
                bổ sung.
              </p>
            </CardContent>
          </Card>
        )}
      {active === "compose" && (
        <div className="space-y-4">
          {isDraft && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  {hasQuestions
                    ? `Đề có ${assignment.questions.length} câu. Kiểm tra lại đề rồi giao cho học sinh.`
                    : "Đề chưa có câu hỏi. Thêm câu hỏi trước khi giao bài."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={hasQuestions ? "outline" : "default"}
                    render={
                      <Link
                        href={ROUTES.TEACHER.ASSIGNMENT_EDIT(assignment.id)}
                      />
                    }
                  >
                    Sửa đề
                  </Button>
                  {hasQuestions && (
                    <Button type="button" onClick={() => go("assign")}>
                      Tiếp: giao bài
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {questionsCard}
        </div>
      )}
      {active === "assign" &&
        (isDraft ? (
          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            {questionsCard}
            <div className="min-w-0 space-y-6">
              {eligible.length > 0 ? (
                <PublishRecipients
                  key={assignment.id}
                  assignment={assignment}
                  enrollments={eligible}
                  onPublished={() => go(null)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Giao bài cho học sinh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Chưa có học sinh đang trong kỳ học để giao bài.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Đã giao bài cho {assignment.recipients.length} học sinh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Học sinh nhận bài trên ứng dụng của phụ huynh. Hạn nộp{" "}
                {displayMoment(assignment.dueAt)}.
              </p>
              <ul className="flex flex-wrap gap-2 text-sm">
                {recipientNames.map((name, index) => (
                  <li key={index}>
                    <Badge variant="outline">{name}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      {active === "collect" && (
        <CollectPanel
          assignment={assignment}
          summary={summary}
          isOverdue={isOverdue}
          onGoGrade={() => go("grade")}
          onDone={() => go(null)}
        />
      )}
      {active === "grade" && (
        <GradePanel
          assignment={assignment}
          latest={latest}
          summary={summary}
          onGoReturn={() => go("return")}
        />
      )}
      {active === "return" && (
        <ReturnPanel
          assignment={assignment}
          latest={latest}
          summary={summary}
          isOverdue={isOverdue}
          onGoGrade={() => go("grade")}
          onDone={() => go(null)}
        />
      )}
      {afterSubmissions && (
        <>
          <AssignmentSubmissionsTable
            assignment={assignment}
            submissions={submissions}
            enrollments={enrollments}
          />
          <details className="rounded-2xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Xem đề bài
            </summary>
            <div className="pt-4">{questionsCard}</div>
          </details>
        </>
      )}
    </div>
  );
}

function SupplementalRecipientsCard({
  assignment,
}: {
  assignment: AssignmentDetail;
}) {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<SupplementalAssignmentResult | null>(
    null,
  );
  const eligibility = useLiveQuery(
    ["assignment-eligible-recipients", assignment.id],
    (signal) => academicApi.eligibleAssignmentRecipients(assignment.id, signal),
    assignment.canAssignSupplemental === true,
  );
  const action = useLiveCommand();
  const form = useForm<z.infer<typeof supplementalFormSchema>>({
    resolver: zodResolver(supplementalFormSchema),
    defaultValues: { enrollmentIds: [], dueAt: tomorrowDeadline() },
  });
  const selectedIds = useWatch({
    control: form.control,
    name: "enrollmentIds",
  });
  const students = eligibility.data?.items ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase("vi");
  const visibleStudents = normalizedSearch
    ? students.filter((student) =>
        student.fullName.toLocaleLowerCase("vi").includes(normalizedSearch),
      )
    : students;

  const setRecipients = (ids: string[]) =>
    form.setValue("enrollmentIds", ids, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle>Giao bổ sung cho học sinh mới</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((value) =>
            action.mutate(
              () =>
                academicApi.addAssignmentRecipients(assignment.id, {
                  enrollmentIds: value.enrollmentIds,
                  dueAt: new Date(`${value.dueAt}:00+07:00`).toISOString(),
                }),
              {
                onSuccess: (data) => {
                  setResult(data as SupplementalAssignmentResult);
                  form.reset({
                    enrollmentIds: [],
                    dueAt: tomorrowDeadline(),
                  });
                },
              },
            ),
          )}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="space-y-3">
              <Label htmlFor="supplemental-search">
                Tìm học sinh chưa nhận bài
              </Label>
              <Input
                id="supplemental-search"
                type="search"
                value={search}
                placeholder="Nhập tên học sinh"
                disabled={action.isPending || eligibility.isPending}
                onChange={(event) => setSearch(event.target.value)}
              />
              {eligibility.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Đang tải danh sách…
                </p>
              ) : students.length === 0 ? (
                <p className="rounded-xl bg-muted/50 p-3 text-sm">
                  Hiện chưa có học sinh mới đủ điều kiện nhận bài.
                </p>
              ) : (
                <fieldset className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border p-2">
                  <legend className="sr-only">
                    Chọn học sinh nhận bài bổ sung
                  </legend>
                  {visibleStudents.map((student) => (
                    <div
                      key={student.enrollmentId}
                      className="flex items-center gap-3 rounded-xl px-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`supplemental-${student.enrollmentId}`}
                        checked={selectedIds.includes(student.enrollmentId)}
                        disabled={action.isPending}
                        onCheckedChange={(checked) =>
                          setRecipients(
                            checked
                              ? [...selectedIds, student.enrollmentId]
                              : selectedIds.filter(
                                  (id) => id !== student.enrollmentId,
                                ),
                          )
                        }
                      />
                      <Label
                        htmlFor={`supplemental-${student.enrollmentId}`}
                        className="min-h-11 flex-1 cursor-pointer py-3"
                      >
                        {student.fullName}
                      </Label>
                    </div>
                  ))}
                  {visibleStudents.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      Không tìm thấy học sinh phù hợp.
                    </p>
                  )}
                </fieldset>
              )}
              {form.formState.errors.enrollmentIds && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.enrollmentIds.message}
                </p>
              )}
            </div>
            <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
              <div className="space-y-2">
                <Label htmlFor="supplemental-due-at">
                  Hạn nộp riêng (giờ Việt Nam)
                </Label>
                <Controller
                  name="dueAt"
                  control={form.control}
                  render={({ field }) => (
                    <DateTimeInput
                      id="supplemental-due-at"
                      value={field.value}
                      onChange={field.onChange}
                      defaultTime="23:59"
                      disabled={action.isPending}
                      invalid={!!form.formState.errors.dueAt}
                    />
                  )}
                />
                {form.formState.errors.dueAt && (
                  <p className="text-sm text-destructive" role="alert">
                    {form.formState.errors.dueAt.message}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Đã chọn{" "}
                <strong className="text-foreground">
                  {selectedIds.length}
                </strong>{" "}
                học sinh. Hạn này chỉ áp dụng cho các em được giao bổ sung.
              </p>
              <Button
                className="w-full"
                type="submit"
                isLoading={action.isPending}
                disabled={!selectedIds.length || action.isPending}
              >
                {action.isPending ? "Đang giao…" : "Giao bổ sung"}
              </Button>
            </div>
          </div>
          {result && (
            <p className="rounded-xl bg-primary/10 p-3 text-sm" role="status">
              Đã giao bổ sung cho {result.addedRecipients.length} học sinh
              {result.skippedEnrollmentIds.length
                ? `; bỏ qua ${result.skippedEnrollmentIds.length} học sinh đã nhận bài.`
                : "."}
            </p>
          )}
          <ApiFeedback error={eligibility.error ?? action.error} />
        </form>
      </CardContent>
    </Card>
  );
}

function QuestionsCard({
  assignment,
  measuredTargets,
}: {
  assignment: AssignmentDetail;
  measuredTargets: ReturnType<typeof measuredLearningTargets>;
}) {
  return (
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
        {assignment.files?.map((f, i) => (
          <section key={f.fileId} className="space-y-2">
            <p>
              {f.file?.name} ·{" "}
              {f.teacherOnly ? "Chỉ giáo viên" : "Học sinh được xem"}
            </p>
            <SubmissionFile id={f.fileId} index={i} />
          </section>
        ))}
        {measuredTargets.length > 0 && (
          <section aria-label="Mục tiêu bài" className="space-y-2">
            <p className="font-medium">Mục tiêu bài</p>
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
                Mục tiêu{" "}
                {assignment.learningTargets?.find(
                  (target) => target.id === question.outcomeId,
                )?.code ?? ""}
              </Badge>
            )}
            <p className="whitespace-pre-wrap">{question.prompt}</p>
            {question.choices?.map((choice) => (
              <p key={choice}>{choice}</p>
            ))}
            {question.correctAnswer && <p>Đáp án: {question.correctAnswer}</p>}
            {question.criteria?.map((c) => (
              <p key={c.id} className="text-sm">
                {c.title} · {c.maxScore} điểm — {c.description}
              </p>
            ))}
            {question.rubric && (
              <p className="whitespace-pre-wrap">
                Tiêu chí chấm: {question.rubric}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PublishRecipients({
  assignment,
  enrollments,
  onPublished,
}: {
  assignment: AssignmentDetail;
  enrollments: EnrollmentRecord[];
  /** Giao xong: trang tự sang bước "Học sinh làm bài". */
  onPublished: () => void;
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
        action.mutate(
          () => academicApi.publishAssignment(assignment.id, value),
          { onSuccess: onPublished },
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
