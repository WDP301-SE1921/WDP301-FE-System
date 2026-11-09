"use client";

import { useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/feedback/api-feedback";
import type { CurriculumLesson } from "@/types/curriculum";

/** Hộp "Chuyển tới vị trí…": nhập số từ 1 đến số bài. Không kéo thả (C1). */
export function LessonPositionDialog({
  lesson,
  currentPosition,
  count,
  busy,
  onSubmit,
  onClose,
}: {
  lesson: CurriculumLesson | null;
  currentPosition: number;
  count: number;
  busy: boolean;
  onSubmit: (lesson: CurriculumLesson, position: number) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!lesson}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent size="md" showCloseButton={false}>
        {lesson && (
          <PositionForm
            key={lesson.id}
            lesson={lesson}
            currentPosition={currentPosition}
            count={count}
            busy={busy}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PositionForm({
  lesson,
  currentPosition,
  count,
  busy,
  onSubmit,
  onClose,
}: {
  lesson: CurriculumLesson;
  currentPosition: number;
  count: number;
  busy: boolean;
  onSubmit: (lesson: CurriculumLesson, position: number) => void;
  onClose: () => void;
}) {
  const id = useId();
  const schema = useMemo(
    () =>
      z.object({
        position: z
          .number({ error: `Nhập số từ 1 đến ${count}.` })
          .int(`Nhập số từ 1 đến ${count}.`)
          .min(1, `Nhập số từ 1 đến ${count}.`)
          .max(count, `Nhập số từ 1 đến ${count}.`)
          .refine(
            (value) => value !== currentPosition,
            "Bài đang ở vị trí này. Nhập vị trí khác.",
          ),
      }),
    [count, currentPosition],
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { position: currentPosition },
  });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => onSubmit(lesson, input.position))}
    >
      <DialogHeader>
        <DialogTitle>Chuyển bài tới vị trí</DialogTitle>
        <DialogDescription>
          Bài {currentPosition}: {lesson.title}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor={id}>Vị trí mới (từ 1 đến {count})</Label>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={count}
          autoFocus
          aria-invalid={!!form.formState.errors.position}
          {...form.register("position", { valueAsNumber: true })}
        />
        <FieldError message={form.formState.errors.position?.message} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
          Đóng
        </Button>
        <Button type="submit" isLoading={busy} disabled={busy}>
          Chuyển bài
        </Button>
      </div>
    </form>
  );
}
