"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import {
  curriculumLessonSchema,
  monthlyTestSchema,
  type CurriculumLessonInput,
  type MonthlyTestInput,
} from "@/lib/validators/curriculum";
import type {
  CurriculumLesson,
  CurriculumUnitDetail,
} from "@/types/curriculum";
import { curriculumApi } from "../api";
import { useCurriculumMutation } from "../hooks/use-curriculum";

export function LessonForm({
  unit,
  lesson,
  onSaved,
}: {
  unit: CurriculumUnitDetail;
  lesson?: CurriculumLesson;
  onSaved: () => void;
}) {
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
    const result = await curriculumApi.lesson(unit.id, input, lesson?.id);
    onSaved();
    return result;
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <div className="space-y-2">
        <Label htmlFor="lesson-sequence">Thứ tự bài học</Label>
        <Input
          id="lesson-sequence"
          type="number"
          min={1}
          {...form.register("sequence", { valueAsNumber: true })}
        />
        <FieldError message={form.formState.errors.sequence?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lesson-title">Tiêu đề</Label>
        <Input id="lesson-title" {...form.register("title")} />
        <FieldError message={form.formState.errors.title?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lesson-content">Nội dung</Label>
        <Textarea id="lesson-content" rows={8} {...form.register("content")} />
        <FieldError message={form.formState.errors.content?.message} />
      </div>
      <ApiFeedback error={save.error} />
      <Button
        type="submit"
        isLoading={save.isPending}
        disabled={save.isPending}
      >
        Lưu bài học
      </Button>
    </form>
  );
}

export function MonthlyTestForm({
  unit,
  lesson,
  onSaved,
}: {
  unit: CurriculumUnitDetail;
  lesson?: CurriculumLesson;
  onSaved: () => void;
}) {
  const form = useForm<MonthlyTestInput>({
    resolver: zodResolver(monthlyTestSchema),
    defaultValues: {
      monthKey: lesson?.monthKey ?? unit.fromDate.slice(0, 7),
      title: lesson?.title ?? "",
      content: lesson?.content ?? "",
    },
  });
  const save = useCurriculumMutation(async (input: MonthlyTestInput) => {
    const result = await curriculumApi.monthlyTest(unit.id, input);
    onSaved();
    return result;
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((input) => {
        if (
          input.monthKey < unit.fromDate.slice(0, 7) ||
          input.monthKey > unit.toDate.slice(0, 7)
        ) {
          form.setError("monthKey", {
            message: "Tháng kiểm tra phải nằm trong khoảng học phần.",
          });
          return;
        }
        save.mutate(input);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="test-month">Tháng kiểm tra</Label>
        <Input
          id="test-month"
          type="month"
          min={unit.fromDate.slice(0, 7)}
          max={unit.toDate.slice(0, 7)}
          disabled={!!lesson}
          {...form.register("monthKey")}
        />
        <FieldError message={form.formState.errors.monthKey?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="test-title">Tiêu đề</Label>
        <Input id="test-title" {...form.register("title")} />
        <FieldError message={form.formState.errors.title?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="test-content">Nội dung kiểm tra</Label>
        <Textarea id="test-content" rows={8} {...form.register("content")} />
        <FieldError message={form.formState.errors.content?.message} />
      </div>
      <ApiFeedback error={save.error} />
      <Button
        type="submit"
        isLoading={save.isPending}
        disabled={save.isPending}
      >
        Lưu kiểm tra tháng
      </Button>
    </form>
  );
}
