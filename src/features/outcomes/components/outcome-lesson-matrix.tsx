"use client";
import { useEffect, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { curriculumApi } from "@/features/curriculum/api";
import { curriculumKeys } from "@/features/curriculum/hooks/use-curriculum";
import { userFacingMessage } from "@/lib/api/error-message";
import { formatDate } from "@/lib/format";
import type { CurriculumUnit } from "@/types/curriculum";
import { outcomeApi } from "../api";
import {
  changedLessonIds,
  countUnlinkedAfterEdit,
  initialSelection,
  isUnitLocked,
  lessonLabel,
  orderLessons,
  outcomeIdsToSave,
} from "../outcome-matrix";

const UNIT_STATUS_TEXT: Record<CurriculumUnit["status"], string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đang dùng",
  ARCHIVED: "Đã lưu trữ",
};
/** Số bài lưu cùng lúc; vừa đủ nhanh mà không dồn BE. */
const SAVE_CONCURRENCY = 3;

/**
 * Gắn mục tiêu của một bộ nháp cho nhiều bài cùng lúc (`?outcomeMatrix=`). Hàng là bài của mọi giáo trình
 * chưa lưu trữ của khóa, cột là mục tiêu của bộ nháp, mỗi ô là một ô tick. Lưu từng bài qua
 * `PATCH academic/lessons/:id/outcomes`; API này thay toàn bộ liên kết của bài nên liên kết tới bộ khác
 * luôn được gửi kèm. Các ô tick chỉ là lựa chọn chờ lưu, không phải form nhập liệu, nên giữ bằng state cục bộ.
 */
