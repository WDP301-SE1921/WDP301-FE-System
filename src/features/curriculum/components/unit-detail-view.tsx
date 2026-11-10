"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
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
import { registrationApi } from "@/features/registration-flow/api";
import {
  classesNeedingSchedule,
  describeExcluded,
  schedulableClasses,
} from "@/features/registration-flow/program-setup";
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
import {
  canCopyCurriculum,
  curriculumEffectiveLabel,
  LESSON_CHANGE_LABELS,
} from "../workspace-selectors";
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
  neededLessons,
  useCurriculumReadiness,
} from "./curriculum-readiness";
import { LessonOutcomeDialog } from "@/features/outcomes/components/lesson-outcome-dialog";
import { LessonForm } from "./lesson-form";
import { LessonPositionDialog } from "./lesson-position-dialog";
import { moveLessonBy, moveLessonTo } from "../lesson-order";
import { hasBlockingCheck, submitChecklist } from "../submit-checklist";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  buildOutcomeMatrixHref,
  countUnlinked,
  unlinkedDraftOutcomes,
  unlinkedOutcomeSubmitNote,
} from "@/lib/outcome-links";
import { OutcomeLinkWarning } from "./outcome-link-warning";
import { CurriculumImport } from "./curriculum-import";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/lib/files/csv";
import { curriculumCsv, curriculumCsvTemplate } from "../csv-export";
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
  import: "Nhập bài từ file",
  submit: "Gửi duyệt",
  "technical-review": "Duyệt nội dung",
  revision: "Chuẩn bị giáo trình cho kỳ tiếp theo",
  "request-changes": "Trả lại giáo trình để sửa",
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
  const [scheduleOffer, setScheduleOffer] = useState<{
    count: number;
    href: string;
    excluded: string;
    allDone: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState<"unit" | CurriculumLesson | null>(
    null,
  );
  const [positionLesson, setPositionLesson] = useState<CurriculumLesson | null>(
    null,
  );
  const [mappingLesson, setMappingLesson] = useState<CurriculumLesson | null>(
    null,
  );
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
  // Bản đầu tiên không có bản để đối chiếu: ẩn cột, nút lọc, và bỏ qua ?lessonChanges= cũ trên URL.
  const hasComparison = !!comparison.previous;
  const effectiveFilter = hasComparison ? changeFilter : "all";
  const comparisonRows = comparison.rows.filter(
    (row) =>
      effectiveFilter === "all" ||
      (effectiveFilter === "changed"
        ? row.change !== "unchanged"
        : row.change === effectiveFilter),
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
    !!unit &&
    canCopyCurriculum(unit);
  const canTechnicalReview =
    role === "teacher" &&
    unit?.status === "PENDING_REVIEW" &&
    unit.reviewerTeacherId === user?.id &&
    !unit.technicalReviewedAt;
  const canConfirm =
    role === "center_manager" &&
    unit?.status === "PENDING_REVIEW" &&
    !!unit.technicalReviewedAt;
  // Người soạn gắn mục tiêu nháp vào bài được cả khi giáo trình đã gửi hoặc đã duyệt
  // áp dụng (BE B1); giáo trình đã lưu trữ thì BE trả LESSON_LOCKED.
  const canMapOutcomes =
    role === "curriculum_designer" &&
    unit?.designerId === user?.id &&
    !!unit &&
    ["DRAFT", "PENDING_REVIEW", "APPROVED"].includes(unit.status);
  // Cùng khóa cache với LessonOutcomeDialog nên gắn xong cảnh báo tự cập nhật.
  // Lỗi tải thì trang vẫn dùng được, chỉ không có cảnh báo.
  const outcomeSets = useLiveQuery(
    ["outcome-sets", unit?.programId, "all"],
    (signal) => academicApi.outcomeSets(unit!.programId, {}, signal),
    canMapOutcomes,
  );
  const unlinkedGroups = unlinkedDraftOutcomes(outcomeSets.data ?? []);
  const isOwnerDesigner =
    role === "curriculum_designer" && unit?.designerId === user?.id;
  const hasMenu =
    canEdit ||
    isOwnerDesigner ||
    (role === "center_manager" &&
      !!unit &&
      ["PENDING_REVIEW", "APPROVED"].includes(unit.status));
  const busy = [approve, remove, removeLesson, reorder].some(
    (mutation) => mutation.isPending,
  );
  const error = [approve, remove, removeLesson, reorder].find(
    (mutation) => mutation.error,
  )?.error;
  const regular =
    unit?.lessons
      .filter((lesson) => lesson.kind === "LESSON")
      .sort((a, b) => a.sequence - b.sequence) ?? [];
  // Danh sách kiểm tra gửi duyệt: tính ngay từ bài đang có, tự cập nhật khi thêm hoặc xóa bài.
  const showReadiness = canEdit;
  const { readiness, reviewerCount } = useCurriculumReadiness(
    unit,
    showReadiness,
  );
  const checks = submitChecklist({
    sequences: regular.map((lesson) => lesson.sequence),
    reviewerCount,
    neededLessons: neededLessons(readiness),
    unlinkedOutcomes: outcomeSets.data ? countUnlinked(unlinkedGroups) : undefined,
  });
  const blocked = hasBlockingCheck(checks);
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
  function download(createCsv: () => string, filename: string) {
    try {
      downloadCsv(createCsv(), filename);
    } catch {
      toast.error("Chưa tạo được file. Thử lại sau.");
    }
  }
  // Mọi cách đổi thứ tự đều gọi `reorder`; BE đánh lại số bài liên tục từ 1.
  function applyOrder(ids: string[] | null, done?: () => void, message?: string) {
    if (!ids) return;
    reorder.mutate(ids, {
      onSuccess: () => {
        done?.();
        if (message) toast.success(message);
      },
      onError: () =>
        toast.error("Chưa đổi được thứ tự bài. Thứ tự cũ được giữ nguyên."),
    });
  }
  const regularIds = regular.map((lesson) => lesson.id);
  const move = (id: string, direction: -1 | 1) =>
    applyOrder(moveLessonBy(regularIds, id, direction));
  const renumber = () =>
    applyOrder(regularIds, undefined, "Đã đánh số lại bài học.");
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
                  disabled={busy || blocked}
                  aria-describedby="curriculum-submit-checklist"
                  onClick={() => openEditor({ kind: "submit" })}
                >
                  Gửi duyệt
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
                  Duyệt nội dung
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
              {hasMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        disabled={busy}
                        aria-label="Thêm thao tác với giáo trình"
                      />
                    }
                  >
                    Thêm
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
                          Nhập bài từ file
                        </DropdownMenuItem>
                      </>
                    )}
                    {isOwnerDesigner && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            download(curriculumCsvTemplate, "giao-trinh-mau")
                          }
                        >
                          Tải file mẫu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={formState.dirty || !regular.length}
                          onClick={() =>
                            download(
                              () => curriculumCsv(unit.lessons),
                              unit.title,
                            )
                          }
                        >
                          Xuất bài ra file
                        </DropdownMenuItem>
                      </>
                    )}
                    {canEdit && (
                      <>
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
                          Trả lại để sửa
                        </DropdownMenuItem>
                      )}
                    {role === "center_manager" &&
                      unit.status === "APPROVED" && (
                        <DropdownMenuItem onClick={() => setDeleting("unit")}>
                          Lưu trữ giáo trình
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
                  {curriculumEffectiveLabel(unit, today) && (
                    <p className="text-sm text-muted-foreground">
                      {curriculumEffectiveLabel(unit, today)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {regular.length} bài học · Mỗi buổi một bài
                  </p>
                </div>
                <ApprovalSteps unit={unit} />
                {(comparison.previous || comparison.isPending || comparison.error) && (
                  <ComparisonNotice comparison={comparison} />
                )}
                {unit.status === "APPROVED" && (
                  <p className="text-sm text-muted-foreground">
                    Nội dung đã duyệt được giữ nguyên. Mọi thay đổi được chuẩn
                    bị trong giáo trình của kỳ tiếp theo.
                  </p>
                )}
              </CardContent>
            </Card>
            {canEdit && (
              <div id="curriculum-submit-checklist">
                <CurriculumReadinessCards
                  unit={unit}
                  readiness={readiness}
                  lessonCount={regular.length}
                  checks={checks}
                  onRenumber={renumber}
                  renumbering={reorder.isPending}
                />
              </div>
            )}
            <ApiFeedback error={error} />
            {notice && (
              <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm">
                {notice}
              </p>
            )}
            {scheduleOffer && (
              <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
                {scheduleOffer.count > 0 ? (
                  <Button render={<Link href={scheduleOffer.href} />}>
                    Tạo lịch học cho {scheduleOffer.count} lớp
                  </Button>
                ) : (
                  <p>
                    {scheduleOffer.allDone
                      ? "Mọi lớp đã có buổi học tới hết kỳ."
                      : "Chưa có lớp đủ điều kiện. Kiểm tra bước Lớp & giáo viên."}
                  </p>
                )}
                {scheduleOffer.excluded && (
                  <p className="text-muted-foreground">
                    Chưa tạo cho: {scheduleOffer.excluded}.
                  </p>
                )}
              </div>
            )}
            {(unit.reviewNote || unit.technicalReviewNote) && (
              <Card>
                <CardHeader>
                  <CardTitle>Nhận xét và nội dung cần sửa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unit.technicalReviewNote && (
                    <div>
                      <p className="text-sm font-medium">
                        Giáo viên duyệt nội dung
                      </p>
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
            {canMapOutcomes && unlinkedGroups.length > 0 && (
              <OutcomeLinkWarning
                groups={unlinkedGroups}
                onLink={() =>
                  router.push(buildOutcomeMatrixHref(unit.programId))
                }
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
                        variant={
                          effectiveFilter === filter ? "secondary" : "ghost"
                        }
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
                      render={
                        <Link href={buildOutcomeMatrixHref(unit.programId)} />
                      }
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
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                <div className="min-w-0 overflow-x-auto rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Tên bài · nội dung tóm tắt</TableHead>
                        {hasComparison && (
                          <TableHead>So với bản đối chiếu</TableHead>
                        )}
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
                                {row.lesson.content}
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
                                          onClick={() =>
                                            setMappingLesson(row.lesson)
                                          }
                                        >
                                          Gắn mục tiêu
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        disabled={regular.length < 2}
                                        onClick={() =>
                                          setPositionLesson(row.lesson)
                                        }
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
                                          onClick={() =>
                                            setMappingLesson(row.lesson)
                                          }
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
            {canTechnicalReview && (
              <section id="curriculum-decision" className="scroll-mt-24">
                <CurriculumTechnicalReviewForm
                  unit={unit}
                  onStateChange={setFormState}
                  onSaved={(approved) => {
                    if (approved) setNotice("Đã duyệt nội dung giáo trình.");
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
                  Duyệt áp dụng
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
                        "Đã lưu bài học.",
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
                {editor?.kind === "submit" && canEdit && (
                  <CurriculumSubmitForm
                    unit={unit}
                    outcomeNote={unlinkedOutcomeSubmitNote(unlinkedGroups)}
                    onStateChange={setFormState}
                    onSaved={() => saved("Đã gửi giáo viên duyệt nội dung.")}
                  />
                )}
                {editor?.kind === "technical-review" && canTechnicalReview && (
                  <CurriculumTechnicalReviewForm
                    unit={unit}
                    onStateChange={setFormState}
                    onSaved={(approved) => {
                      if (approved) saved("Đã duyệt nội dung giáo trình.");
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
              title="Duyệt áp dụng giáo trình?"
              description={`Giáo trình áp dụng từ ${calendarDateLabel(unit.fromDate.slice(0, 10))} đến ${calendarDateLabel(unit.toDate.slice(0, 10))}. Bản cho kỳ sau chờ tới ngày bắt đầu; bản cũ tự lưu trữ khi sang kỳ mới. Các buổi học đã tạo được giữ nguyên.`}
              confirmText="Duyệt áp dụng"
              isLoading={approve.isPending}
              onConfirm={async () => {
                try {
                  await approve.mutateAsync(undefined);
                  setNotice("Đã duyệt áp dụng giáo trình.");
                  try {
                    // Lớp đủ điều kiện (có giáo viên, đủ khung giờ) để mở thẳng màn Tạo lịch học.
                    const program = await registrationApi.program(unit.programId);
                    const { eligible, excluded } = schedulableClasses(
                      program.classes,
                      program.sessionsPerWeek,
                    );
                    const params = new URLSearchParams({
                      programId: unit.programId,
                      unitId: unit.id,
                    });
                    // Chỉ lớp chưa có buổi tới hết kỳ (và lớp chưa biết do BE cũ) mới cần tạo lịch.
                    const { needs, unknown } = classesNeedingSchedule(eligible, unit.toDate);
                    const targets = [...needs, ...unknown];
                    if (targets.length)
                      params.set("classIds", targets.map((c) => c.id).join(","));
                    setScheduleOffer({
                      count: targets.length,
                      href: `${ROUTES.MANAGER.SESSIONS}?${params.toString()}`,
                      excluded: describeExcluded(excluded),
                      allDone: eligible.length > 0 && targets.length === 0,
                    });
                  } catch {
                    setScheduleOffer(null);
                  }
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
            {canMapOutcomes && (
              <LessonOutcomeDialog
                lesson={mappingLesson}
                programId={unit.programId}
                isCurriculumApproved={unit.status === "APPROVED"}
                onClose={() => setMappingLesson(null)}
              />
            )}
            <LessonPositionDialog
              lesson={positionLesson}
              currentPosition={
                positionLesson
                  ? regularIds.indexOf(positionLesson.id) + 1
                  : 1
              }
              count={regular.length}
              busy={reorder.isPending}
              onClose={() => setPositionLesson(null)}
              onSubmit={(lesson, position) =>
                applyOrder(
                  moveLessonTo(regularIds, lesson.id, position),
                  () => setPositionLesson(null),
                )
              }
            />
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
