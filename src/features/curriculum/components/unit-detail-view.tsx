"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { calendarDateLabel } from "@/lib/calendar-date";
import { ROUTES } from "@/constants/routes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer";
import {
  ApprovalSteps,
  ComparisonNotice,
  LessonChangeContent,
  useCurriculumComparison,
} from "./curriculum-comparison";
import { canCopyCurriculum, curriculumEffectiveLabel, LESSON_CHANGE_LABELS } from "../workspace-selectors";
import { useVietnamDate } from "@/hooks/use-vietnam-date";
import type { CurriculumLesson } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { curriculumStage } from "../presentation";
import {
  useCurriculumUnit,
  useCurriculumMutation,
} from "../hooks/use-curriculum";
import type { CurriculumFormState } from "../hooks/use-curriculum-form";
import { UnitForm } from "./unit-form";
import {
  CurriculumReadinessCards,
  useCurriculumReadiness,
} from "./curriculum-readiness";
import { LessonForm } from "./lesson-form";
import { CurriculumImport } from "./curriculum-import";
import {
  CurriculumSubmitForm,
  CurriculumTechnicalReviewForm,
  CurriculumRevisionForm,
  CurriculumRequestChangesForm,
} from "./curriculum-review-forms";

interface Editor {
  kind:
    | "unit"
    | "lesson"
    | "import"
    | "submit"
    | "technical-review"
    | "revision"
    | "request-changes";
  lesson?: CurriculumLesson;
}
const editorTitles: Record<Editor["kind"], string> = {
  unit: "Thông tin giáo trình",
  lesson: "Soạn bài học",
  import: "Nhập bài học từ CSV",
  submit: "Gửi thẩm định chuyên môn",
  "technical-review": "Thẩm định chuyên môn",
  revision: "Chuẩn bị giáo trình cho kỳ tiếp theo",
  "request-changes": "Yêu cầu chỉnh sửa giáo trình",
};

