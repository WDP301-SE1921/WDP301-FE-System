"use client";
// Khối thao tác của bước 3–5 trên trang bài tập (Luồng 4, PLAN_GUIDED_WORKFLOWS.md). Mỗi khối chỉ
// có một nút chính; thao tác ít dùng (gia hạn, mở lại) nằm trong "Thao tác khác".
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { academicApi } from "@/features/academic/api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { latestGrade } from "@/features/grading/grade-workflow";
import { useCurrentUser } from "@/hooks/use-current-role";
import { ApiError } from "@/lib/api/client";
import {
  localDateTimeSchema,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import type {
  AssignmentDetail,
  SubmissionRecord,
} from "@/types/academic-workflows";
import { nextUngraded } from "../assignment-steps";
import type { submissionSummary } from "../submission-selectors";

type Summary = ReturnType<typeof submissionSummary>;

const windowSchema = z.object({
  dueAt: localDateTimeSchema,
  maxAttempts: z.coerce.number().int().min(1).max(10),
});
const emptySchema = z.object({});

const gradingHref = (submissionId: string, assignmentId: string) =>
  `${ROUTES.TEACHER.GRADING_DETAIL(submissionId)}?assignmentId=${assignmentId}`;

/** Làm lần lượt từng việc; một việc lỗi không chặn việc sau, trả về số việc xong và lỗi. */
async function runInOrder<T>(items: T[], work: (item: T) => Promise<void>) {
  let done = 0;
  const failed: { item: T; error: unknown }[] = [];
  for (const item of items) {
    try {
      await work(item);
      done++;
    } catch (error) {
      failed.push({ item, error });
    }
  }
  return { done, failed };
}

function useRefreshAssignment() {
  const user = useCurrentUser();
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["web-api", user?.id] });
}

function CloseSubmissions({
  assignment,
  isOverdue,
  onDone,
}: {
  assignment: AssignmentDetail;
  isOverdue: boolean;
  onDone: () => void;
}) {
  return (
    <ApiForm
      schema={emptySchema}
      fields={[]}
      submitLabel={isOverdue ? "Đóng nhận bài" : "Đóng nhận bài sớm"}
      submitVariant="default"
      successMessage="Đã đóng nhận bài."
      confirm={{
        title: "Đóng nhận bài?",
        description: () =>
          "Học sinh sẽ không nộp thêm được. Nếu cần, bạn vẫn mở lại nhận bài được cho tới khi công bố đáp án.",
        confirmText: "Đóng nhận bài",
      }}
      onSubmit={() => academicApi.closeAssignment(assignment.id)}
      onSuccess={onDone}
    />
  );
}

