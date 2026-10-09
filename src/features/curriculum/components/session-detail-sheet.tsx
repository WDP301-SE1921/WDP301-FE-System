"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
  sessionActionFormSchema as actionFormSchema,
  type SessionActionFormInput,
} from "@/lib/validators/curriculum";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { useCurrentUser } from "@/hooks/use-current-role";
import type { ScheduledSessionDetail } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { sessionTime } from "../session-format";
import {
  sessionActionSchema,
  vietnamLocalInput,
  utcFromVietnamLocal,
  type SessionAction,
} from "../session-contract";
import {
  readAcademicAttempt,
  saveAcademicAttempt,
  clearAcademicAttempt,
  uncertainAcademicFailure,
  type AcademicAttempt,
} from "../operation-storage";
const labels = {
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
} as const;
export function SessionDetailSheet({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const detail = useQuery({
    queryKey: ["academic-session", id],
    queryFn: ({ signal }) => curriculumApi.session(id, signal),
    enabled: !!id,
    retry: false,
  });
  return (
    <Sheet
      open={!!id}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {detail.data?.lesson?.title ?? "Chi tiết buổi học"}
          </SheetTitle>
          <SheetDescription>
            {detail.data?.class.name ??
              "Thông tin buổi học và nội dung giảng dạy"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <AsyncBoundary
            isLoading={detail.isPending}
            isError={detail.isError}
            error={detail.error}
            onRetry={() => void detail.refetch()}
          >
            {detail.data && (
              <>
                <p className="font-medium">
                  {sessionTime(detail.data.startsAt)} ·{" "}
                  {sessionTime(detail.data.endsAt)}
                </p>
                <p>
                  {labels[detail.data.status]} ·{" "}
                  {detail.data.teacher?.displayName ?? "Chưa có tên giáo viên"}
                </p>
                {detail.data.cancelReason && (
                  <p>Lý do hủy: {detail.data.cancelReason}</p>
                )}
                <p className="whitespace-pre-wrap rounded-xl bg-muted p-4">
                  {detail.data.lesson?.content ?? "Chưa có nội dung bài học."}
                </p>
                {user?.role === "center_manager" && (
                  <SessionActions
                    key={id}
                    session={detail.data}
                    userId={user.id}
                  />
                )}
              </>
            )}
          </AsyncBoundary>
        </div>
      </SheetContent>
    </Sheet>
  );
}
function SessionActions({
  session,
  userId,
}: {
  session: ScheduledSessionDetail;
  userId: string;
}) {
  const now = useCurrentTime();
  const client = useQueryClient(),
    target = "session:" + session.id;
  const [restored] = useState(() => {
    try {
      return {
        attempt: readAcademicAttempt(userId, target, sessionActionSchema),
        error: null,
      };
    } catch (error) {
      return { attempt: null, error };
    }
  });
  const [attempt, setAttempt] = useState<AcademicAttempt<SessionAction> | null>(
    restored.attempt,
  );
  const [action, setAction] = useState<"reschedule" | "cancel" | null>(
    restored.attempt?.body.action ?? null,
  );
  const allowed =
    session.status === "SCHEDULED" && Date.parse(session.startsAt) > now;
  const commit = useMutation({
    mutationFn: async (input: SessionAction) => {
      const operation =
        attempt ??
        saveAcademicAttempt(userId, target, sessionActionSchema, input);
      setAttempt(operation);
      return operation.body.action === "cancel"
        ? curriculumApi.cancelSession(
            session.id,
            operation.body.body,
            operation.key,
          )
        : curriculumApi.reschedule(
            session.id,
            operation.body.body,
            operation.key,
          );
    },
    retry: false,
    onSuccess: () => {
      clearAcademicAttempt(userId, target);
      setAttempt(null);
      setAction(null);
      for (const key of [
        ["academic-session", session.id],
        ["academic-calendar"],
        ["curriculum", "sessions"],
        ["academic-generations"],
        ["academic-generation"],
      ])
        void client.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      if (!uncertainAcademicFailure(error)) {
        clearAcademicAttempt(userId, target);
        setAttempt(null);
      }
    },
  });
  return (
    <div className="space-y-3">
      <ApiFeedback error={restored.error ?? commit.error} />
      {attempt && (
        <p role="status" className="rounded-xl bg-muted p-3">
          Có thao tác cần xác nhận lại. Thử lại dùng nguyên dữ liệu đã gửi.
        </p>
      )}
      {attempt ? (
        <Button
          disabled={commit.isPending || !!restored.error}
          isLoading={commit.isPending}
          onClick={() => commit.mutate(attempt.body)}
        >
          Thử lại {attempt.body.action === "cancel" ? "hủy buổi" : "đổi giờ"}
        </Button>
      ) : (
        allowed &&
        !restored.error && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={commit.isPending}
              onClick={() => setAction("reschedule")}
            >
              Đổi giờ buổi học
            </Button>
            <Button
              variant="outline"
              disabled={commit.isPending}
              onClick={() => setAction("cancel")}
            >
              Hủy buổi học
            </Button>
          </div>
        )
      )}
      {action && !attempt && (
        <SessionActionForm
          key={action + ":" + session.revision}
          action={action}
          session={session}
          pending={commit.isPending}
          onCommit={(input) => commit.mutate(input)}
          onClose={() => setAction(null)}
        />
      )}
      {commit.isSuccess && <p role="status">Đã cập nhật buổi học.</p>}
    </div>
  );
}
function SessionActionForm({
  action,
  session,
  pending,
  onCommit,
  onClose,
}: {
  action: "reschedule" | "cancel";
  session: ScheduledSessionDetail;
  pending: boolean;
  onCommit: (input: SessionAction) => void;
  onClose: () => void;
}) {
  const form = useForm<SessionActionFormInput>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      reason: "",
      startsAt: vietnamLocalInput(session.startsAt),
      endsAt: vietnamLocalInput(session.endsAt),
    },
  });
  const preview = useMutation({
    mutationFn: curriculumApi.reschedulePreview.bind(null, session.id),
    retry: false,
  });
  function input(value: SessionActionFormInput): SessionAction {
    return sessionActionSchema.parse(
      action === "cancel"
        ? {
            action,
            body: { reason: value.reason, expectedRevision: session.revision },
          }
        : {
            action,
            body: {
              reason: value.reason,
              expectedRevision: session.revision,
              startsAt: utcFromVietnamLocal(value.startsAt),
              endsAt: utcFromVietnamLocal(value.endsAt),
            },
          },
    );
  }
  function previewMatches(value: SessionActionFormInput) {
    try {
      const parsed = input(value);
      return (
        parsed.action === "reschedule" &&
        !!preview.data &&
        JSON.stringify(parsed.body) === JSON.stringify(preview.variables)
      );
    } catch {
      return false;
    }
  }
  const values = useWatch({ control: form.control }) as SessionActionFormInput;
  const busy = pending || preview.isPending;
  return (
    <form
      className="space-y-3 rounded-xl border border-border p-4"
      onSubmit={form.handleSubmit((value) => {
        try {
          const parsed = input(value);
          if (parsed.action === "reschedule" && !previewMatches(value)) return;
          onCommit(parsed);
        } catch (error) {
          form.setError("startsAt", {
            message:
              error instanceof Error ? error.message : "Ngày giờ chưa hợp lệ.",
          });
        }
      })}
    >
      <p className="font-medium">
        {action === "cancel"
          ? "Xác nhận hủy buổi học"
          : "Xem trước giờ học mới"}
      </p>
      {action === "reschedule" && (
        <>
          <Label htmlFor="move-start">Bắt đầu (giờ Việt Nam)</Label>
          <Input
            id="move-start"
            type="datetime-local"
            disabled={busy}
            {...form.register("startsAt", { onChange: () => preview.reset() })}
          />
          <FieldError message={form.formState.errors.startsAt?.message} />
          <Label htmlFor="move-end">Kết thúc (giờ Việt Nam)</Label>
          <Input
            id="move-end"
            type="datetime-local"
            disabled={busy}
            {...form.register("endsAt", { onChange: () => preview.reset() })}
          />
          <FieldError message={form.formState.errors.endsAt?.message} />
          <p className="text-sm text-muted-foreground">
            Chọn ngày trong cùng tháng và giữ thứ tự các buổi học.
          </p>
        </>
      )}
      <Label htmlFor="session-reason">
        Lý do {action === "cancel" ? "hủy" : "đổi giờ"}
      </Label>
      <Textarea
        id="session-reason"
        disabled={busy}
        {...form.register("reason", { onChange: () => preview.reset() })}
      />
      <FieldError message={form.formState.errors.reason?.message} />
      <ApiFeedback error={preview.error} />
      {previewMatches(values) && (
        <p role="status">Giờ mới hợp lệ. Có thể xác nhận đổi giờ.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {action === "reschedule" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            isLoading={preview.isPending}
            onClick={form.handleSubmit((value) => {
              try {
                const parsed = input(value);
                if (parsed.action === "reschedule") preview.mutate(parsed.body);
              } catch (error) {
                form.setError("startsAt", {
                  message:
                    error instanceof Error
                      ? error.message
                      : "Ngày giờ chưa hợp lệ.",
                });
              }
            })}
          >
            Xem trước đổi giờ
          </Button>
        )}
        <Button
          type="submit"
          variant={action === "cancel" ? "danger" : "default"}
          disabled={
            busy || (action === "reschedule" && !previewMatches(values))
          }
          isLoading={pending}
        >
          {action === "cancel" ? "Xác nhận hủy" : "Xác nhận đổi giờ"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </form>
  );
}