export function CurriculumUnitDetailView({ unitId }: { unitId: string }) {
  const role = useCurrentRole();
  const today = useVietnamDate();
  const user = useCurrentUser();
  const router = useRouter();
  const query = useCurriculumUnit(unitId);
  const [selectedLessonId, setSelectedLessonId] = useQueryState(
    "lesson",
    parseAsString.withDefault(""),
  );
  const [editorKind, setEditorKind] = useQueryState(
    "editor",
    parseAsStringLiteral([
      "unit",
      "lesson",
      "import",
      "submit",
      "technical-review",
      "revision",
      "request-changes",
    ]),
  );
  const editor: Editor | null = editorKind
    ? {
        kind: editorKind,
        lesson:
          editorKind === "lesson"
            ? query.data?.lessons.find(
                (lesson) => lesson.id === selectedLessonId,
              )
            : undefined,
      }
    : null;
  const setEditor = (value: Editor | null) => {
    void setEditorKind(value?.kind ?? null);
    if (value?.kind === "lesson")
      void setSelectedLessonId(value.lesson?.id ?? null);
  };
  const [formState, setFormState] = useState<CurriculumFormState>({
    dirty: false,
    busy: false,
  });
  const [discard, setDiscard] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<"unit" | CurriculumLesson | null>(
    null,
  );
  const validation = useMutation({
    mutationFn: () => curriculumApi.validation(unitId),
    retry: false,
  });
  const approve = useCurriculumMutation(() => curriculumApi.approve(unitId));
  const remove = useCurriculumMutation(async () => {
    const result = await curriculumApi.remove(unitId);
    if ("deleted" in result) router.push(ROUTES.MANAGER.CURRICULUM);
    return result;
  });
  const removeLesson = useCurriculumMutation((id: string) =>
    curriculumApi.removeLesson(unitId, id),
  );
  const reorder = useCurriculumMutation((ids: string[]) =>
    curriculumApi.reorder(unitId, ids, query.data!.revision),
  );
  const unit = query.data;
  const comparison = useCurriculumComparison(unit);
  const [changeFilter, setChangeFilter] = useQueryState(
    "lessonChanges",
    parseAsStringLiteral([
      "all",
      "changed",
      "new",
      "modified",
      "unchanged",
      "removed",
    ]).withDefault(
      role === "teacher" || role === "center_manager" ? "changed" : "all",
    ),
  );
  const comparisonRows = comparison.rows.filter(
    (row) =>
      changeFilter === "all" ||
      (changeFilter === "changed"
        ? row.change !== "unchanged"
        : row.change === changeFilter),
  );
  const selectedRow =
    comparisonRows.find((row) => row.lesson.id === selectedLessonId) ??
    comparisonRows[0];
  const canEdit =
    role === "curriculum_designer" &&
    unit?.designerId === user?.id &&
    unit?.status === "DRAFT";
  const canRevise =
    role === "curriculum_designer" &&
    unit?.designerId === user?.id &&
    !!unit && canCopyCurriculum(unit);
  const canTechnicalReview =
    role === "teacher" &&
    unit?.status === "PENDING_REVIEW" &&
    unit.reviewerTeacherId === user?.id &&
    !unit.technicalReviewedAt;
  const canConfirm =
    role === "center_manager" &&
    unit?.status === "PENDING_REVIEW" &&
    !!unit.technicalReviewedAt;
  const busy = [approve, remove, removeLesson, reorder, validation].some(
    (mutation) => mutation.isPending,
  );
  const error = [approve, remove, removeLesson, reorder, validation].find(
    (mutation) => mutation.error,
  )?.error;
  const regular =
    unit?.lessons
      .filter((lesson) => lesson.kind === "LESSON")
      .sort((a, b) => a.sequence - b.sequence) ?? [];
  const ready =
    !!validation.data?.ready && validation.data.revision === unit?.revision;
  // Bản nháp: báo trước khóa đã có lớp có giáo viên (người thẩm định) và số bài cần.
  const showReadiness =
    unit?.status === "DRAFT" &&
    (role === "curriculum_designer" || role === "center_manager");
  const { readiness } = useCurriculumReadiness(unit, showReadiness);
  const blockedReason = readiness?.blockedReason ?? "";
  const backHref =
    role === "teacher" ? ROUTES.TEACHER.CURRICULUM : ROUTES.MANAGER.CURRICULUM;
  const openEditor = (value: Editor) => {
    setFormState({ dirty: false, busy: false });
    setNotice("");
    setEditor(value);
  };
  const closeEditor = () => {
    setEditor(null);
    setFormState({ dirty: false, busy: false });
  };
  const saved = (message: string) => {
    closeEditor();
    setNotice(message);
  };
  function move(id: string, direction: number) {
    const ids = regular.map((lesson) => lesson.id);
    const index = ids.indexOf(id),
      target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }
  return (
    <PageContainer>
      <PageHeader
        title={unit?.title ?? "Chi tiết giáo trình"}
        backHref={backHref}
        description={
          unit
            ? [
                unit.program?.name ?? unit.track.subject,
                "Khối " + unit.track.grade,
                calendarDateLabel(unit.fromDate.slice(0, 10)) +
                  " – " +
                  calendarDateLabel(unit.toDate.slice(0, 10)),
              ].join(" · ")
            : undefined
        }
        actions={
          unit && (
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button
                  disabled={busy || (ready && !!blockedReason)}
                  aria-describedby={
                    blockedReason ? "curriculum-submit-blocked" : undefined
                  }
                  isLoading={validation.isPending}
                  onClick={() =>
                    ready ? openEditor({ kind: "submit" }) : validation.mutate()
                  }
                >
                  {ready ? "Gửi thẩm định chuyên môn" : "Kiểm tra giáo trình"}
                </Button>
              )}
              {canTechnicalReview && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    document
                      .getElementById("curriculum-decision")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Thẩm định chuyên môn
                </Button>
              )}
              {canConfirm && (
                <Button disabled={busy} onClick={() => setConfirmApply(true)}>
                  Xác nhận áp dụng
                </Button>
              )}
              {canRevise && (
                <Button
                  disabled={busy}
                  onClick={() => openEditor({ kind: "revision" })}
                >
                  Chuẩn bị kỳ tiếp theo
                </Button>
              )}
              {(canEdit || role === "center_manager") && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        disabled={busy}
                        aria-label="Thao tác khác với giáo trình"
                      />
                    }
                  >
                    Thao tác khác
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <>
                        <DropdownMenuItem
                          onClick={() => openEditor({ kind: "unit" })}
                        >
                          Sửa thông tin giáo trình
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditor({ kind: "import" })}
                        >
                          Nhập bài học từ CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => validation.mutate()}>
                          Kiểm tra giáo trình
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting("unit")}
                        >
                          Xóa bản nháp
                        </DropdownMenuItem>
                      </>
                    )}
                    {role === "center_manager" &&
                      unit.status === "PENDING_REVIEW" && (
                        <DropdownMenuItem
                          onClick={() =>
                            openEditor({ kind: "request-changes" })
                          }
                        >
                          Yêu cầu chỉnh sửa
                        </DropdownMenuItem>
                      )}
                    {role === "center_manager" &&
                      unit.status === "APPROVED" && (
                        <DropdownMenuItem onClick={() => setDeleting("unit")}>
                          Lưu trữ giáo trình
                        </DropdownMenuItem>
                      )}
                    {role === "center_manager" &&
                      !["PENDING_REVIEW", "APPROVED"].includes(unit.status) && (
                        <DropdownMenuItem disabled>
                          Chưa có thao tác xác nhận
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        }
      />
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {unit && (
          <>
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge
                    category="curriculum"
                    status={curriculumStage(unit)}
                  />
                  {curriculumEffectiveLabel(unit, today) && <p className="text-sm text-muted-foreground">{curriculumEffectiveLabel(unit, today)}</p>}
                  <p className="text-sm text-muted-foreground">
                    {regular.length} bài học · Mỗi buổi một bài
                  </p>
                </div>
                <ApprovalSteps unit={unit} />
                <ComparisonNotice comparison={comparison} />
                {canEdit && (
                  <p className="text-sm text-muted-foreground">
                    Kiểm tra cấu trúc trước khi gửi giáo viên thẩm định. Bài
                    kiểm tra được giáo viên tạo riêng theo buổi học.
                  </p>
                )}
                {unit.status === "APPROVED" && (
                  <p className="text-sm text-muted-foreground">
                    Nội dung đã duyệt được giữ nguyên. Mọi thay đổi được chuẩn
                    bị trong giáo trình của kỳ tiếp theo.
                  </p>
                )}
              </CardContent>
            </Card>
            {canEdit && blockedReason && (
              <p
                id="curriculum-submit-blocked"
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/60 dark:text-amber-200"
              >
                <b>Chưa gửi thẩm định được.</b> {blockedReason}
              </p>
            )}
            {showReadiness && readiness && (
              <CurriculumReadinessCards
                unit={unit}
                readiness={readiness}
                lessonCount={regular.length}
                validated={ready}
                canManageClasses={role === "center_manager"}
              />
            )}
            <ApiFeedback error={error} />
            {notice && (
              <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm">
                {notice}
              </p>
            )}
            {(unit.reviewNote || unit.technicalReviewNote) && (
              <Card>
                <CardHeader>
                  <CardTitle>Nhận xét và nội dung cần sửa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unit.technicalReviewNote && (
                    <div>
                      <p className="text-sm font-medium">Giáo viên thẩm định</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {unit.technicalReviewNote}
                      </p>
                    </div>
                  )}
                  {unit.reviewNote && (
                    <div>
                      <p className="text-sm font-medium">Quản lý</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {unit.reviewNote}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {validation.data && canEdit && (
              <div
                role="status"
                className="space-y-2 rounded-xl bg-muted p-4 text-sm"
              >
                <p className="font-medium">
                  {ready
                    ? "Cấu trúc giáo trình hợp lệ, có thể gửi thẩm định."
                    : validation.data.revision !== unit.revision
                      ? "Nội dung đã thay đổi. Kiểm tra giáo trình lại trước khi gửi."
                      : "Giáo trình cần bổ sung."}{" "}
                  · {validation.data.lessonCount} bài học
                </p>
                {!!validation.data.errors.length && (
                  <ul className="list-inside list-disc space-y-1">
                    {validation.data.errors.map((item, index) => (
                      <li key={item.code + index}>
                        {(
                          {
                            EMPTY_CURRICULUM: "Thêm ít nhất một bài học.",
                            LESSON_SEQUENCE_GAP:
                              "Sắp thứ tự bài học liên tục từ 1.",
                          } as Record<string, string>
                        )[item.code] ?? item.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">Bài học ({regular.length})</h2>
                <div className="flex flex-wrap gap-2">
                  {(
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
                      variant={changeFilter === filter ? "secondary" : "ghost"}
                      onClick={() => void setChangeFilter(filter)}
                    >
                      {filter === "all"
                        ? "Tất cả"
                        : filter === "changed"
                          ? "Chỉ bài thay đổi"
                          : LESSON_CHANGE_LABELS[filter]}
                    </Button>
                  ))}
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
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                <div className="min-w-0 overflow-x-auto rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Tên bài · nội dung tóm tắt</TableHead>
                        <TableHead
                          aria-disabled="true"
                          title="Chờ hỗ trợ chương từ hệ thống"
                        >
                          Chương · chưa hỗ trợ
                        </TableHead>
                        <TableHead>So với bản đối chiếu</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonRows.map((row) => (
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
                              {row.lesson.content}
                            </p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            —
                          </TableCell>
                          <TableCell>
                            {LESSON_CHANGE_LABELS[row.change]}
                          </TableCell>
                          <TableCell>
                            {canEdit && row.change !== "removed" ? (
                              <div className="flex gap-1">
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
                                    <DropdownMenuItem
                                      disabled={
                                        regular[0]?.id === row.lesson.id
                                      }
                                      onClick={() => move(row.lesson.id, -1)}
                                    >
                                      Đưa bài lên
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={
                                        regular.at(-1)?.id === row.lesson.id
                                      }
                                      onClick={() => move(row.lesson.id, 1)}
                                    >
                                      Đưa bài xuống
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void setSelectedLessonId(row.lesson.id)
                                }
                              >
                                Đọc
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
                          : "Thêm bài học hoặc nhập danh sách từ CSV."
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
            {canTechnicalReview && (
              <section id="curriculum-decision" className="scroll-mt-24">
                <CurriculumTechnicalReviewForm
                  unit={unit}
                  onStateChange={setFormState}
                  onSaved={(approved) => {
                    if (approved)
                      setNotice("Đã lưu kết quả thẩm định chuyên môn.");
                    else router.push(ROUTES.TEACHER.CURRICULUM);
                  }}
                />
              </section>
            )}
            {canConfirm && (
              <StickyFormFooter>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => openEditor({ kind: "request-changes" })}
                >
                  Trả lại để sửa
                </Button>
                <Button disabled={busy} onClick={() => setConfirmApply(true)}>
                  Xác nhận áp dụng
                </Button>
              </StickyFormFooter>
            )}
            <Sheet
              open={editor?.kind === "lesson"}
              onOpenChange={(open) => {
                if (!open && !formState.busy)
                  if (formState.dirty) setDiscard(true);
                  else closeEditor();
              }}
            >
              <SheetContent
                className="flex w-full flex-col overflow-y-auto sm:max-w-2xl"
                showCloseButton={false}
              >
                <SheetHeader>
                  <SheetTitle>
                    {editor?.lesson
                      ? `Sửa bài ${editor.lesson.sequence}`
                      : "Thêm bài học"}
                  </SheetTitle>
                  <SheetDescription>{unit.title}</SheetDescription>
                </SheetHeader>
                {editor?.kind === "lesson" && canEdit && (
                  <LessonForm
                    key={editor.lesson?.id ?? "new"}
                    unit={unit}
                    lesson={editor.lesson}
                    onStateChange={setFormState}
                    onSaved={() =>
                      saved(
                        "Đã lưu bài học. Kiểm tra lại cấu trúc trước khi gửi thẩm định.",
                      )
                    }
                  />
                )}
                <Button
                  variant="outline"
                  disabled={formState.busy}
                  onClick={() =>
                    formState.dirty ? setDiscard(true) : closeEditor()
                  }
                >
                  Đóng
                </Button>
              </SheetContent>
            </Sheet>
            <Dialog
              open={!!editor && editor.kind !== "lesson"}
              onOpenChange={(open) => {
                if (!open && !formState.busy) {
                  if (formState.dirty) setDiscard(true);
                  else closeEditor();
                }
              }}
            >
              <DialogContent
                size={
                  editor?.kind === "lesson" || editor?.kind === "import"
                    ? "full"
                    : "xl"
                }
                showCloseButton={false}
              >
                <DialogHeader>
                  <DialogTitle>
                    {editor ? editorTitles[editor.kind] : "Giáo trình"}
                  </DialogTitle>
                  <DialogDescription>{unit.title}</DialogDescription>
                </DialogHeader>
                {editor?.kind === "unit" && canEdit && (
                  <UnitForm
                    key={unit.id}
                    unit={unit}
                    onStateChange={setFormState}
                    onSaved={() => saved("Đã lưu thông tin giáo trình.")}
                  />
                )}
                {editor?.kind === "import" && canEdit && user && (
                  <CurriculumImport
                    unit={unit}
                    userId={user.id}
                    onStateChange={setFormState}
                  />
                )}
                {editor?.kind === "submit" && canEdit && ready && (
                  <CurriculumSubmitForm
                    unit={unit}
                    onStateChange={setFormState}
                    onSaved={() =>
                      saved("Đã gửi giáo viên thẩm định chuyên môn.")
                    }
                  />
                )}
                {editor?.kind === "technical-review" && canTechnicalReview && (
                  <CurriculumTechnicalReviewForm
                    unit={unit}
                    onStateChange={setFormState}
                    onSaved={(approved) => {
                      if (approved)
                        saved("Đã lưu kết quả thẩm định chuyên môn.");
                      else {
                        closeEditor();
                        router.push(ROUTES.TEACHER.CURRICULUM);
                      }
                    }}
                  />
                )}
                {editor?.kind === "revision" && canRevise && (
                  <CurriculumRevisionForm
                    unit={unit}
                    onStateChange={setFormState}
                    onCreated={(id, source) => {
                      closeEditor();
                      router.push(
                        `${ROUTES.MANAGER.CURRICULUM_UNIT(id)}${source === "csv" ? "?editor=import" : ""}`,
                      );
                    }}
                  />
                )}
                {editor?.kind === "request-changes" &&
                  role === "center_manager" &&
                  unit.status === "PENDING_REVIEW" && (
                    <CurriculumRequestChangesForm
                      unit={unit}
                      onStateChange={setFormState}
                      onSaved={() => saved("Đã gửi yêu cầu chỉnh sửa.")}
                    />
                  )}
                <Button
                  variant="outline"
                  disabled={formState.busy}
                  onClick={() =>
                    formState.dirty ? setDiscard(true) : closeEditor()
                  }
                >
                  Đóng
                </Button>
              </DialogContent>
            </Dialog>
            <ConfirmDialog
              open={discard}
              onOpenChange={setDiscard}
              title="Bỏ thay đổi chưa lưu?"
              description="Nội dung bạn đang soạn chưa được lưu. Đóng sẽ bỏ các thay đổi này."
              confirmText="Bỏ thay đổi"
              cancelText="Tiếp tục soạn"
              variant="danger"
              onConfirm={closeEditor}
            />
            <ConfirmDialog
              open={confirmApply}
              onOpenChange={setConfirmApply}
              title="Xác nhận áp dụng giáo trình?"
              description={`Giáo trình áp dụng từ ${calendarDateLabel(unit.fromDate.slice(0, 10))} đến ${calendarDateLabel(unit.toDate.slice(0, 10))}. Bản tương lai chờ đến ngày bắt đầu; bản cũ tự lưu trữ khi sang kỳ mới. Các buổi đã sinh được giữ nguyên.`}
              confirmText="Xác nhận áp dụng"
              isLoading={approve.isPending}
              onConfirm={async () => {
                try {
                  await approve.mutateAsync(undefined);
                  setNotice("Đã xác nhận giáo trình để áp dụng.");
                } catch {
                  /* API feedback remains visible. */
                }
              }}
            />
            <ConfirmDialog
              open={!!deleting}
              onOpenChange={(open) => {
                if (!open) setDeleting(null);
              }}
              variant={unit.status === "APPROVED" ? "default" : "danger"}
              title={
                deleting === "unit"
                  ? unit.status === "APPROVED"
                    ? "Lưu trữ giáo trình?"
                    : "Xóa giáo trình nháp?"
                  : "Xóa bài học?"
              }
              description={deleting === "unit" ? unit.title : deleting?.title}
              isLoading={remove.isPending || removeLesson.isPending}
              onConfirm={async () => {
                try {
                  if (deleting === "unit") await remove.mutateAsync(undefined);
                  else if (deleting)
                    await removeLesson.mutateAsync(deleting.id);
                } catch {
                  /* API feedback remains visible. */
                }
              }}
            />
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
