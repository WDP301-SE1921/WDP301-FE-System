"use client";
import { useState } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useUnsavedChanges } from "@/components/shared/feedback/unsaved-changes-guard";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { FieldError } from "@/components/shared/feedback/api-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import { LiveSelect } from "@/features/academic/components/live-fields";
import { academicApi } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import {
  assignmentEditorSchema,
  localDateTime,
  toQuestionPayload,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import type { AssignmentDetail } from "@/types/academic-workflows";
import type { RegistrationClass } from "@/types/backend";
import { useCurrentUser } from "@/hooks/use-current-role";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import { displayMoment } from "@/features/academic/components/live-fields";
import { AssignmentImportDialog } from "./assignment-import-dialog";
import { TEST_TYPE_TEXT } from "../assessment-labels";
import { ROUTES } from "@/constants/routes";
type AssignmentInput = z.infer<typeof assignmentEditorSchema>;
const emptyQuestion: AssignmentInput["questions"][number] = {
  kind: "ESSAY",
  prompt: "",
  choices: "",
  correctAnswer: "",
  rubric: "",
  maxScore: 10,
};

export function LiveAssignmentEditor({ id }: { id?: string }) {
  const classes = useLiveQuery(["teacher-classes"], () =>
    registrationApi.classes(),
  );
  const assignment = useLiveQuery(
    ["assignment", id],
    (signal) => academicApi.assignment(id!, signal),
    !!id,
  );
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title={id ? "Sửa bài tập nháp" : "Tạo bài tập / đề kiểm tra"}
        breadcrumbs={[
          { label: "Bài tập & chấm bài", href: ROUTES.TEACHER.ASSIGNMENTS },
          { label: id ? "Sửa nháp" : "Tạo mới" },
        ]}
        description="Soạn câu hỏi, đáp án và tiêu chí chấm. Lưu nháp trước khi giao cho học sinh."
      />
      <AsyncBoundary
        isLoading={classes.isPending || (!!id && assignment.isPending)}
        isError={classes.isError || (!!id && assignment.isError)}
        error={classes.error ?? assignment.error}
        onRetry={() => {
          void classes.refetch();
          if (id) void assignment.refetch();
        }}
        data={classes.data}
        emptyProps={{ title: "Chưa có lớp được phân công" }}
      >
        {classes.data &&
          (!id || assignment.data) &&
          (assignment.data && assignment.data.status !== "DRAFT" ? (
            <p>Bài đã được giao, không còn sửa nội dung nháp.</p>
          ) : (
            <AssignmentEditor
              key={id ?? "new"}
              classes={classes.data}
              assignment={assignment.data}
            />
          ))}
      </AsyncBoundary>
    </PageContainer>
  );
}
function AssignmentEditor({
  classes,
  assignment,
}: {
  classes: RegistrationClass[];
  assignment?: AssignmentDetail;
}) {
  const router = useRouter();
  const action = useLiveCommand();
  const user = useCurrentUser();
  const [showImport, setShowImport] = useState(false);
  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentEditorSchema),
    defaultValues: assignment
      ? {
          classId: assignment.classId,
          kind: assignment.kind ?? "HOMEWORK",
          sessionId: assignment.sessionId ?? undefined,
          testType: assignment.testType ?? undefined,
          title: assignment.title,
          instructions: assignment.instructions,
          dueAt: localDateTime(assignment.dueAt),
          maxAttempts: assignment.maxAttempts,
          questions: assignment.questions.map((question) => ({
            kind: question.kind,
            prompt: question.prompt,
            choices: question.choices?.join("\n") ?? "",
            correctAnswer: question.correctAnswer ?? "",
            rubric: question.rubric ?? "",
            maxScore: question.maxScore,
          })),
        }
      : {
          classId: "",
          kind: "HOMEWORK",
          title: "",
          instructions: "",
          dueAt: "",
          maxAttempts: 1,
          questions: [{ ...emptyQuestion }],
        },
  });
  const questions = useFieldArray({ control: form.control, name: "questions" });
  const values = useWatch({ control: form.control, name: "questions" });
  const classId = useWatch({ control: form.control, name: "classId" });
  const kind = useWatch({ control: form.control, name: "kind" });
  const selectedSessionId = useWatch({
    control: form.control,
    name: "sessionId",
  });
  const now = useCurrentTime();
  const totalScore = (values ?? []).reduce(
    (sum, question) =>
      sum + (Number.isFinite(question?.maxScore) ? question.maxScore : 0),
    0,
  );
  useUnsavedChanges(form.formState.isDirty && !action.isSuccess);
  const sessions = useLiveQuery(
    ["assignment-sessions", classId],
    (signal) =>
      academicApi.sessions({ classId, fromDate: todayInVietnam() }, signal),
    !!classId && kind === "TEST",
  );
  const availableSessions =
    sessions.data?.filter(
      (session) =>
        session.status === "SCHEDULED" &&
        session.teacherId === user?.id &&
        Date.parse(session.endsAt) > now,
    ) ?? [];
  const isSessionUnavailable =
    kind === "TEST" &&
    sessions.isSuccess &&
    !!selectedSessionId &&
    !availableSessions.some((session) => session.id === selectedSessionId);
  const blankOnly =
    questions.fields.length === 1 &&
    !!values?.[0] &&
    [
      values[0].prompt,
      values[0].choices,
      values[0].correctAnswer,
      values[0].rubric,
    ].every((value) => !value.trim());
  return (
    <>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((value) => {
          const body = {
            ...value,
            sessionId: value.kind === "TEST" ? value.sessionId : undefined,
            testType: value.kind === "TEST" ? value.testType : undefined,
            dueAt: vietnamDateTime(value.dueAt),
            questions: value.questions.map(toQuestionPayload),
          };
          action.mutate(
            () =>
              assignment
                ? academicApi.updateAssignment(assignment.id, body)
                : academicApi.createAssignment(body),
            {
              onSuccess: (result) =>
                router.push(
                  ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(
                    (result as AssignmentDetail).id,
                  ),
                ),
            },
          );
        })}
      >
        <fieldset
          disabled={action.isPending}
          className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]"
        >
          <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="classId"
                control={form.control}
                render={({ field }) => (
                  <LiveSelect
                    label="Lớp được giao"
                    value={field.value}
                    disabled={!!assignment}
                    options={classes.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    onChange={(value) => {
                      field.onChange(value);
                      form.setValue("sessionId", undefined);
                    }}
                  />
                )}
              />
              {form.formState.errors.classId && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.classId.message}
                </p>
              )}
              <Controller
                name="kind"
                control={form.control}
                render={({ field }) => (
                  <LiveSelect
                    label="Loại nội dung"
                    value={field.value}
                    options={[
                      { value: "HOMEWORK", label: "Bài tập" },
                      { value: "TEST", label: "Bài kiểm tra" },
                    ]}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value === "HOMEWORK") {
                        form.setValue("sessionId", undefined);
                        form.setValue("testType", undefined);
                      }
                    }}
                  />
                )}
              />
              {kind === "TEST" && (
                <div className="space-y-4 rounded-xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    Chọn buổi học tổ chức kiểm tra. Bài kiểm tra do giáo viên
                    chuẩn bị riêng, không thay đổi nội dung giáo trình.
                  </p>
                  <Controller
                    name="testType"
                    control={form.control}
                    render={({ field }) => (
                      <LiveSelect
                        label="Loại bài kiểm tra"
                        value={field.value ?? ""}
                        options={Object.entries(TEST_TYPE_TEXT).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError
                    message={form.formState.errors.testType?.message}
                  />
                  <Controller
                    name="sessionId"
                    control={form.control}
                    render={({ field }) => (
                      <LiveSelect
                        label="Buổi học tổ chức kiểm tra"
                        value={field.value ?? ""}
                        disabled={!classId || sessions.isPending}
                        options={availableSessions.map((session) => ({
                          value: session.id,
                          label: `${displayMoment(session.startsAt)} · ${session.lesson?.title ?? "Buổi học"}`,
                        }))}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError
                    message={form.formState.errors.sessionId?.message}
                  />
                  {isSessionUnavailable && (
                    <p role="alert" className="text-sm text-destructive">
                      Buổi đã chọn không còn phù hợp. Chọn một buổi chưa kết
                      thúc được phân công cho bạn.
                    </p>
                  )}
                  {classId && sessions.isPending && (
                    <p role="status" className="text-sm text-muted-foreground">
                      Đang tải buổi học…
                    </p>
                  )}
                  {classId &&
                    !sessions.isPending &&
                    !sessions.isError &&
                    availableSessions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có buổi học được phân công phù hợp. Cần tạo lịch
                        học trước khi xếp kiểm tra.
                      </p>
                    )}
                  <ApiFeedback
                    error={sessions.error}
                    retry={() => void sessions.refetch()}
                  />
                </div>
              )}
              <Label htmlFor="assignment-title">Tiêu đề</Label>
              <Input id="assignment-title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
              <Label htmlFor="assignment-instructions">Hướng dẫn</Label>
              <Textarea
                id="assignment-instructions"
                {...form.register("instructions")}
              />
              <Label htmlFor="assignment-due">Hạn nộp (giờ Việt Nam)</Label>
              <Input
                id="assignment-due"
                type="datetime-local"
                {...form.register("dueAt")}
              />
              {form.formState.errors.dueAt && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.dueAt.message}
                </p>
              )}
              <Label htmlFor="assignment-attempts">
                Số lần nộp tối đa (1–10)
              </Label>
              <Input
                id="assignment-attempts"
                type="number"
                {...form.register("maxAttempts", { valueAsNumber: true })}
              />
              {form.formState.errors.maxAttempts && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.maxAttempts.message}
                </p>
              )}
              <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {questions.fields.length} câu hỏi
                </span>
                <span className="font-semibold tabular-nums">
                  Tổng {Math.round(totalScore * 100) / 100} điểm
                </span>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSessionUnavailable ||
                  (kind === "TEST" && (sessions.isPending || sessions.isError))
                }
                isLoading={action.isPending}
              >
                Lưu nháp
              </Button>
              <p className="text-xs text-muted-foreground">
                Lưu nháp xong, chọn học sinh rồi giao bài ở trang bài nộp.
              </p>
              <ApiFeedback error={action.error} />
            </CardContent>
          </Card>
          </div>
          <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Câu hỏi · {questions.fields.length} câu ·{" "}
              {Math.round(totalScore * 100) / 100} điểm
            </h2>
            <Button
              type="button"
              variant="outline"
              disabled={!classId}
              onClick={() => setShowImport(true)}
            >
              Nhập câu hỏi từ file
            </Button>
            {!classId && (
              <p className="w-full text-sm text-muted-foreground">
                Chọn lớp trước khi nhập câu hỏi từ file.
              </p>
            )}
          </div>
          {questions.fields.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>Câu {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name={`questions.${index}.kind`}
                  control={form.control}
                  render={({ field }) => (
                    <LiveSelect
                      label="Loại câu hỏi"
                      value={field.value}
                      options={[
                        { value: "ESSAY", label: "Tự luận" },
                        { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
                      ]}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor={`question-${index}-prompt`}>Đề bài</Label>
                <Textarea
                  id={`question-${index}-prompt`}
                  {...form.register(`questions.${index}.prompt`)}
                />
                {form.formState.errors.questions?.[index]?.prompt && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.questions[index]?.prompt?.message}
                  </p>
                )}
                {values?.[index]?.kind === "MULTIPLE_CHOICE" ? (
                  <>
                    <Label htmlFor={`question-${index}-choices`}>
                      Các lựa chọn (mỗi dòng một lựa chọn)
                    </Label>
                    <Textarea
                      id={`question-${index}-choices`}
                      {...form.register(`questions.${index}.choices`)}
                    />
                    {form.formState.errors.questions?.[index]?.choices && (
                      <p role="alert" className="text-sm text-destructive">
                        {
                          form.formState.errors.questions[index]?.choices
                            ?.message
                        }
                      </p>
                    )}
                    <Label htmlFor={`question-${index}-answer`}>
                      Đáp án đúng (trùng nội dung một lựa chọn)
                    </Label>
                    <Input
                      id={`question-${index}-answer`}
                      {...form.register(`questions.${index}.correctAnswer`)}
                    />
                    {form.formState.errors.questions?.[index]
                      ?.correctAnswer && (
                      <p role="alert" className="text-sm text-destructive">
                        {
                          form.formState.errors.questions[index]?.correctAnswer
                            ?.message
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Label htmlFor={`question-${index}-rubric`}>
                      Tiêu chí chấm
                    </Label>
                    <Textarea
                      id={`question-${index}-rubric`}
                      {...form.register(`questions.${index}.rubric`)}
                    />
                    {form.formState.errors.questions?.[index]?.rubric && (
                      <p role="alert" className="text-sm text-destructive">
                        {
                          form.formState.errors.questions[index]?.rubric
                            ?.message
                        }
                      </p>
                    )}
                  </>
                )}
                <Label htmlFor={`question-${index}-max`}>Điểm tối đa</Label>
                <Input
                  id={`question-${index}-max`}
                  type="number"
                  step="0.01"
                  {...form.register(`questions.${index}.maxScore`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.questions?.[index]?.maxScore && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.questions[index]?.maxScore?.message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={questions.fields.length <= 1}
                  onClick={() => questions.remove(index)}
                >
                  Xóa câu này
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={questions.fields.length >= 100}
            onClick={() => questions.append({ ...emptyQuestion })}
          >
            Thêm câu hỏi
          </Button>
          </div>
        </fieldset>
      </form>
      {showImport && (
        <AssignmentImportDialog
          classId={classId}
          open={showImport}
          currentQuestionCount={blankOnly ? 0 : questions.fields.length}
          onOpenChange={setShowImport}
          onApply={(preview, replace) => {
            const imported = preview.questions.map((question) => ({
              kind: question.kind,
              prompt: question.prompt,
              choices: question.choices?.join("\n") ?? "",
              correctAnswer: question.correctAnswer ?? "",
              rubric: question.rubric ?? "",
              maxScore: question.maxScore,
            }));
            if (replace || blankOnly) questions.replace(imported);
            else questions.append(imported);
            if (!form.getValues("title") && preview.title)
              form.setValue("title", preview.title, { shouldDirty: true });
            if (!form.getValues("instructions") && preview.instructions)
              form.setValue("instructions", preview.instructions, {
                shouldDirty: true,
              });
            form.clearErrors("questions");
          }}
        />
      )}
    </>
  );
}
