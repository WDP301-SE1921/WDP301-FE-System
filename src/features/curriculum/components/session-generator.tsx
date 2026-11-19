"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { ApiError } from "@/lib/api/client";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
  scheduleRangeSchema,
  type ScheduleRangeInput,
} from "@/lib/validators/curriculum";
import type { RegistrationClass } from "@/types/backend";
import { curriculumApi } from "../api";
import { curriculumKeys, useCurriculumUnits } from "../hooks/use-curriculum";
import {
  clearGenerationAttempt,
  getGenerationAttempt,
  readGenerationAttempt,
  type GenerationAttempt,
} from "../generation-storage";
import { sessionTime } from "../session-format";
import { calendarDateLabel, todayInVietnam } from "@/lib/calendar-date";
import { defaultStartDate } from "@/features/registration-flow/program-setup";
import { applicableUnits } from "../generation-plan";

export function SessionGenerator({
  classroom,
  userId,
  classNames,
}: {
  classroom: RegistrationClass;
  userId: string;
  classNames: Record<string, string>;
}) {
  const client = useQueryClient();
  const now = useCurrentTime();
  const units = useCurriculumUnits(classroom.programId);
  const lock = useRef(false);
  const [restored] = useState(() => {
    try {
      return {
        attempt: readGenerationAttempt(userId, classroom.id),
        error: null,
      };
    } catch (error) {
      return { attempt: null, error };
    }
  });
  const [attempt, setAttempt] = useState<GenerationAttempt | null>(
    restored.attempt,
  );
  const form = useForm<ScheduleRangeInput>({
    resolver: zodResolver(scheduleRangeSchema),
    defaultValues: attempt?.body ?? {
      curriculumUnitId: "",
      // Ngày học đầu tiên sau hôm nay, hoặc sau buổi cuối đã có; sửa được.
      fromDate: defaultStartDate(
        todayInVietnam(),
        classroom.scheduledUntil,
        (classroom.weeklySchedules ?? []).map((item) => item.weekday),
      ),
    },
  });
  const values = useWatch({ control: form.control });
  const preview = useMutation({
    mutationFn: (input: ScheduleRangeInput) =>
      curriculumApi.preview(classroom.id, input),
    retry: false,
  });
  const generate = useMutation({
    mutationFn: async (input: ScheduleRangeInput) => {
      const operation = getGenerationAttempt(userId, classroom.id, input);
      setAttempt(operation);
      return curriculumApi.generate(
        classroom.id,
        operation.body,
        operation.key,
      );
    },
    retry: false,
    onSuccess: () => {
      clearGenerationAttempt(userId, classroom.id);
      setAttempt(null);
      preview.reset();
      void client.invalidateQueries({
        queryKey: curriculumKeys.sessions(classroom.id),
      });
      void client.invalidateQueries({ queryKey: ["academic-calendar"] });
      void client.invalidateQueries({
        queryKey: ["academic-generations", classroom.id],
      });
      void client.invalidateQueries({
        queryKey: ["registration-class", classroom.id],
      });
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        ![401, 403, 408, 429].includes(error.status) &&
        error.code !== "IDEMPOTENCY_CONFLICT"
      ) {
        clearGenerationAttempt(userId, classroom.id);
        setAttempt(null);
        preview.reset();
      }
    },
  });
  const matchingPreview =
    !!preview.data &&
    values.curriculumUnitId === preview.variables?.curriculumUnitId &&
    values.fromDate === preview.variables?.fromDate &&
    Date.parse(preview.data.expiresAt) > now;
  const conflicts =
    preview.data?.slots.some((slot) => slot.conflicts.length) ?? false;
  const busy = preview.isPending || generate.isPending;
  const approved =
    units.data?.filter((unit) => unit.status === "APPROVED") ?? [];
  // Lớp chưa có buổi: giáo trình là bản đã duyệt có kỳ chứa ngày bắt đầu. Lớp đã khai giảng chỉ
  // học tiếp giáo trình chứa buổi đầu tiên của nó, không bao giờ chuyển sang bản mới hơn.
  const started = !!classroom.scheduledFrom || !!classroom.scheduledUntil;
  const selectedUnit = started
    ? applicableUnits(approved, (classroom.scheduledFrom ?? "").slice(0, 10))[0]
    : applicableUnits(approved, values.fromDate ?? "")[0];
  const lockedMissing = started && units.isSuccess && !selectedUnit;
  useEffect(() => {
    if (attempt) return;
    form.setValue("curriculumUnitId", selectedUnit?.id ?? "");
  }, [attempt, form, selectedUnit?.id]);
  async function submit(input: ScheduleRangeInput) {
    if (lock.current || busy || restored.error) return;
    if (
      !attempt &&
      (!matchingPreview || conflicts || !preview.data?.slots.length)
    )
      return;
    lock.current = true;
    try {
      await generate.mutateAsync(
        attempt?.body ?? { ...input, previewId: preview.data!.previewId },
      );
    } catch {
      /* API feedback retains the operation for a manual retry. */
    } finally {
      lock.current = false;
    }
  }
  return (
    <div className="space-y-4">
      <ApiFeedback error={units.error} retry={() => void units.refetch()} />
      <ApiFeedback error={restored.error} />
      {attempt && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          Có lần tạo lịch học cần xác nhận lại. Thử lại sẽ dùng đúng giáo trình
          và ngày bắt đầu đã chọn.
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-from">Ngày bắt đầu</Label>
            <Input
              id="schedule-from"
              type="date"
              disabled={busy || !!attempt}
              {...form.register("fromDate")}
            />
            <FieldError message={form.formState.errors.fromDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-to">Ngày kết thúc (tự tính)</Label>
            <Input
              id="schedule-to"
              type="date"
              readOnly
              disabled
              value={
                matchingPreview
                  ? (preview.data!.endDate ?? preview.data!.toDate).slice(0, 10)
                  : ""
              }
            />
          </div>
        </div>
        {lockedMissing ? (
          <p className="text-sm text-muted-foreground">
            Lớp đã khai giảng nhưng không tìm thấy giáo trình đã duyệt mà lớp
            đang học. Mỗi lớp chỉ học một giáo trình nên chưa thể tạo thêm lịch
            học ở đây.
          </p>
        ) : selectedUnit ? (
          <p className="text-sm text-muted-foreground">
            Giáo trình: {selectedUnit.title}
            {started ? " (giáo trình lớp đã khai giảng)" : ""} (áp dụng{" "}
            {calendarDateLabel(selectedUnit.fromDate.slice(0, 10))} –{" "}
            {calendarDateLabel(selectedUnit.toDate.slice(0, 10))}). Số buổi tự
            tính theo số bài của giáo trình, mỗi buổi một bài.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {units.isSuccess && !approved.length
              ? "Chưa có giáo trình đã duyệt áp dụng cho khóa học của lớp này."
              : "Ngày bắt đầu chưa nằm trong kỳ áp dụng của giáo trình đã duyệt nào. Chọn ngày khác."}
          </p>
        )}
        <FieldError message={form.formState.errors.curriculumUnitId?.message} />
        {!lockedMissing && (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !!attempt || !!restored.error}
              isLoading={preview.isPending}
              onClick={form.handleSubmit((input) => preview.mutate(input))}
            >
              Xem trước lịch
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                !!restored.error ||
                (!attempt &&
                  (!matchingPreview ||
                    conflicts ||
                    !preview.data?.slots.length))
              }
              isLoading={generate.isPending}
            >
              {attempt ? "Thử tạo lịch học lại" : "Tạo lịch học"}
            </Button>
          </div>
        )}
      </form>
      <ApiFeedback error={preview.error ?? generate.error} />
      {generate.isSuccess && (
        <p role="status" className="text-sm text-primary">
          Đã tạo {generate.data.sessions.length} buổi học.
        </p>
      )}
      {matchingPreview && (
        <div className="space-y-3">
          <p className="font-medium">
            {preview.data!.slots.length} buổi, từ{" "}
            {calendarDateLabel(
              preview.data!.slots[0]
                ? todayInVietnam(new Date(preview.data!.slots[0].startsAt))
                : preview.data!.fromDate.slice(0, 10),
            )}{" "}
            đến{" "}
            {calendarDateLabel(
              (preview.data!.endDate ?? preview.data!.toDate).slice(0, 10),
            )}{" "}
            (tự tính theo{" "}
            {preview.data!.lessonCount ?? preview.data!.slots.length} bài của
            giáo trình)
            {conflicts
              ? " · Có xung đột, cần xử lý trước khi tạo lịch học"
              : ""}
          </p>
          {preview.data!.slots.map((slot, index) => (
            <div
              key={`${slot.startsAt}-${index}`}
              className="space-y-2 rounded-xl border border-border p-3"
            >
              <p className="text-sm font-medium">
                {sessionTime(slot.startsAt)} → {sessionTime(slot.endsAt)} ·{" "}
                {slot.lessonTitle}
                {slot.kind === "MONTHLY_TEST" ? " (Kiểm tra tháng)" : ""}
              </p>
              {slot.conflicts.map((conflict) => (
                <p key={conflict.id} className="text-sm text-destructive">
                  Trùng buổi {classNames[conflict.classId] ?? "lớp khác"}:{" "}
                  {sessionTime(conflict.startsAt)}
                </p>
              ))}
              {slot.makeupCandidates.map((candidate) => (
                <p key={candidate.id} className="text-xs text-muted-foreground">
                  Buổi cùng bài có thể học bù:{" "}
                  {classNames[candidate.classId] ?? "lớp khác"} ·{" "}
                  {sessionTime(candidate.startsAt)}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
