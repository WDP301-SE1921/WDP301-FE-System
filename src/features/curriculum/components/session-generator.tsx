"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { ApiError } from "@/lib/api/client";
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
      fromDate: "",
      toDate: "",
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
    values.toDate === preview.variables?.toDate;
  const conflicts =
    preview.data?.slots.some((slot) => slot.conflicts.length) ?? false;
  const busy = preview.isPending || generate.isPending;
  const approved =
    units.data?.filter((unit) => unit.status === "APPROVED") ?? [];
  const selectedUnit = units.data?.find(
    (unit) => unit.id === values.curriculumUnitId,
  );
  async function submit(input: ScheduleRangeInput) {
    if (lock.current || busy || restored.error) return;
    if (
      !attempt &&
      (!matchingPreview || conflicts || !preview.data?.slots.length)
    )
      return;
    lock.current = true;
    try {
      await generate.mutateAsync(input);
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
          Có thao tác sinh lịch cần xác nhận lại. Thử lại sẽ dùng nguyên học
          phần và khoảng ngày đã chọn.
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
      >
        <div className="space-y-2">
          <Label htmlFor="schedule-unit">Học phần đã duyệt</Label>
          <Controller
            control={form.control}
            name="curriculumUnitId"
            render={({ field }) => (
              <Select
                value={field.value || null}
                items={approved.map((unit) => ({
                  value: unit.id,
                  label: `${unit.title} · Phiên bản ${unit.version}`,
                }))}
                disabled={busy || !!attempt || !!restored.error}
                onValueChange={(value) => {
                  field.onChange(value ?? "");
                  const unit = approved.find((item) => item.id === value);
                  form.setValue("fromDate", unit?.fromDate.slice(0, 10) ?? "");
                  form.setValue("toDate", unit?.toDate.slice(0, 10) ?? "");
                  preview.reset();
                  generate.reset();
                }}
              >
                <SelectTrigger id="schedule-unit">
                  <SelectValue placeholder="Chọn học phần" />
                </SelectTrigger>
                <SelectContent>
                  {approved.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title} · Phiên bản {unit.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError
            message={form.formState.errors.curriculumUnitId?.message}
          />
          {units.isSuccess && !approved.length && (
            <p className="text-sm text-muted-foreground">
              Chưa có học phần đã duyệt cho môn và khối của lớp này.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-from">Từ ngày</Label>
            <Input
              id="schedule-from"
              type="date"
              min={selectedUnit?.fromDate.slice(0, 10)}
              max={selectedUnit?.toDate.slice(0, 10)}
              disabled={busy || !!attempt}
              {...form.register("fromDate")}
            />
            <FieldError message={form.formState.errors.fromDate?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-to">Đến ngày</Label>
            <Input
              id="schedule-to"
              type="date"
              min={selectedUnit?.fromDate.slice(0, 10)}
              max={selectedUnit?.toDate.slice(0, 10)}
              disabled={busy || !!attempt}
              {...form.register("toDate")}
            />
            <FieldError message={form.formState.errors.toDate?.message} />
          </div>
        </div>
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
                (!matchingPreview || conflicts || !preview.data?.slots.length))
            }
            isLoading={generate.isPending}
          >
            {attempt ? "Thử lại sinh lịch" : "Sinh buổi học"}
          </Button>
        </div>
      </form>
      <ApiFeedback error={preview.error ?? generate.error} />
      {generate.isSuccess && (
        <p role="status" className="text-sm text-primary">
          Đã sinh {generate.data.sessions.length} buổi học.
        </p>
      )}
      {matchingPreview && (
        <div className="space-y-3">
          <p className="font-medium">
            {preview.data!.slots.length} buổi dự kiến
            {conflicts ? " · Có xung đột, cần xử lý trước khi sinh lịch" : ""}
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
