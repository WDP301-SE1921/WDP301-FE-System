"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { parseStoredUser, readStoredUserRaw } from "@/lib/auth/session";
import { academicApi } from "@/features/academic/api";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  answer: z.string().trim().min(1, "Nhập nội dung đã kiểm tra.").max(20000),
});
export function ReadingCorrection({
  submissionId,
  ownerId,
  questionId,
  answer,
  busy,
  onJob,
}: {
  submissionId: string;
  ownerId: string;
  questionId: string;
  answer: string;
  busy: boolean;
  onJob: (id: string) => void;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { answer },
  });
  const action = useMutation({
    mutationFn: async (value: z.infer<typeof schema>) => {
      if (parseStoredUser(readStoredUserRaw())?.id !== ownerId)
        throw new Error(
          "Phiên đăng nhập đã thay đổi. Tải lại trang trước khi chấm bài.",
        );
      const job = await academicApi.gradeAi(submissionId, {
        corrections: [{ questionId, answer: value.answer }],
      });
      if (parseStoredUser(readStoredUserRaw())?.id !== ownerId)
        throw new Error("Phiên đăng nhập đã thay đổi. Tải lại để xem kết quả.");
      return job;
    },
    onSuccess: (job) => onJob(job.id),
    retry: false,
  });
  return (
    <form
      className="space-y-2"
      onSubmit={form.handleSubmit((value) => {
        if (!busy && !action.isPending) action.mutate(value);
      })}
    >
      <Label htmlFor={`reading-${questionId}`}>
        Nội dung giáo viên đã kiểm tra
      </Label>
      <Textarea
        id={`reading-${questionId}`}
        {...form.register("answer")}
        disabled={busy || action.isPending}
      />
      {form.formState.errors.answer && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.answer.message}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        disabled={busy || action.isPending}
        isLoading={action.isPending}
      >
        Chấm lại với nội dung đã kiểm tra
      </Button>
      <p className="text-xs text-muted-foreground">
        Tạo lượt đề xuất mới cho bài. Bài nộp gốc và điểm đã lưu được giữ
        nguyên.
      </p>
      <ApiFeedback error={action.error} />
    </form>
  );
}