export function OutcomeLessonMatrix({
  programId,
  programName,
  setId,
  onSelectSet,
  onBack,
}: {
  programId: string;
  programName?: string;
  setId: string | null;
  onSelectSet: (setId: string) => void;
  onBack: () => void;
}) {
  const client = useQueryClient();
  const sets = useLiveQuery(["outcome-sets", programId, "all"], (signal) =>
    outcomeApi.sets(programId, signal),
  );
  const units = useLiveQuery(
    ["outcome-matrix", "units", programId],
    (signal) => curriculumApi.units(programId, signal),
  );
  const usableUnits = (units.data ?? []).filter(
    (unit) => !isUnitLocked(unit.status),
  );
  const archivedCount = (units.data?.length ?? 0) - usableUnits.length;
  const details = useQueries({
    queries: usableUnits.map((unit) => ({
      queryKey: curriculumKeys.unit(unit.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        curriculumApi.unit(unit.id, signal),
      retry: false,
    })),
  });
  const draftSets = (sets.data ?? []).filter((set) => set.status === "DRAFT");
  const activeSet = draftSets.find((set) => set.id === setId) ?? draftSets[0];

  const groups = usableUnits.flatMap((unit, index) => {
    // Bài kiểm tra tháng có dãy số riêng: giữ hàng, ghi nhãn theo tháng, xếp sau bài học.
    const lessons = details[index]?.data?.lessons;
    return lessons ? [{ unit, lessons: orderLessons(lessons) }] : [];
  });
  const lessonIds = groups.flatMap((group) =>
    group.lessons.map((lesson) => lesson.id),
  );
  const baseline: Map<string, Set<string>> = activeSet
    ? initialSelection(activeSet, lessonIds)
    : new Map();
  // Chỉ giữ các bài đã bị đổi so với máy chủ; bài không đổi lấy thẳng từ `baseline`.
  const [overrides, setOverrides] = useState<Map<string, Set<string>>>(
    () => new Map(),
  );
  const selection = new Map<string, Set<string>>(baseline);
  for (const [lessonId, ids] of overrides) selection.set(lessonId, ids);
  const changed = changedLessonIds(baseline, selection);
  const [errors, setErrors] = useState<Map<string, string>>(() => new Map());
  const [saving, setSaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Báo khi đóng tab hoặc tải lại lúc còn tick chưa lưu.
  useEffect(() => {
    if (!changed.length) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed.length]);

  const toggle = (lessonId: string, outcomeId: string) => {
    const next = new Set(selection.get(lessonId));
    if (!next.delete(outcomeId)) next.add(outcomeId);
    setOverrides((current) => new Map(current).set(lessonId, next));
    setErrors((current) => {
      if (!current.has(lessonId)) return current;
      const copy = new Map(current);
      copy.delete(lessonId);
      return copy;
    });
  };

  const lessonTitle = (lessonId: string) => {
    for (const group of groups) {
      const lesson = group.lessons.find((item) => item.id === lessonId);
      if (lesson) return `${lessonLabel(lesson)} (${group.unit.title})`;
    }
    return "Bài học";
  };

  const save = async () => {
    if (!activeSet || !changed.length) return;
    setSaving(true);
    try {
      // Lấy lại danh sách bộ ngay trước khi dựng: người khác có thể vừa gắn bài vào bộ khác.
      const fresh = await outcomeApi.sets(programId);
      const failed = new Map<string, string>();
      const queue = [...changed];
      const worker = async () => {
        for (let lessonId = queue.shift(); lessonId; lessonId = queue.shift()) {
          try {
            await outcomeApi.mapLesson(
              lessonId,
              outcomeIdsToSave(
                lessonId,
                selection.get(lessonId) ?? new Set(),
                fresh,
                activeSet.id,
              ),
            );
          } catch (error) {
            failed.set(lessonId, userFacingMessage(error));
          }
        }
      };
      await Promise.all(
        Array.from({ length: SAVE_CONCURRENCY }, () => worker()),
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["web-api"] }),
        client.invalidateQueries({ queryKey: curriculumKeys.all }),
      ]);
      // Bài đã lưu thì bỏ phần chờ lưu; bài lỗi giữ nguyên tick để sửa rồi lưu lại.
      setOverrides((current) => {
        const kept = new Map<string, Set<string>>();
        for (const [lessonId, ids] of current)
          if (failed.has(lessonId)) kept.set(lessonId, ids);
        return kept;
      });
      setErrors(failed);
      const saved = changed.length - failed.size;
      if (failed.size) toast.error(`Đã lưu ${saved} bài, còn ${failed.size} bài lỗi.`);
      else toast.success(`Đã lưu ${saved} bài.`);
    } catch (error) {
      toast.error(userFacingMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => (changed.length ? setConfirmLeave(true) : onBack());
  const unitsLoading = details.some((query) => query.isPending);
  const unitError = details.find((query) => query.isError);
  const unlinked = activeSet
    ? countUnlinkedAfterEdit(activeSet, selection, new Set(lessonIds))
    : 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={goBack}>
          Quay lại danh sách
        </Button>
        {draftSets.length > 1 && activeSet && (
          <Select
            value={activeSet.id}
            items={draftSets.map((set) => ({
              value: set.id,
              label: `${set.level} · bản ${set.version}`,
            }))}
            disabled={changed.length > 0}
            onValueChange={(value) => {
              if (typeof value === "string" && value !== activeSet.id) onSelectSet(value);
            }}
          >
            <SelectTrigger
              className="w-64 rounded-xl"
              aria-label="Chọn bộ mục tiêu"
              title={
                changed.length
                  ? "Lưu hoặc bỏ thay đổi trước khi đổi bộ."
                  : undefined
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {draftSets.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.level} · bản {set.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <AsyncBoundary
        isLoading={sets.isPending || units.isPending}
        isError={sets.isError || units.isError}
        error={sets.error ?? units.error}
        onRetry={() => {
          void sets.refetch();
          void units.refetch();
        }}
      >
        {!activeSet ? (
          <Alert>
            <AlertTitle>Khóa chưa có bộ mục tiêu nháp</AlertTitle>
            <AlertDescription>
              Tạo bộ mục tiêu nháp ở danh sách mục tiêu của {programName ?? "khóa"}{" "}
              rồi quay lại đây để gắn bài.
            </AlertDescription>
          </Alert>
        ) : !activeSet.outcomes.length ? (
          <Alert>
            <AlertTitle>Bộ chưa có mục tiêu nào</AlertTitle>
            <AlertDescription>
              Thêm mục tiêu cho bộ “{activeSet.level}” trước khi gắn bài.
            </AlertDescription>
          </Alert>
        ) : !usableUnits.length ? (
          <Alert>
            <AlertTitle>Khóa chưa có giáo trình để gắn</AlertTitle>
            <AlertDescription>
              Hãy tạo giáo trình nháp trước.
              {archivedCount > 0 &&
                ` ${archivedCount} giáo trình đã lưu trữ không gắn mục tiêu được.`}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {activeSet.level} · bản {activeSet.version}
                </p>
                <p role="status" className="text-sm text-muted-foreground">
                  {unlinked > 0
                    ? `Còn ${unlinked} mục tiêu chưa có bài.`
                    : "Mọi mục tiêu đã có bài."}
                </p>
              </div>
              <Button
                onClick={() => void save()}
                disabled={!changed.length || saving || unitsLoading}
                isLoading={saving}
              >
                {changed.length ? `Lưu ${changed.length} bài` : "Chưa có thay đổi"}
              </Button>
            </div>
            {unitError && (
              <Alert variant="warning">
                <AlertTitle>Có giáo trình chưa tải được</AlertTitle>
                <AlertDescription>
                  {userFacingMessage(unitError.error)} Bài của giáo trình đó chưa hiện trong bảng.
                </AlertDescription>
              </Alert>
            )}
            {archivedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {archivedCount} giáo trình đã lưu trữ được ẩn vì không gắn mục tiêu được.
              </p>
            )}
            {errors.size > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Chưa lưu được {errors.size} bài</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {[...errors].map(([lessonId, message]) => (
                      <li key={lessonId}>
                        {lessonTitle(lessonId)}: {message}
                      </li>
                    ))}
                  </ul>
                  Các ô bạn đã chọn ở những bài này vẫn được giữ.
                </AlertDescription>
              </Alert>
            )}
            {unitsLoading && (
              <p className="text-sm text-muted-foreground">Đang tải bài học…</p>
            )}
            <div className="max-h-[70dvh] overflow-auto rounded-2xl border border-border bg-card">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky top-0 left-0 z-20 min-w-56 border-b border-border bg-muted px-3 py-2 text-left font-medium"
                    >
                      Bài học
                    </th>
                    {activeSet.outcomes.map((outcome) => (
                      <th
                        key={outcome.id}
                        scope="col"
                        title={`${outcome.title}\n${outcome.statement}`}
                        className="sticky top-0 z-10 min-w-24 border-b border-border bg-muted px-2 py-2 text-center font-medium"
                      >
                        {outcome.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map(({ unit, lessons }) => (
                  <tbody key={unit.id}>
                    <tr>
                      <th
                        colSpan={activeSet.outcomes.length + 1}
                        scope="colgroup"
                        className="border-b border-border bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                      >
                        {unit.title} · {formatDate(unit.fromDate)} – {formatDate(unit.toDate)} ·{" "}
                        {UNIT_STATUS_TEXT[unit.status]}
                      </th>
                    </tr>
                    {lessons.map((lesson) => (
                      <tr key={lesson.id}>
                        <th
                          scope="row"
                          className="sticky left-0 z-10 border-b border-border bg-card px-3 py-2 text-left font-normal"
                        >
                          <span className="font-medium">{lessonLabel(lesson)}</span> · {lesson.title}
                          {errors.has(lesson.id) && (
                            <span className="block text-xs text-destructive">
                              Chưa lưu được
                            </span>
                          )}
                        </th>
                        {activeSet.outcomes.map((outcome) => (
                          <td
                            key={outcome.id}
                            className="border-b border-border px-2 py-2 text-center"
                          >
                            <Checkbox
                              checked={!!selection.get(lesson.id)?.has(outcome.id)}
                              onCheckedChange={() => toggle(lesson.id, outcome.id)}
                              disabled={saving}
                              aria-label={`Gắn ${outcome.code} cho ${lessonLabel(lesson)}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </div>
        )}
      </AsyncBoundary>
      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Bỏ các thay đổi chưa lưu?"
        description={`Bạn đã chọn thay đổi cho ${changed.length} bài mà chưa lưu. Rời màn này sẽ mất các lựa chọn đó.`}
        confirmText="Bỏ thay đổi"
        variant="danger"
        onConfirm={() => {
          setConfirmLeave(false);
          setOverrides(new Map());
          onBack();
        }}
      />
    </div>
  );
}
