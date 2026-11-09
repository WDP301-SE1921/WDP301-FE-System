"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import { lessonOutcomeSchema } from "@/lib/validators/outcomes";
import type { OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "../api";
import { OUTCOME_SET_STATUS_TEXT } from "../rules";

interface LessonRef {
  id: string;
  sequence: number;
  title: string;
}

/** Gắn CLO cho một bài học nháp (`PATCH academic/lessons/:id/outcomes`, thay toàn bộ liên kết). */
export function LessonOutcomeDialog({
  lesson,
  programId,
  onClose,
}: {
  lesson: LessonRef | null;
  programId: string;
  onClose: () => void;
}) {
  const sets = useLiveQuery(
    ["outcome-sets", programId, "all"],
    (signal) => outcomeApi.sets(programId, signal),
    !!lesson,
  );
  return (
    <Dialog
      open={!!lesson}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gắn CLO cho bài {lesson?.sequence}</DialogTitle>
          <DialogDescription>{lesson?.title}</DialogDescription>
        </DialogHeader>
        <AsyncBoundary
          isLoading={sets.isPending}
          isError={sets.isError}
          error={sets.error}
          onRetry={() => void sets.refetch()}
          data={sets.data?.filter((set) => set.outcomes.length)}
          emptyProps={{
            title: "Khóa học chưa có CLO",
            description: "Tạo bộ CLO ở tab Chuẩn đầu ra trước khi gắn cho bài học.",
          }}
        >
          {lesson && sets.data && (
            <LessonOutcomeForm
              key={lesson.id}
              lessonId={lesson.id}
              sets={sets.data.filter((set) => set.outcomes.length)}
              onSaved={onClose}
            />
          )}
        </AsyncBoundary>
      </DialogContent>
    </Dialog>
  );
}

function LessonOutcomeForm({
  lessonId,
  sets,
  onSaved,
}: {
  lessonId: string;
  sets: OutcomeSet[];
  onSaved: () => void;
}) {
  const action = useLiveCommand();
  const form = useForm<{ outcomeIds: string[] }>({
    resolver: zodResolver(lessonOutcomeSchema),
    defaultValues: {
      outcomeIds: sets.flatMap((set) =>
        set.outcomes
          .filter((outcome) =>
            outcome.lessonLinks.some((link) => link.lessonId === lessonId),
          )
          .map((outcome) => outcome.id),
      ),
    },
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(({ outcomeIds }) =>
        action.mutate(() => outcomeApi.mapLesson(lessonId, outcomeIds), {
          onSuccess: () => {
            toast.success("Đã lưu CLO của bài học.");
            onSaved();
          },
        }),
      )}
    >
      <Controller
        name="outcomeIds"
        control={form.control}
        render={({ field }) => (
          <div className="space-y-4">
            {sets.map((set) => (
              <fieldset key={set.id} className="space-y-2">
                <legend className="text-sm font-medium">
                  {set.level} · phiên bản {set.version} (
                  {OUTCOME_SET_STATUS_TEXT[set.status]})
                </legend>
                {set.outcomes.map((outcome) => {
                  const id = `lesson-outcome-${outcome.id}`;
                  return (
                    <div key={outcome.id} className="flex items-start gap-3">
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={field.value.includes(outcome.id)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, outcome.id]
                              : field.value.filter((value) => value !== outcome.id),
                          )
                        }
                      />
                      <Label htmlFor={id} className="leading-snug font-normal">
                        <span className="font-medium">{outcome.code}</span> ·{" "}
                        {outcome.title}
                      </Label>
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>
        )}
      />
      <ApiFeedback error={action.error} />
      <DialogFooter>
        <Button type="submit" isLoading={action.isPending}>
          Lưu CLO của bài
        </Button>
      </DialogFooter>
    </form>
  );
}
