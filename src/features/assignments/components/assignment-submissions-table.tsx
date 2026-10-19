"use client";

import Link from "next/link";
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import type {
  AssignmentDetail,
  EnrollmentRecord,
  SubmissionRecord,
} from "@/types/academic-workflows";
import { ROUTES } from "@/constants/routes";
import { latestSubmissions, submissionSummary } from "../submission-selectors";

const FILTERS = ["all", "ungraded", "draft", "published", "missing"] as const;
const LABELS = {
  all: "Tất cả",
  ungraded: "Chưa chấm",
  draft: "Nháp / Chờ gửi",
  published: "Đã gửi điểm",
  missing: "Chưa nộp",
};
interface SubmissionRow {
  recipientId: string;
  name: string;
  submission?: SubmissionRecord;
  attempts: SubmissionRecord[];
}

export function AssignmentSubmissionsTable({
  assignment,
  submissions,
  enrollments,
}: {
  assignment: AssignmentDetail;
  submissions: SubmissionRecord[];
  enrollments: EnrollmentRecord[];
}) {
  const [{ submissionFilter, submissionsPage }, setFilter] = useQueryStates({
    submissionFilter: parseAsStringLiteral(FILTERS).withDefault("all"),
    submissionsPage: parseAsInteger.withDefault(1),
  });
  const summary = submissionSummary(assignment, submissions);
  const latest = latestSubmissions(submissions);
  const rows: SubmissionRow[] = assignment.recipients
    .map((recipient) => ({
      recipientId: recipient.id,
      name:
        enrollments.find(
          (enrollment) => enrollment.id === recipient.enrollmentId,
        )?.studentProfile?.fullName ?? "Học sinh được giao bài",
      submission: latest.get(recipient.id),
      attempts: submissions
        .filter((item) => item.recipientId === recipient.id)
        .sort((a, b) => b.attemptNo - a.attemptNo),
    }))
    .filter((row) => {
      if (submissionFilter === "missing") return !row.submission;
      if (submissionFilter === "ungraded")
        return !!row.submission && !row.submission.grades.length;
      if (submissionFilter === "draft")
        return (
          !!row.submission &&
          ["DRAFT", "APPROVED"].includes(row.submission.grades[0]?.status)
        );
      if (submissionFilter === "published")
        return row.submission?.grades[0]?.status === "PUBLISHED";
      return true;
    });
  const maxScore = assignment.questions.reduce(
    (sum, item) => sum + item.maxScore,
    0,
  );
  const columns: DataTableColumn<SubmissionRow>[] = [
    {
      id: "name",
      header: "Học sinh",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "submitted",
      header: "Nộp lúc",
      cell: ({ row }) =>
        row.original.submission
          ? displayMoment(row.original.submission.submittedAt)
          : "—",
    },
    {
      id: "essay",
      header: "Bài tự luận",
      cell: ({ row }) => {
        const submission = row.original.submission;
        if (!submission) return "—";
        if (!assignment.questions.some((question) => question.kind === "ESSAY"))
          return "Trắc nghiệm";
        const text = submission.answers.some(
          (answer) =>
            answer.answer.trim() &&
            assignment.questions.some(
              (question) =>
                question.id === answer.questionId && question.kind === "ESSAY",
            ),
        );
        return (
          <div className="flex flex-wrap gap-1">
            {text && <Badge variant="outline">Nhập chữ</Badge>}
            {submission.files.length > 0 && (
              <Badge variant="info">
                {submission.files.length} tệp đính kèm
              </Badge>
            )}
            {!text && !submission.files.length && "Chưa có bài tự luận"}
          </div>
        );
      },
    },
    {
      id: "attempt",
      header: "Lần",
      cell: ({ row }) =>
        row.original.submission
          ? `${row.original.submission.attemptNo}/${assignment.maxAttempts}`
          : "—",
    },
    {
      id: "score",
      header: "Điểm",
      cell: ({ row }) =>
        row.original.submission?.grades[0]
          ? `${row.original.submission.grades[0].totalScore}/${maxScore}`
          : "—",
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant="outline">
          {!row.original.submission
            ? "Chưa nộp"
            : row.original.submission.grades[0]
              ? STATUS_TEXT[row.original.submission.grades[0].status]
              : "Chưa chấm"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="space-y-2">
          {row.original.submission && (
            <Button
              size="sm"
              variant={
                row.original.submission.grades.length ? "outline" : "default"
              }
              render={
                <Link
                  href={`${ROUTES.TEACHER.GRADING_DETAIL(row.original.submission.id)}?assignmentId=${assignment.id}`}
                />
              }
            >
              {row.original.submission.grades.length
                ? "Chấm tiếp / Xem điểm"
                : "Chấm bài"}
            </Button>
          )}
          {row.original.attempts.length > 1 && (
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Các lần nộp trước
              </summary>
              <div className="flex flex-col gap-1 pt-2">
                {row.original.attempts.slice(1).map((attempt) => (
                  <Link
                    key={attempt.id}
                    className="text-sm text-primary underline"
                    href={`${ROUTES.TEACHER.GRADING_DETAIL(attempt.id)}?assignmentId=${assignment.id}`}
                  >
                    Lần {attempt.attemptNo} ·{" "}
                    {displayMoment(attempt.submittedAt)}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>
      ),
    },
  ];
  return (
    <section className="min-w-0 space-y-4" aria-label="Bài nộp của học sinh">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(
          [
            ["Đã giao", summary.assigned],
            ["Đã nộp", summary.submitted],
            ["Chưa chấm", summary.ungraded],
            ["Đã gửi điểm", summary.published],
            ["Chưa nộp", summary.missing],
          ] as const
        ).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs
        value={submissionFilter}
        onValueChange={(value) => {
          const next = FILTERS.find((key) => key === value);
          if (next)
            void setFilter({ submissionFilter: next, submissionsPage: null });
        }}
      >
        <TabsList aria-label="Lọc bài nộp">
          {FILTERS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {LABELS[key]}
              {key !== "all" && (
                <Badge variant="neutral" className="ml-1.5">
                  {summary[key]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <DataTable
        columns={columns}
        data={rows.slice(
          (Math.max(1, submissionsPage) - 1) * 20,
          Math.max(1, submissionsPage) * 20,
        )}
        emptyTitle="Chưa có bài nộp trong nhóm này"
      />
      <TablePagination
        totalItems={rows.length}
        fixedPageSize={20}
        pageParamKey="submissionsPage"
      />
      {submissions.some((submission) => submission.files.length > 0) && (
        <p className="text-xs text-muted-foreground">
          Mở bài nộp để xem ảnh hoặc tải tệp PDF của học sinh.
        </p>
      )}
    </section>
  );
}
