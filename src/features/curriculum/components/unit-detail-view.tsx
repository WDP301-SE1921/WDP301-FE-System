"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { reviewReasonSchema } from "@/lib/validators/curriculum";
import type { CurriculumLesson } from "@/types/curriculum";
import { curriculumApi } from "../api";
import {
  useCurriculumUnit,
  useCurriculumMutation,
} from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";
import { LessonForm, MonthlyTestForm } from "./lesson-form";
import { CurriculumImport } from "./curriculum-import";

interface Editor {
  kind: "unit" | "LESSON" | "MONTHLY_TEST";
  lesson?: CurriculumLesson;
}
export function CurriculumUnitDetailView({ unitId }: { unitId: string }) {
  const role = useCurrentRole();
  const user = useCurrentUser();
  const router = useRouter();
  const query = useCurriculumUnit(unitId);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [deleting, setDeleting] = useState<"unit" | CurriculumLesson | null>(
    null,
  );
  const validation = useMutation({
    mutationFn: () => curriculumApi.validation(unitId),
    retry: false,
  });
  const submit = useCurriculumMutation(() => curriculumApi.submit(unitId));
  const approve = useCurriculumMutation(() => curriculumApi.approve(unitId));
  const revise = useCurriculumMutation(async () => {
    const result = await curriculumApi.revise(unitId);
    router.push(ROUTES.MANAGER.CURRICULUM_UNIT(result.id));
    return result;
  });
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
  const busy = [
    submit,
    approve,
    revise,
    remove,
    removeLesson,
    reorder,
    validation,
  ].some((m) => m.isPending);
  const error = [
    submit,
    approve,
    revise,
    remove,
    removeLesson,
    reorder,
    validation,
  ].find((m) => m.error)?.error;
  const regular =
    unit?.lessons
      .filter((lesson) => lesson.kind === "LESSON")
      .sort((a, b) => a.sequence - b.sequence) ?? [];
  function move(id: string, direction: number) {
    const ids = regular.map((lesson) => lesson.id);
    const index = ids.indexOf(id),
      target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }
  return (
    <PageContainer>
      <PageHeader
        title={unit?.title ?? "Học phần"}
        backHref={ROUTES.MANAGER.CURRICULUM}
        description={
          unit
            ? unit.track.subject +
              " · Khối " +
              unit.track.grade +
              " → " +
              unit.fromDate.slice(0, 10) +
              " → " +
              unit.toDate.slice(0, 10)
            : undefined
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
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge category="curriculum" status={unit.status} />
              <span className="text-sm text-muted-foreground">
                Phiên bản {unit.version}
              </span>
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditor({ kind: "unit" })}
                  >
                    Sửa học phần
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => setEditor({ kind: "LESSON" })}
                  >
                    Thêm bài học
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditor({ kind: "MONTHLY_TEST" })}
                  >
                    Soạn kiểm tra tháng
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setShowImport(!showImport)}
                  >
                    Nhập CSV
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    isLoading={validation.isPending}
                    onClick={() => validation.mutate()}
                  >
                    Kiểm tra giáo trình
                  </Button>
                  <Button
                    disabled={
                      busy ||
                      !validation.data?.ready ||
                      validation.data.revision !== unit.revision
                    }
                    isLoading={submit.isPending}
                    onClick={() => submit.mutate(undefined)}
                  >
                    Gửi duyệt
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setDeleting("unit")}
                  >
                    Xóa nháp
                  </Button>
                </>
              )}
              {role === "center_manager" &&
                unit.status === "PENDING_REVIEW" && (
                  <>
                    <Button
                      disabled={busy}
                      isLoading={approve.isPending}
                      onClick={() => approve.mutate(undefined)}
                    >
                      Duyệt học phần
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setShowReview(!showReview)}
                    >
                      Yêu cầu sửa
                    </Button>
                  </>
                )}
              {role === "center_manager" && unit.status === "APPROVED" && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDeleting("unit")}
                >
                  Lưu trữ học phần
                </Button>
              )}
              {role === "curriculum_designer" &&
                unit.designerId === user?.id &&
                unit.status === "APPROVED" && (
                  <Button
                    disabled={busy}
                    isLoading={revise.isPending}
                    onClick={() => revise.mutate(undefined)}
                  >
                    Tạo phiên bản nháp mới
                  </Button>
                )}
            </div>
            <ApiFeedback error={error} />
            {unit.reviewNote && (
              <Card>
                <CardHeader>
                  <CardTitle>Ghi chú từ quản lý</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{unit.reviewNote}</p>
                </CardContent>
              </Card>
            )}
            {validation.data && (
              <div role="status" className="space-y-2 rounded-xl bg-muted p-4">
                <p>
                  {validation.data.ready
                    ? "Cấu trúc giáo trình hợp lệ."
                    : "Giáo trình cần bổ sung."}{" "}
                  {validation.data.lessonCount} bài học ·{" "}
                  {validation.data.monthlyTestCount} kiểm tra tháng
                </p>
                {validation.data.revision !== unit.revision && (
                  <p>Nháp đã thay đổi. Kiểm tra lại trước khi gửi duyệt.</p>
                )}
                {validation.data.errors.map((item) => (
                  <ApiFeedback
                    key={item.code}
                    error={
                      new Error(
                        (
                          {
                            EMPTY_CURRICULUM: "Thêm ít nhất một bài học.",
                            LESSON_SEQUENCE_GAP: "Sắp bài liên tục từ 1.",
                            TEST_OUTSIDE_UNIT:
                              "Tháng kiểm tra phải nằm trong khoảng học phần.",
                          } as Record<string, string>
                        )[item.code] ?? item.message,
                      )
                    }
                  />
                ))}
              </div>
            )}
            {showReview &&
              role === "center_manager" &&
              unit.status === "PENDING_REVIEW" && (
                <ReviewChangesForm
                  unitId={unitId}
                  onSaved={() => setShowReview(false)}
                />
              )}
            {showImport && canEdit && user && (
              <CurriculumImport unit={unit} userId={user.id} />
            )}
            {editor && canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editor.kind === "unit"
                      ? "Sửa học phần"
                      : editor.kind === "LESSON"
                        ? "Soạn bài học"
                        : "Soạn kiểm tra tháng"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editor.kind === "unit" ? (
                    <UnitForm
                      key={unit.id + ":" + unit.revision}
                      unit={unit}
                      onSaved={() => setEditor(null)}
                    />
                  ) : editor.kind === "LESSON" ? (
                    <LessonForm
                      key={editor.lesson?.id ?? "new"}
                      unit={unit}
                      lesson={editor.lesson}
                      onSaved={() => setEditor(null)}
                    />
                  ) : (
                    <MonthlyTestForm
                      key={editor.lesson?.id ?? "new"}
                      unit={unit}
                      lesson={editor.lesson}
                      onSaved={() => setEditor(null)}
                    />
                  )}
                  <Button variant="ghost" onClick={() => setEditor(null)}>
                    Đóng
                  </Button>
                </CardContent>
              </Card>
            )}
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Bài học có thứ tự liên tục từ 1. Khi sinh lịch, buổi cuối mỗi
              tháng dùng bài kiểm tra tháng. Giáo trình đã duyệt được giữ
              nguyên; chỉnh sửa bằng phiên bản nháp mới.
            </p>
            {[...unit.lessons]
              .sort(
                (a, b) =>
                  a.kind.localeCompare(b.kind) || a.sequence - b.sequence,
              )
              .map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle>
                        {lesson.kind === "MONTHLY_TEST"
                          ? "Kiểm tra " + lesson.monthKey
                          : "Bài " + lesson.sequence}
                        : {lesson.title}
                      </CardTitle>
                      {canEdit && (
                        <div className="flex flex-wrap gap-2">
                          {lesson.kind === "LESSON" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy || regular[0]?.id === lesson.id}
                                onClick={() => move(lesson.id, -1)}
                                aria-label={"Đưa bài " + lesson.title + " lên"}
                              >
                                Lên
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={
                                  busy || regular.at(-1)?.id === lesson.id
                                }
                                onClick={() => move(lesson.id, 1)}
                                aria-label={
                                  "Đưa bài " + lesson.title + " xuống"
                                }
                              >
                                Xuống
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              setEditor({ kind: lesson.kind, lesson })
                            }
                          >
                            Sửa nội dung
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => setDeleting(lesson)}
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {lesson.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            {!unit.lessons.length && (
              <p className="text-muted-foreground">
                Chưa có bài học hoặc kiểm tra tháng.
              </p>
            )}
            <ConfirmDialog
              open={!!deleting}
              onOpenChange={(open) => {
                if (!open) setDeleting(null);
              }}
              variant={unit.status === "APPROVED" ? "default" : "danger"}
              title={
                deleting === "unit"
                  ? unit.status === "APPROVED"
                    ? "Lưu trữ học phần?"
                    : "Xóa học phần nháp?"
                  : "Xóa nội dung?"
              }
              description={deleting === "unit" ? unit.title : deleting?.title}
              isLoading={remove.isPending || removeLesson.isPending}
              onConfirm={async () => {
                try {
                  if (deleting === "unit") await remove.mutateAsync(undefined);
                  else if (deleting)
                    await removeLesson.mutateAsync(deleting.id);
                } catch {
                  /* feedback remains visible */
                }
              }}
            />
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
function ReviewChangesForm({
  unitId,
  onSaved,
}: {
  unitId: string;
  onSaved: () => void;
}) {
  const form = useForm<{ reason: string }>({
    resolver: zodResolver(reviewReasonSchema),
    defaultValues: { reason: "" },
  });
  const save = useCurriculumMutation(async ({ reason }: { reason: string }) => {
    const result = await curriculumApi.requestChanges(unitId, reason);
    onSaved();
    return result;
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yêu cầu designer sửa giáo trình</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((input) => save.mutate(input))}
        >
          <Label htmlFor="review-reason">Nội dung cần sửa</Label>
          <Textarea id="review-reason" {...form.register("reason")} />
          <FieldError message={form.formState.errors.reason?.message} />
          <ApiFeedback error={save.error} />
          <Button
            type="submit"
            disabled={save.isPending}
            isLoading={save.isPending}
          >
            Gửi yêu cầu sửa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
