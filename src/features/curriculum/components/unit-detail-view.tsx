"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
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
import type { CurriculumLesson } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { curriculumStage } from "../presentation";
import {
  useCurriculumUnit,
  useCurriculumMutation,
} from "../hooks/use-curriculum";
import type { CurriculumFormState } from "../hooks/use-curriculum-form";
import { UnitForm } from "./unit-form";
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
  const user = useCurrentUser();
  const router = useRouter();
  const query = useCurriculumUnit(unitId);
  const [selectedLessonId, setSelectedLessonId] = useQueryState(
    "lesson",
    parseAsString.withDefault(""),
  );
  const [editor, setEditor] = useState<Editor | null>(null);
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
  const canEdit =
    role === "curriculum_designer" &&
    unit?.designerId === user?.id &&
    unit?.status === "DRAFT";
  const canRevise =
    role === "curriculum_designer" &&
    unit?.designerId === user?.id &&
    unit?.status === "APPROVED";
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
  const selected =
    regular.find((lesson) => lesson.id === selectedLessonId) ?? regular[0];
  const ready =
    !!validation.data?.ready && validation.data.revision === unit?.revision;
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
                  disabled={busy}
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
                  onClick={() => openEditor({ kind: "technical-review" })}
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
                  <p className="text-sm text-muted-foreground">
                    {regular.length} bài học · Mỗi buổi một bài
                  </p>
                </div>
                <ol
                  className="grid gap-3 text-sm sm:grid-cols-3"
                  aria-label="Quy trình giáo trình"
                >
                  <li className="rounded-xl bg-muted p-3">
                    <span className="font-medium">1. Soạn nội dung</span>
                    <p className="mt-1 text-muted-foreground">
                      {unit.status === "DRAFT"
                        ? "Bổ sung bài học và kiểm tra cấu trúc."
                        : "Đã hoàn tất bản nháp."}
                    </p>
                  </li>
                  <li className="rounded-xl bg-muted p-3">
                    <span className="font-medium">2. Thẩm định chuyên môn</span>
                    <p className="mt-1 text-muted-foreground">
                      {unit.reviewerTeacher?.displayName ||
                        unit.reviewerTeacher?.email ||
                        "Chọn giáo viên khi gửi thẩm định."}
                      {unit.technicalReviewedAt ? " · Đã đồng ý." : ""}
                    </p>
                  </li>
                  <li className="rounded-xl bg-muted p-3">
                    <span className="font-medium">3. Xác nhận áp dụng</span>
                    <p className="mt-1 text-muted-foreground">
                      {unit.status === "APPROVED"
                        ? "Đã được quản lý xác nhận."
                        : unit.technicalReviewedAt
                          ? "Chờ quản lý xác nhận."
                          : "Sau khi hoàn tất thẩm định chuyên môn."}
                    </p>
                  </li>
                </ol>
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
            <div className="grid items-start gap-5 lg:grid-cols-3">
              <Card className="min-w-0">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Bài học ({regular.length})</CardTitle>
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
                </CardHeader>
                <CardContent>
                  {regular.length ? (
                    <nav
                      aria-label="Danh sách bài học"
                      className="max-h-96 space-y-2 overflow-y-auto"
                    >
                      {regular.map((lesson) => (
                        <Button
                          key={lesson.id}
                          variant={
                            selected?.id === lesson.id ? "secondary" : "ghost"
                          }
                          className="h-auto min-h-11 w-full justify-start gap-3 whitespace-normal text-left"
                          aria-current={
                            selected?.id === lesson.id ? "true" : undefined
                          }
                          onClick={() => void setSelectedLessonId(lesson.id)}
                        >
                          <span className="shrink-0 font-medium">
                            {lesson.sequence}.
                          </span>
                          <span className="min-w-0 break-words">
                            {lesson.title}
                          </span>
                        </Button>
                      ))}
                    </nav>
                  ) : (
                    <EmptyState
                      title="Chưa có bài học"
                      description="Thêm bài học hoặc nhập danh sách từ CSV."
                      actionLabel={
                        canEdit ? "Thêm bài học đầu tiên" : undefined
                      }
                      onAction={
                        canEdit
                          ? () => openEditor({ kind: "lesson" })
                          : undefined
                      }
                    />
                  )}
                </CardContent>
              </Card>
              <Card className="min-w-0 lg:col-span-2">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {selected
                          ? "Bài " + selected.sequence
                          : "Nội dung bài học"}
                      </p>
                      <CardTitle className="break-words">
                        {selected?.title ?? "Chọn bài để đọc nội dung"}
                      </CardTitle>
                    </div>
                    {selected && canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              aria-label={"Thao tác với bài " + selected.title}
                            />
                          }
                        >
                          Thao tác bài học
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              openEditor({ kind: "lesson", lesson: selected })
                            }
                          >
                            Sửa nội dung
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={regular[0]?.id === selected.id}
                            onClick={() => move(selected.id, -1)}
                          >
                            Đưa bài lên
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={regular.at(-1)?.id === selected.id}
                            onClick={() => move(selected.id, 1)}
                          >
                            Đưa bài xuống
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(selected)}
                          >
                            Xóa bài học
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selected ? (
                    <article
                      aria-label={"Nội dung bài " + selected.sequence}
                      className="whitespace-pre-wrap wrap-anywhere text-sm leading-7"
                    >
                      {selected.content}
                    </article>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nội dung sẽ xuất hiện tại đây sau khi thêm bài học.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Dialog
              open={!!editor}
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
                    onCreated={(id) => {
                      closeEditor();
                      router.push(ROUTES.MANAGER.CURRICULUM_UNIT(id));
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
              description="Giáo viên đã đồng ý về chuyên môn. Giáo trình được dùng để tạo lịch học sau khi xác nhận."
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
