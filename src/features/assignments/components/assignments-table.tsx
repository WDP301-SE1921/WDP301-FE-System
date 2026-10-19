"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  readAssignmentWorkspaces,
  type AssignmentWorkspaceRow,
} from "../workspace-api";
import {
  ASSIGNMENT_FILTERS,
  matchesAssignmentFilter,
  submissionSummary,
} from "../submission-selectors";
import { TEST_TYPE_TEXT } from "../assessment-labels";
import { ROUTES } from "@/constants/routes";

const FILTER_LABELS = {
  all: "Tất cả",
  "need-grading": "Cần chấm",
  open: "Còn hạn",
  draft: "Nháp",
  closed: "Đã đóng",
};

export function AssignmentsTable() {
  const router = useRouter();
  const now = useCurrentTime();
  const [{ filter, search, page }, setFilters] = useQueryStates({
    filter: parseAsStringLiteral(ASSIGNMENT_FILTERS).withDefault("all"),
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });
  const query = useLiveQuery(["teacher-assignment-workspaces"], (signal) =>
    readAssignmentWorkspaces(signal),
  );
  const rows = (query.data ?? []).filter(
    ({ assignment, submissions, className }) =>
      matchesAssignmentFilter(
        assignment,
        submissionSummary(assignment, submissions).ungraded,
        filter,
        now,
      ) &&
      `${assignment.title} ${className}`
        .toLocaleLowerCase("vi")
        .includes(search.trim().toLocaleLowerCase("vi")),
  );
  const href = (row: AssignmentWorkspaceRow) =>
    ROUTES.TEACHER.ASSIGNMENT_SUBMISSIONS(row.assignment.id);
  const columns: DataTableColumn<AssignmentWorkspaceRow>[] = [
    {
      id: "title",
      header: "Bài",
      cell: ({ row: { original: row } }) => (
        <div className="min-w-56 max-w-80 space-y-1 whitespace-normal">
          <Link className="font-semibold hover:text-primary" href={href(row)}>
            {row.assignment.title}
          </Link>
          <p className="text-xs text-muted-foreground">
            {row.assignment.kind === "TEST"
              ? row.assignment.testType
                ? TEST_TYPE_TEXT[row.assignment.testType]
                : "Bài kiểm tra"
              : "Bài tập"}{" "}
            · {row.assignment.questions.length} câu ·{" "}
            {row.assignment.questions.reduce(
              (sum, question) => sum + question.maxScore,
              0,
            )}{" "}
            điểm
          </p>
        </div>
      ),
    },
    { id: "class", header: "Lớp", cell: ({ row }) => row.original.className },
    {
      id: "due",
      header: "Hạn nộp",
      cell: ({ row }) => displayMoment(row.original.assignment.dueAt),
    },
    {
      id: "submitted",
      header: "Đã nộp",
      cell: ({ row }) => {
        const count = submissionSummary(
          row.original.assignment,
          row.original.submissions,
        );
        return row.original.assignment.status === "DRAFT"
          ? "—"
          : `${count.submitted}/${count.assigned}`;
      },
    },
    {
      id: "ungraded",
      header: "Chưa chấm",
      cell: ({ row }) => {
        const count = submissionSummary(
          row.original.assignment,
          row.original.submissions,
        ).ungraded;
        return count ? (
          <Badge variant="warning">{count}</Badge>
        ) : row.original.assignment.status === "DRAFT" ? (
          "—"
        ) : (
          "0"
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant="outline">
          {STATUS_TEXT[row.original.assignment.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            render={<Link href={href(row.original)} />}
          >
            Bài nộp / Giao bài
          </Button>
          {row.original.assignment.status === "DRAFT" && (
            <Button
              size="sm"
              variant="ghost"
              render={
                <Link
                  href={ROUTES.TEACHER.ASSIGNMENT_EDIT(row.original.assignment.id)}
                />
              }
            >
              Sửa nháp
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Bài tập & chấm bài"
        description="Soạn và giao bài, xem bài nộp, chấm và gửi điểm cho phụ huynh."
        actions={
          <Button render={<Link href={ROUTES.TEACHER.ASSIGNMENT_NEW} />}>
            Tạo bài tập / đề kiểm tra
          </Button>
        }
      />
      <Tabs
        value={filter}
        onValueChange={(value) => {
          const next = ASSIGNMENT_FILTERS.find((key) => key === value);
          if (next) void setFilters({ filter: next, page: null });
        }}
      >
        <TabsList aria-label="Lọc bài tập">
          {ASSIGNMENT_FILTERS.map((key) => (
            <TabsTrigger value={key} key={key}>
              {FILTER_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <FilterBar
        searchPlaceholder="Tìm bài tập hoặc lớp…"
        onSearchChange={() => void setFilters({ page: null })}
      />
      <DataTable
        columns={columns}
        data={rows.slice((Math.max(1, page) - 1) * 20, Math.max(1, page) * 20)}
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        onRowClick={(row) => router.push(href(row))}
        emptyTitle="Chưa có bài tập phù hợp"
        emptyDescription="Thử đổi nhóm bài tập hoặc từ khóa tìm kiếm."
      />
      <TablePagination totalItems={rows.length} fixedPageSize={20} />
    </PageContainer>
  );
}
