"use client";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OutcomePicker } from "@/components/shared/outcomes/outcome-picker";
import { toast } from "@/components/ui/toast";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import { lessonOutcomeSchema } from "@/lib/validators/outcomes";
import type { OutcomeSet } from "@/types/outcomes";
import { outcomeApi } from "../api";

interface LessonRef {
  id: string;
  sequence: number;
  title: string;
  status: "DRAFT" | "APPROVED";
}

/**
 * Gắn mục tiêu khóa học cho một bài (`PATCH academic/lessons/:id/outcomes`, thay toàn bộ
 * liên kết). Bài đã duyệt, hoặc bài của giáo trình đã duyệt áp dụng, chỉ đổi được mục tiêu
 * của bộ nháp; liên kết tới bộ khác bị khóa và vẫn nằm trong giá trị gửi đi (BE cũng tự giữ).
 */
export function LessonOutcomeDialog({
  lesson,
  programId,
  isCurriculumApproved,
  onClose,
}: {
  lesson: LessonRef | null;
  programId: string;
  /** Giáo trình chứa bài đang `APPROVED`; BE khóa liên kết theo cả bài lẫn giáo trình. */
  isCurriculumApproved: boolean;
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
          <DialogTitle>Gắn mục tiêu cho bài {lesson?.sequence}</DialogTitle>
          <DialogDescription>{lesson?.title}</DialogDescription>
        </DialogHeader>
        <AsyncBoundary
          isLoading={sets.isPending}
          isError={sets.isError}
          error={sets.error}
          onRetry={() => void sets.refetch()}
          data={sets.data?.filter((set) => set.outcomes.length)}
          emptyProps={{
            title: "Khóa học chưa có mục tiêu",
            description:
              "Tạo bộ mục tiêu ở tab Mục tiêu khóa học trước khi gắn cho bài học.",
          }}
        >
          {lesson && sets.data && (
            <LessonOutcomeForm
              key={lesson.id}
              lessonId={lesson.id}
              locksNonDraftSets={
                lesson.status === "APPROVED" || isCurriculumApproved
              }
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
  locksNonDraftSets,
  sets,
  onSaved,
}: {
  lessonId: string;
  locksNonDraftSets: boolean;
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
  const isLocked = (set: OutcomeSet) =>
    locksNonDraftSets && set.status !== "DRAFT";
  const hasEditableSet = sets.some((set) => !isLocked(set));
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(({ outcomeIds }) =>
        action.mutate(() => outcomeApi.mapLesson(lessonId, outcomeIds), {
          onSuccess: () => {
            toast.success("Đã lưu mục tiêu của bài.");
            onSaved();
          },
        }),
      )}
    >
      <Controller
        name="outcomeIds"
        control={form.control}
        render={({ field }) => (
          <OutcomePicker
            sets={sets}
            value={field.value}
            onChange={field.onChange}
            isLocked={isLocked}
            idPrefix="lesson-outcome"
          />
        )}
      />
      {hasEditableSet ? (
        <>
          <ApiFeedback error={action.error} />
          <DialogFooter>
            <Button type="submit" isLoading={action.isPending}>
              Lưu mục tiêu của bài
            </Button>
          </DialogFooter>
        </>
      ) : (
        <p role="status" className="rounded-xl bg-muted p-4 text-sm">
          Khóa chưa có bộ mục tiêu nháp. Muốn đổi mục tiêu của bài, hãy tạo bản
          mới của bộ mục tiêu.
        </p>
      )}
    </form>
  );
}