/** Bước 3: học sinh làm và nộp bài. */
export function CollectPanel({
  assignment,
  summary,
  isOverdue,
  onGoGrade,
  onDone,
}: {
  assignment: AssignmentDetail;
  summary: Summary;
  isOverdue: boolean;
  onGoGrade: () => void;
  /** Đóng nhận bài xong: trang về bước đang làm. */
  onDone: () => void;
}) {
  const isClosed = assignment.status === "CLOSED";
  const allSubmitted = summary.assigned > 0 && summary.missing === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Học sinh làm bài</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {isClosed
            ? "Đã đóng nhận bài. "
            : isOverdue
              ? "Đã hết hạn nộp. "
              : ""}
          Hạn nộp {displayMoment(assignment.dueAt)} · tối đa{" "}
          {assignment.maxAttempts} lần nộp. Đã nộp{" "}
          <strong>{summary.submitted}</strong>/{summary.assigned}, còn{" "}
          <strong>{summary.missing}</strong> học sinh chưa nộp.
        </p>
        {!isClosed && (
          <p className="text-sm text-muted-foreground">
            {isOverdue
              ? "Đóng nhận bài để sang bước chấm và trả điểm."
              : allSubmitted
                ? "Mọi học sinh đã nộp. Đóng nhận bài để công bố đáp án sau khi gửi điểm."
                : "Học sinh làm bài trên ứng dụng của phụ huynh. Bạn chấm được ngay các bài đã nộp."}
          </p>
        )}
        <div className="flex flex-wrap items-start gap-2">
          {!isClosed && (
            <CloseSubmissions
              assignment={assignment}
              isOverdue={isOverdue || allSubmitted}
              onDone={onDone}
            />
          )}
          {summary.ungraded > 0 && (
            <Button
              type="button"
              variant={isClosed ? "default" : "outline"}
              onClick={onGoGrade}
            >
              Chấm {summary.ungraded} bài đã nộp
            </Button>
          )}
        </div>
        {!assignment.answersPublishedAt && (
          <details className="rounded-2xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Thao tác khác: gia hạn hoặc mở lại nhận bài
            </summary>
            <div className="pt-4">
              <ApiForm
                schema={windowSchema}
                defaults={{ maxAttempts: assignment.maxAttempts }}
                fields={[
                  {
                    name: "dueAt",
                    label: "Hạn nộp mới (giờ Việt Nam)",
                    type: "datetime-local",
                    defaultTime: "23:59",
                  },
                  {
                    name: "maxAttempts",
                    label: "Số lần nộp tối đa",
                    type: "number",
                  },
                ]}
                submitLabel={isClosed ? "Mở lại nhận bài" : "Gia hạn"}
                onSubmit={(value) =>
                  academicApi.reopenAssignment(assignment.id, {
                    ...value,
                    dueAt: vietnamDateTime(String(value.dueAt)),
                  })
                }
              />
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

/** Bước 4: chấm lần lượt, hoặc chấm trắc nghiệm tự động cho mọi bài chưa chấm (D2 a). */
export function GradePanel({
  assignment,
  latest,
  summary,
  onGoReturn,
}: {
  assignment: AssignmentDetail;
  latest: SubmissionRecord[];
  summary: Summary;
  onGoReturn: () => void;
}) {
  const refresh = useRefreshAssignment();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const next = nextUngraded(latest);
  const ungraded = latest.filter((item) => !item.grades.length);
  const objectiveOnly =
    assignment.questions.length > 0 &&
    assignment.questions.every(
      (question) => question.kind === "MULTIPLE_CHOICE",
    );

  async function gradeAll() {
    setBusy(true);
    setNotice("");
    try {
      const { done, failed } = await runInOrder(
        ungraded,
        async (submission) => {
          await academicApi.gradeObjective(submission.id);
        },
      );
      const manual = failed.filter(
        ({ error }) =>
          error instanceof ApiError &&
          error.code === "OBJECTIVE_FILE_REVIEW_REQUIRED",
      ).length;
      const other = failed.length - manual;
      setNotice(
        [
          `Đã chấm ${done} bài, điểm đang ở bản nháp.`,
          manual
            ? `${manual} bài nộp bằng ảnh hoặc tệp cần bạn mở ra chấm.`
            : "",
          other ? `${other} bài chưa chấm được, mở từng bài để thử lại.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
      await refresh();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chấm bài</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.submitted === 0 ? (
          <p className="text-sm">Chưa có bài nộp để chấm.</p>
        ) : summary.ungraded > 0 ? (
          <p className="text-sm">
            Còn <strong>{summary.ungraded}</strong> bài chưa chấm. Chấm xong một
            bài, bấm “Gửi điểm” thì bài tiếp theo tự mở.
          </p>
        ) : (
          <p className="text-sm">Đã chấm hết bài nộp.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {next && (
            <Button
              render={<Link href={gradingHref(next.id, assignment.id)} />}
            >
              Chấm bài tiếp theo
            </Button>
          )}
          {objectiveOnly && ungraded.length > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setAsking(true)}
            >
              Chấm trắc nghiệm tự động {ungraded.length} bài
            </Button>
          )}
          {summary.draft > 0 && (
            <Button
              type="button"
              variant={next ? "outline" : "default"}
              onClick={onGoReturn}
            >
              Tiếp: gửi điểm {summary.draft} bài
            </Button>
          )}
        </div>
        {notice && (
          <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
            {notice}
          </p>
        )}
        <ConfirmDialog
          open={asking}
          onOpenChange={(open) => !busy && setAsking(open)}
          title={`Chấm trắc nghiệm tự động ${ungraded.length} bài?`}
          description="Hệ thống so đáp án học sinh chọn với đáp án đúng. Điểm lưu ở bản nháp, phụ huynh chưa thấy cho tới khi bạn gửi điểm ở bước sau."
          confirmText="Chấm tự động"
          isLoading={busy}
          onConfirm={gradeAll}
        />
      </CardContent>
    </Card>
  );
}

/** Bước 5: gửi điểm các bài đã chấm, đóng nhận bài rồi công bố đáp án. */
export function ReturnPanel({
  assignment,
  latest,
  summary,
  isOverdue,
  onGoGrade,
  onDone,
}: {
  assignment: AssignmentDetail;
  latest: SubmissionRecord[];
  summary: Summary;
  isOverdue: boolean;
  onGoGrade: () => void;
  onDone: () => void;
}) {
  const refresh = useRefreshAssignment();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = latest.flatMap((submission) => {
    const grade = latestGrade(submission);
    return grade && (grade.status === "DRAFT" || grade.status === "APPROVED")
      ? [grade]
      : [];
  });
  const isClosed = assignment.status === "CLOSED";
  const answersVisible = !!assignment.answersPublishedAt;

  async function sendAll() {
    setBusy(true);
    setNotice("");
    try {
      const { done, failed } = await runInOrder(pending, async (grade) => {
        const approved =
          grade.status === "DRAFT"
            ? await academicApi.approveGrade(grade.id)
            : grade;
        if (approved.status !== "PUBLISHED")
          await academicApi.publishGrade(approved.id);
      });
      setNotice(
        `Đã gửi điểm ${done} bài.${failed.length ? ` ${failed.length} bài chưa gửi được (có thể vừa được sửa ở phiên khác), mở từng bài để gửi.` : ""}`,
      );
      await refresh();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trả điểm & đáp án</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2" aria-label="Gửi điểm">
          <p className="font-medium">1. Gửi điểm cho phụ huynh</p>
          <p className="text-sm text-muted-foreground">
            Đã gửi {summary.published} bài
            {pending.length
              ? ` · ${pending.length} bài chấm xong chưa gửi`
              : ""}
            {summary.ungraded ? ` · ${summary.ungraded} bài chưa chấm` : ""}.
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.length > 0 && (
              <Button
                type="button"
                disabled={busy}
                onClick={() => setAsking(true)}
              >
                Gửi điểm {pending.length} bài
              </Button>
            )}
            {summary.ungraded > 0 && (
              <Button type="button" variant="outline" onClick={onGoGrade}>
                Chấm {summary.ungraded} bài còn lại
              </Button>
            )}
          </div>
          {notice && (
            <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
              {notice}
            </p>
          )}
        </section>
        <section className="space-y-2" aria-label="Công bố đáp án">
          <p className="font-medium">2. Công bố đáp án</p>
          {answersVisible ? (
            <p className="text-sm text-muted-foreground">
              Đã công bố đáp án. Phụ huynh xem được đáp án đúng cùng điểm của
              con.
            </p>
          ) : !isClosed ? (
            <>
              <p className="text-sm text-muted-foreground">
                Đóng nhận bài trước, rồi mới công bố đáp án được.
              </p>
              <CloseSubmissions
                assignment={assignment}
                isOverdue={isOverdue}
                onDone={onDone}
              />
            </>
          ) : (
            <ApiForm
              schema={emptySchema}
              fields={[]}
              submitLabel="Công bố đáp án"
              successMessage="Đã công bố đáp án."
              confirm={{
                title: "Công bố đáp án?",
                description: () =>
                  "Phụ huynh sẽ xem được đáp án đúng. Sau khi công bố không mở lại nhận bài được nữa.",
                confirmText: "Công bố đáp án",
              }}
              onSubmit={() => academicApi.publishAnswers(assignment.id)}
            />
          )}
        </section>
        {answersVisible && !pending.length && !summary.ungraded && (
          <p
            role="status"
            className="rounded-xl bg-primary/10 p-3 text-sm font-medium"
          >
            Bài tập đã xong hết các bước.
          </p>
        )}
        <ConfirmDialog
          open={asking}
          onOpenChange={(open) => !busy && setAsking(open)}
          title={`Gửi điểm ${pending.length} bài cho phụ huynh?`}
          description="Điểm và nhận xét của các bài đã chấm sẽ được duyệt và công bố; phụ huynh thấy ngay trên ứng dụng."
          confirmText="Gửi điểm"
          isLoading={busy}
          onConfirm={sendAll}
        />
      </CardContent>
    </Card>
  );
}
