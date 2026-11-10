"use client";

import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutcomePicker } from "@/components/shared/outcomes/outcome-picker";
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { nextLessonSequence } from "../lesson-order";
import { outcomeApi } from "@/features/outcomes/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { userFacingMessage } from "@/lib/api/error-message";
import { lessonOutcomeIds, nextLessonOutcomeIds } from "@/lib/outcome-links";
import {
  curriculumLessonSchema,
  type CurriculumLessonInput,
} from "@/lib/validators/curriculum";
import type {
  CurriculumLesson,
  CurriculumUnitDetail,
} from "@/types/curriculum";
import { curriculumApi } from "../api";
import { useCurriculumMutation } from "../hooks/use-curriculum";
import {
  useCurriculumFormState,
  type CurriculumFormState,
} from "../hooks/use-curriculum-form";

export function LessonForm({
  unit,
  lesson,
  onSaved,
  onStateChange,
}: {
  unit: CurriculumUnitDetail;
  lesson?: CurriculumLesson;
  onSaved: () => void;
  onStateChange?: (state: CurriculumFormState) => void;
}) {
  const id = useId();
  // Số thứ tự tự đánh: bài mới nằm cuối. BE vẫn bắt buộc `sequence` nên giữ trong schema.
  const next = nextLessonSequence(
    unit.lessons
      .filter((item) => item.kind === "LESSON")
      .map((item) => item.sequence),
  );
  const form = useForm<CurriculumLessonInput>({
    resolver: zodResolver(curriculumLessonSchema),
    defaultValues: {
      sequence: lesson?.sequence ?? next,
      title: lesson?.title ?? "",
      content: lesson?.content ?? "",
    },
  });
  const client = useQueryClient();
  const sets = useLiveQuery(["outcome-sets", unit.programId, "all"], (signal) =>
    outcomeApi.sets(unit.programId, signal),
  );
  const pickable = (sets.data ?? []).filter((set) => set.outcomes.length);
  // Chụp một lần lúc bộ tải xong để làm gốc so phần bỏ chọn/chọn thêm.
  const [initialIds, setInitialIds] = useState<string[] | null>(null);
  if (initialIds === null && sets.data)
    setInitialIds(lesson ? lessonOutcomeIds(sets.data, lesson.id) : []);
  const baseIds = initialIds ?? [];
  // `null` = chưa đụng vào: dùng liên kết hiện có.
  const [picked, setPicked] = useState<string[] | null>(null);
  const selected = picked ?? baseIds;
  // Bài đã lưu nhưng gắn mục tiêu lỗi: giữ id để thử lại đúng bước hai.
  const [mapFailure, setMapFailure] = useState<{ lessonId: string; message: string } | null>(null);
  const [retrying, setRetrying] = useState(false);

  /** Bước hai: gắn mục tiêu. Lấy lại liên kết ngay trước khi lưu (C29). */
  async function mapOutcomes(lessonId: string) {
    const fresh = await outcomeApi.sets(unit.programId);
    const next = nextLessonOutcomeIds(
      lessonOutcomeIds(fresh, lessonId),
      baseIds,
      selected,
    );
    if (next) await outcomeApi.mapLesson(lessonId, next);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["web-api"] }),
      client.invalidateQueries({ queryKey: ["outcome-sets", unit.programId] }),
    ]);
  }
  const save = useCurriculumMutation(async (input: CurriculumLessonInput) => {
    const result = await curriculumApi.lesson(
      unit.id,
      input,
      lesson?.id,
      unit.revision,
    );
    try {
      await mapOutcomes(result.id);
    } catch (error) {
      setMapFailure({ lessonId: result.id, message: userFacingMessage(error) });
      return result;
    }
    onSaved();
    return result;
  });
  async function retryMap() {
    if (!mapFailure) return;
    setRetrying(true);
    try {
      await mapOutcomes(mapFailure.lessonId);
      onSaved();
    } catch (error) {
      setMapFailure({ ...mapFailure, message: userFacingMessage(error) });
    } finally {
      setRetrying(false);
    }
  }
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  const errors = form.formState.errors;
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <fieldset disabled={save.isPending} className="space-y-4">
        {!lesson && (
          <p className="text-xs text-muted-foreground">
            Bài mới được thêm vào cuối danh sách. Đổi thứ tự bằng nút ↑ ↓ ở danh sách bài.
          </p>
        )}
        <FieldError message={errors.sequence?.message} />
        <div className="space-y-2">
          <Label htmlFor={id + "-title"}>Tên bài học</Label>
          <Input
            id={id + "-title"}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? id + "-title-error" : undefined}
            {...form.register("title")}
          />
          <div id={id + "-title-error"}>
            <FieldError message={errors.title?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id + "-content"}>Nội dung bài học</Label>
          <Textarea
            id={id + "-content"}
            rows={12}
            aria-invalid={!!errors.content}
            aria-describedby={
              errors.content ? id + "-content-error" : undefined
            }
            {...form.register("content")}
          />
          <div id={id + "-content-error"}>
            <FieldError message={errors.content?.message} />
          </div>
        </div>
        {pickable.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Mục tiêu của bài (không bắt buộc)</p>
            <OutcomePicker
              sets={pickable}
              value={selected}
              onChange={setPicked}
              idPrefix={id + "-outcome"}
              isLocked={(set) => lesson?.status === "APPROVED" && set.status !== "DRAFT"}
            />
          </div>
        )}
        {sets.data && pickable.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Khóa học chưa có mục tiêu. Soạn ở tab Mục tiêu khóa học.
          </p>
        )}
        {mapFailure && (
          <div role="alert" className="space-y-2 rounded-xl bg-muted p-4 text-sm">
            <p>
              Đã lưu bài học, chưa gắn được mục tiêu: {mapFailure.message}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" isLoading={retrying} onClick={() => void retryMap()}>
                Thử lại gắn mục tiêu
              </Button>
              <Button type="button" variant="outline" disabled={retrying} onClick={onSaved}>
                Đóng
              </Button>
            </div>
          </div>
        )}
        <StickyFormFooter>
          <Button
            type="submit"
            isLoading={save.isPending}
            disabled={save.isPending || !!mapFailure}
          >
            Lưu bài học
          </Button>
        </StickyFormFooter>
      </fieldset>
      <ApiFeedback error={save.error} />
    </form>
  );
}
