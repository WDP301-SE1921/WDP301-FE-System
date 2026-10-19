"use client";
import { z } from "zod";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table/data-table";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { useCurriculumUnits } from "../hooks/use-curriculum";
import { useCurrentUser } from "@/hooks/use-current-role";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  feedbackSchema,
  requiredId,
  resolveFeedbackSchema,
} from "@/lib/validators/web-workflows";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { useHubTab } from "@/hooks/use-hub-tab";
const createSchema = feedbackSchema.extend({ lessonId: requiredId });
const resolveSchema = resolveFeedbackSchema
  .omit({ resolutionLessonId: true })
  .extend({ resolutionLessonId: z.string().optional() });
/** Trang Phản hồi giáo trình riêng (Giáo viên). */
/** Tab "Phản hồi giáo trình" trên màn Khóa học & giáo trình (Quản lý, Thiết kế giáo trình). */
export function CurriculumFeedbackTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  return tab === "feedback" ? (
    <div className="min-w-0 space-y-4">
      <CurriculumFeedbackBody />
    </div>
  ) : null;
}

export function CurriculumFeedbackBody() {
  const user = useCurrentUser();
  const data = useLiveQuery(["feedback-workspace"], async (signal) => {
    const [feedback, lessons] = await Promise.all([
      academicApi.feedback(signal),
      academicApi.lessons(signal),
    ]);
    return { feedback, lessons };
  });
  const [filters, setFilters] = useQueryStates({
    feedbackStatus: parseAsStringLiteral([
      "all",
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "DECLINED",
    ]).withDefault("OPEN"),
    feedbackSearch: parseAsString.withDefault(""),
    feedback: parseAsString,
  });
  const curricula = useCurriculumUnits();
  const programs = new Map(
    (curricula.data ?? []).map((unit) => [
      unit.programId,
      unit.program?.name ?? `${unit.track.subject} ${unit.track.grade}`,
    ]),
  );
  const lessons = new Map(
    (data.data?.lessons ?? []).map((lesson) => [lesson.id, lesson]),
  );
  const rows = (data.data?.feedback ?? []).filter(
    (feedback) =>
      (filters.feedbackStatus === "all" ||
        feedback.status === filters.feedbackStatus) &&
      `${lessons.get(feedback.lessonId)?.title ?? ""} ${feedback.content} ${programs.get(lessons.get(feedback.lessonId)?.programId ?? "") ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(filters.feedbackSearch.trim().toLocaleLowerCase("vi")),
  );
  const selected = data.data?.feedback.find(
    (feedback) => feedback.id === filters.feedback,
  );
  const selectedLesson = selected ? lessons.get(selected.lessonId) : undefined;
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "DECLINED"] as const;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", ...statuses].map((status) => (
          <Button
            key={status}
            variant={filters.feedbackStatus === status ? "secondary" : "ghost"}
            size="sm"
            onClick={() =>
              void setFilters({
                feedbackStatus: status as typeof filters.feedbackStatus,
              })
            }
          >
            {status === "all" ? "Tất cả" : STATUS_TEXT[status]}
          </Button>
        ))}
      </div>
      <Input
        aria-label="Tìm phản hồi"
        placeholder="Tìm khóa học, bài học, nội dung…"
        value={filters.feedbackSearch}
        onChange={(event) =>
          void setFilters({ feedbackSearch: event.target.value })
        }
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
            <div className="min-w-0">
              <DataTable
                data={rows}
                onRowClick={(feedback) =>
                  void setFilters({ feedback: feedback.id })
                }
                emptyTitle="Chưa có phản hồi phù hợp"
                columns={[
                  {
                    id: "lesson",
                    header: "Bài học · khóa",
                    cell: ({ row }) => {
                      const lesson = lessons.get(row.original.lessonId);
                      return (
                        <div className="max-w-64 whitespace-normal">
                          <p className="font-medium">
                            {lesson?.title ?? "Bài học không còn truy cập được"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lesson
                              ? (programs.get(lesson.programId) ??
                                "Khóa học chưa có dữ liệu")
                              : ""}
                            {lesson ? ` · Bài ${lesson.sequence}` : ""}
                          </p>
                        </div>
                      );
                    },
                  },
                  {
                    accessorKey: "content",
                    header: "Nội dung",
                    cell: ({ row }) => (
                      <p className="max-w-80 whitespace-normal line-clamp-3">
                        {row.original.content}
                      </p>
                    ),
                  },
                  {
                    accessorKey: "createdAt",
                    header: "Ngày gửi",
                    cell: ({ row }) => displayMoment(row.original.createdAt),
                  },
                  {
                    accessorKey: "status",
                    header: "Trạng thái",
                    cell: ({ row }) => (
                      <Badge
                        variant={
                          row.original.status === "RESOLVED"
                            ? "success"
                            : row.original.status === "OPEN"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {STATUS_TEXT[row.original.status]}
                      </Badge>
                    ),
                  },
                  {
                    id: "action",
                    header: "Thao tác",
                    cell: ({ row }) => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void setFilters({ feedback: row.original.id })
                        }
                      >
                        Xem
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
            <div className="min-w-0 space-y-4 xl:sticky xl:top-20">
              {selected ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle>
                        {selectedLesson?.title ?? "Phản hồi bài học"}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void setFilters({ feedback: null })}
                      >
                        Đóng
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      {displayMoment(selected.createdAt)}
                      {selected.teacherId === user?.id ? " · Bạn gửi" : ""}
                    </p>
                    <p className="whitespace-pre-wrap wrap-anywhere text-sm">
                      {selected.content}
                    </p>
                    <Badge>{STATUS_TEXT[selected.status]}</Badge>
                    {selected.response && (
                      <p className="whitespace-pre-wrap text-sm">
                        Phản hồi: {selected.response}
                      </p>
                    )}
                    {selected.resolutionLessonId && (
                      <p className="text-sm">
                        Bản sửa:{" "}
                        {lessons.get(selected.resolutionLessonId)?.title ??
                          "Bản sửa đã gắn"}
                      </p>
                    )}
                    {(user?.role === "center_manager" ||
                      user?.role === "curriculum_designer") && (
                      <ApiForm
                        key={`${selected.id}-${selected.status}-${selected.response}`}
                        schema={resolveSchema}
                        defaults={{
                          status: selected.status,
                          response: selected.response ?? "",
                          resolutionLessonId: selected.resolutionLessonId ?? "",
                        }}
                        fields={[
                          {
                            name: "status",
                            label: "Trạng thái xử lý",
                            type: "select",
                            options: statuses.map((status) => ({
                              value: status,
                              label: STATUS_TEXT[status],
                            })),
                          },
                          {
                            name: "response",
                            label: "Trả lời giáo viên",
                            type: "textarea",
                          },
                          {
                            name: "resolutionLessonId",
                            label: "Bản sửa đã duyệt (nếu có)",
                            type: "select",
                            options: [
                              { value: "", label: "Không gắn bản sửa" },
                              ...data.data.lessons
                                .filter(
                                  (lesson) =>
                                    lesson.basedOnId === selected.lessonId &&
                                    lesson.status === "APPROVED",
                                )
                                .map((lesson) => ({
                                  value: lesson.id,
                                  label: lesson.title,
                                })),
                            ],
                          },
                        ]}
                        submitLabel="Lưu phản hồi"
                        onSubmit={(value) =>
                          academicApi.resolveFeedback(selected.id, {
                            ...value,
                            resolutionLessonId:
                              value.resolutionLessonId || undefined,
                          })
                        }
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Bản đang dùng được giữ nguyên. Nội dung sửa soạn trong kỳ
                      tiếp theo; chỉ gắn bản sửa đã được hệ thống xác nhận liên
                      kết và duyệt.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <EmptyState
                      title="Chọn phản hồi để xem"
                      description="Nội dung và trạng thái xử lý hiện ở đây."
                    />
                  </CardContent>
                </Card>
              )}
              {user?.role === "teacher" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gửi phản hồi bài học</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ApiForm
                      schema={createSchema}
                      fields={[
                        {
                          name: "lessonId",
                          label: "Bài học",
                          type: "select",
                          options: data.data.lessons.map((lesson) => ({
                            value: lesson.id,
                            label: lesson.title,
                          })),
                        },
                        {
                          name: "content",
                          label: "Nội dung phản hồi",
                          type: "textarea",
                        },
                      ]}
                      submitLabel="Gửi phản hồi"
                      onSubmit={(value) =>
                        academicApi.createFeedback(String(value.lessonId), {
                          content: value.content,
                        })
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
