"use client";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
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
    <PageContainer>
      <PageHeader
        title={id ? "Sửa bài tập nháp" : "Tạo bài tập / đề kiểm tra"}
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
  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentEditorSchema),
    defaultValues: assignment
      ? {
          classId: assignment.classId,
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
          title: "",
          instructions: "",
          dueAt: "",
          maxAttempts: 1,
          questions: [{ ...emptyQuestion }],
        },
  });
  const questions = useFieldArray({ control: form.control, name: "questions" });
  const values = useWatch({ control: form.control, name: "questions" });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((value) => {
        const body = {
          ...value,
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
                `/teacher/assignments/${(result as AssignmentDetail).id}/submissions`,
              ),
          },
        );
      })}
    >
      <fieldset disabled={action.isPending} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin bài tập</CardTitle>
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
                  onChange={field.onChange}
                />
              )}
            />
            {form.formState.errors.classId && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.classId.message}
              </p>
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
          </CardContent>
        </Card>
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
              {values[index]?.kind === "MULTIPLE_CHOICE" ? (
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
                      {form.formState.errors.questions[index]?.choices?.message}
                    </p>
                  )}
                  <Label htmlFor={`question-${index}-answer`}>
                    Đáp án đúng (trùng nội dung một lựa chọn)
                  </Label>
                  <Input
                    id={`question-${index}-answer`}
                    {...form.register(`questions.${index}.correctAnswer`)}
                  />
                  {form.formState.errors.questions?.[index]?.correctAnswer && (
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
                      {form.formState.errors.questions[index]?.rubric?.message}
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
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={questions.fields.length >= 100}
            onClick={() => questions.append({ ...emptyQuestion })}
          >
            Thêm câu hỏi
          </Button>
          <Button type="submit">
            {action.isPending ? "Đang lưu…" : "Lưu nháp"}
          </Button>
        </div>
      </fieldset>
      <ApiFeedback error={action.error} />
    </form>
  );
}
