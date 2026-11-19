"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { LessonChangeContent } from "../curriculum-comparison";
import { LESSON_CHANGE_LABELS } from "../../workspace-selectors";
import { OutcomeLinkWarning } from "../outcome-link-warning";
import { lessonSummary } from "../../lesson-summary";
import type { UnitWorkspace } from "../../hooks/use-unit-workspace";

export function UnitLessonsSection({
  ws,
  readOnly = false,
}: {
  ws: UnitWorkspace;
  readOnly?: boolean;
}) {
  const {
    router,
    unit,
    setSelectedLessonId,
    setMappingLesson,
    setPositionLesson,
    setDeleting,
    setChangeFilter,
    hasComparison,
    effectiveFilter,
    showRemoved,
    setShowRemoved,
    removedCount,
    canToggleRemoved,
    comparisonRows,
    selectedRow,
    unlinkedGroups,
    busy,
    regular,
    openEditor,
    move,
    mapOutcomesHref,
  } = ws;
  const canEdit = ws.canEdit && !readOnly;
  const canMapOutcomes = ws.canMapOutcomes && !readOnly;
  if (!unit) return null;
  return (
    <>
      {canMapOutcomes && unlinkedGroups.length > 0 && (
        <OutcomeLinkWarning
          groups={unlinkedGroups}
          onLink={() => router.push(mapOutcomesHref)}
        />
      )}
      <div id="curriculum-lessons" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Bài học ({regular.length})</h2>
          <div className="flex flex-wrap gap-2">
            {hasComparison &&
              (
                [
                  "all",
                  "changed",
                  "new",
                  "modified",
                  "unchanged",
                  "removed",
                ] as const
              ).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={effectiveFilter === filter ? "secondary" : "ghost"}
                  onClick={() => void setChangeFilter(filter)}
                >
                  {filter === "all"
                    ? "Tất cả"
                    : filter === "changed"
                      ? "Chỉ bài thay đổi"
                      : LESSON_CHANGE_LABELS[filter]}
                </Button>
              ))}
            {canMapOutcomes && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={mapOutcomesHref} />}
              >
                Gắn mục tiêu
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => openEditor({ kind: "lesson" })}
              >
                Thêm bài học
              </Button>
            )}
          </div>
        </div>
        {canToggleRemoved && (
          <p className="text-sm text-muted-foreground">
            {showRemoved
              ? `Đang hiện ${removedCount} bài đã bỏ so với bản đối chiếu · `
              : `Ẩn ${removedCount} bài đã bỏ so với bản đối chiếu · `}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => setShowRemoved((value) => !value)}
            >
              {showRemoved ? "Ẩn" : "Hiện"}
            </Button>
          </p>
        )}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="min-w-0 overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Tên bài · nội dung tóm tắt</TableHead>
                  {hasComparison && <TableHead>So với bản đối chiếu</TableHead>}
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => {
                  const isFirst = regular[0]?.id === row.lesson.id;
                  const isLast = regular.at(-1)?.id === row.lesson.id;
                  return (
                    <TableRow
                      key={row.lesson.id}
                      className={
                        selectedRow?.lesson.id === row.lesson.id
                          ? "bg-primary/5"
                          : undefined
                      }
                    >
                      <TableCell>{row.lesson.sequence}</TableCell>
                      <TableCell className="max-w-80 whitespace-normal">
                        <Button
                          variant="link"
                          className="h-auto whitespace-normal p-0 text-left"
                          onClick={() =>
                            void setSelectedLessonId(row.lesson.id)
                          }
                        >
                          {row.lesson.title}
                        </Button>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {lessonSummary(row.lesson.content)}
                        </p>
                      </TableCell>
                      {hasComparison && (
                        <TableCell>
                          {LESSON_CHANGE_LABELS[row.change]}
                        </TableCell>
                      )}
                      <TableCell>
                        {canEdit && row.change !== "removed" ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              disabled={busy || isFirst}
                              aria-label={`Đưa bài ${row.lesson.sequence} lên`}
                              onClick={() => move(row.lesson.id, -1)}
                            >
                              ↑
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              disabled={busy || isLast}
                              aria-label={`Đưa bài ${row.lesson.sequence} xuống`}
                              onClick={() => move(row.lesson.id, 1)}
                            >
                              ↓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                openEditor({
                                  kind: "lesson",
                                  lesson: row.lesson,
                                })
                              }
                            >
                              Sửa
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Thao tác bài ${row.lesson.sequence}`}
                                    disabled={busy}
                                  />
                                }
                              >
                                ⋯
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {canMapOutcomes && (
                                  <DropdownMenuItem
                                    onClick={() => setMappingLesson(row.lesson)}
                                  >
                                    Gắn mục tiêu
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  disabled={regular.length < 2}
                                  onClick={() => setPositionLesson(row.lesson)}
                                >
                                  Chuyển tới vị trí…
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleting(row.lesson)}
                                >
                                  Xóa bài học
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void setSelectedLessonId(row.lesson.id)
                              }
                            >
                              Đọc
                            </Button>
                            {canMapOutcomes && row.change !== "removed" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      aria-label={`Thao tác bài ${row.lesson.sequence}`}
                                    />
                                  }
                                >
                                  ⋯
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => setMappingLesson(row.lesson)}
                                  >
                                    Gắn mục tiêu
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {!comparisonRows.length && (
              <EmptyState
                title={
                  regular.length
                    ? "Không có bài phù hợp bộ lọc"
                    : "Chưa có bài học"
                }
                description={
                  regular.length
                    ? "Chọn Tất cả để đọc toàn bộ giáo trình."
                    : "Thêm bài học hoặc nhập bài từ file."
                }
              />
            )}
          </div>
          <Card className="min-w-0 xl:sticky xl:top-20">
            <CardHeader>
              <CardTitle>
                {selectedRow?.lesson.title ?? "Chọn bài để đọc"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRow ? (
                <LessonChangeContent row={selectedRow} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chọn bài trong bảng để xem nội dung và thay đổi.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
