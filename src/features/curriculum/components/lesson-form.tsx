"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
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
  const next =
    Math.max(
      0,
      ...unit.lessons
        .filter((item) => item.kind === "LESSON")
        .map((item) => item.sequence),
    ) + 1;
  const form = useForm<CurriculumLessonInput>({
    resolver: zodResolver(curriculumLessonSchema),
    defaultValues: {
      sequence: lesson?.sequence ?? next,
      title: lesson?.title ?? "",
      content: lesson?.content ?? "",
    },
  });
  const save = useCurriculumMutation(async (input: CurriculumLessonInput) => {
    const result = await curriculumApi.lesson(
      unit.id,
      input,
      lesson?.id,
      unit.revision,
    );
    onSaved();
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  const errors = form.formState.errors;
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <fieldset disabled={save.isPending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={id + "-sequence"}>Thứ tự bài học</Label>
          <Input
            id={id + "-sequence"}
            type="number"
            min={1}
            aria-invalid={!!errors.sequence}
            aria-describedby={id + "-sequence-help"}
            {...form.register("sequence", { valueAsNumber: true })}
          />
          <div id={id + "-sequence-help"}>
            <FieldError message={errors.sequence?.message} />
            <p className="text-xs text-muted-foreground">
              Mỗi buổi học một bài, thứ tự bắt đầu từ 1.
            </p>
          </div>
        </div>
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
        <div className="space-y-2">
          <Label htmlFor={id + "-chapter"}>Chương</Label>
          <Input id={id + "-chapter"} disabled placeholder="Chưa được hỗ trợ" />
          <p className="text-xs text-muted-foreground">
            Chương và tài liệu sẽ có khi hệ thống hỗ trợ.
          </p>
        </div>
        <StickyFormFooter>
          <Button
            type="submit"
            isLoading={save.isPending}
            disabled={save.isPending}
          >
            Lưu bài học
          </Button>
        </StickyFormFooter>
      </fieldset>
      <ApiFeedback error={save.error} />
    </form>
  );
}
