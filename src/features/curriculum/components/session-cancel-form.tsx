"use client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import { ReasonSelect } from "@/components/shared/forms/reason-select";
import { CompareTable } from "@/components/shared/display/compare-table";
import { REASON_PRESETS } from "@/constants/reason-presets";
import { dayLabel } from "@/lib/session-preview";
import { reviewReasonSchema } from "@/lib/validators/curriculum";
import type {
  ScheduledSessionDetail,
  SessionCancelPreview,
} from "@/types/curriculum";
import { curriculumApi } from "../api";
import { blockerText } from "../center-closures";
import type { SessionAction } from "../session-contract";

type CancelMode = "move" | "shift" | "drop";

/**
 * Hộp hủy buổi (Q1): ba cách theo thứ tự khuyên dùng. "Đổi sang ngày khác" giữ bài nên chuyển
 * sang tab Đổi giờ; hai cách còn lại hủy buổi, có hoặc không dời bài sang buổi sau.
 */
export function SessionCancelForm({
  session,
  pending,
  onCommit,
  onSwitchToReschedule,
  onClose,
}: {
  session: ScheduledSessionDetail;
  pending: boolean;
  onCommit: (input: SessionAction) => void;
  onSwitchToReschedule: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<CancelMode>("move");
  const form = useForm<{ reason: string }>({
    resolver: zodResolver(reviewReasonSchema),
    defaultValues: { reason: "" },
  });
  const shift = mode === "shift";
  const preview = useQuery({
    queryKey: ["curriculum", "cancel-preview", session.id, session.revision, shift],
    queryFn: () => curriculumApi.cancelPreview(session.id, shift),
    enabled: mode !== "move",
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const data = preview.data;
  const blocked = mode !== "move" && !!data && !data.cancellable;
  const canSubmit =
    mode !== "move" && preview.isSuccess && !!data?.cancellable && !pending;
  return (
    <form
      className="space-y-4 rounded-xl border border-border p-4"
      noValidate
      onSubmit={form.handleSubmit((value) => {
        if (!canSubmit) return;
        onCommit({
          action: "cancel",
          body: {
            reason: value.reason,
            expectedRevision: session.revision,
            ...(shift ? { shiftLessons: true } : {}),
          },
        });
      })}
    >
      <ChoiceCards
        legend="Buổi này xử lý thế nào?"
        columns={1}
        value={mode}
        onChange={(value) => setMode(value as CancelMode)}
        disabled={pending}
        options={[
          {
            value: "move",
            label: "Đổi sang ngày khác (khuyên dùng)",
            description:
              "Giữ nguyên bài học, lớp không bị chậm. Chọn giờ mới giữa buổi trước và buổi sau.",
          },
          {
            value: "shift",
            label: "Hủy và dời bài sang buổi sau",
            description:
              "Buổi này bị hủy, các buổi sau lấy bài sớm hơn một bài. Lớp chậm một bài.",
          },
          {
            value: "drop",
            label: "Hủy, bỏ bài này",
            description:
              "Buổi bị hủy và bài của buổi này không được xếp lại, các buổi sau giữ nguyên bài.",
          },
        ]}
      />
      {mode === "move" && (
        <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
          <p>
            Chọn ngày giờ mới ở tab &quot;Đổi giờ&quot;. Hệ thống kiểm tra thứ tự
            bài trước khi đổi.
          </p>
          <Button type="button" onClick={onSwitchToReschedule}>
            Chọn ngày giờ mới
          </Button>
        </div>
      )}
      {mode !== "move" && (
        <>
          <ApiFeedback error={preview.error} />
          {preview.isPending && (
            <p className="text-sm text-muted-foreground">Đang xem trước…</p>
          )}
          {preview.isError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void preview.refetch()}
            >
              Thử lại xem trước
            </Button>
          )}
          {blocked && (
            <ul
              role="alert"
              className="space-y-1 rounded-xl bg-destructive/5 p-4 text-sm text-destructive"
            >
              {data!.blockers.map((row) => (
                <li key={`${row.sessionId}:${row.code}`}>{blockerText(row.code)}</li>
              ))}
            </ul>
          )}
          {shift && data && data.cancellable && (
            <ShiftPreview data={data} />
          )}
          {!shift && data?.cancellable && (
            <p className="rounded-xl bg-muted p-4 text-sm">
              Bài &quot;{session.lesson?.title ?? "của buổi này"}&quot; sẽ không được
              xếp lại. Nếu đây là buổi cuối đã tạo lịch của lớp, bài quay lại ở lần
              tạo lịch sau; nếu là buổi ở giữa thì bài bị bỏ.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Lý do hủy</Label>
            <Controller
              name="reason"
              control={form.control}
              render={({ field }) => (
                <ReasonSelect
                  id="cancel-reason"
                  value={field.value}
                  onChange={field.onChange}
                  presets={REASON_PRESETS.cancelSession}
                  disabled={pending}
                  invalid={!!form.formState.errors.reason}
                />
              )}
            />
            <FieldError message={form.formState.errors.reason?.message} />
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {mode !== "move" && (
          <Button
            type="submit"
            variant="danger"
            disabled={!canSubmit}
            isLoading={pending}
          >
            Xác nhận hủy buổi
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </form>
  );
}

function ShiftPreview({ data }: { data: SessionCancelPreview }) {
  const withAssessments = data.shiftedSessions.filter((row) => row.hasAssessments);
  return (
    <div className="space-y-3">
      {data.shiftedSessions.length ? (
        <CompareTable
          caption={`Bài học của ${data.shiftedSessions.length} buổi sau sẽ đổi`}
          beforeLabel="Hiện tại"
          afterLabel="Sau khi hủy"
          rows={data.shiftedSessions.slice(0, 8).map((row) => ({
            label: (
              <span className="tabular-nums">{dayLabel(row.startsAt)}</span>
            ),
            before: row.fromLesson.title,
            after: row.toLesson.title,
            state: "changed" as const,
          }))}
        />
      ) : (
        <p className="rounded-xl bg-muted p-4 text-sm">
          Không có buổi nào sau buổi này cần đổi bài.
        </p>
      )}
      {data.shiftedSessions.length > 8 && (
        <p className="text-sm text-muted-foreground">
          và {data.shiftedSessions.length - 8} buổi nữa.
        </p>
      )}
      {data.pushedLesson && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          {data.pushedLessonFits
            ? `Bài "${data.pushedLesson.title}" bị đẩy ra khỏi lịch hiện tại và sẽ vào lần tạo lịch sau.`
            : `Bài "${data.pushedLesson.title}" chưa có buổi trong kỳ này.`}{" "}
          Lớp chậm một bài.
        </p>
      )}
      {!!withAssessments.length && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          {withAssessments.length} buổi có bài tập hoặc bài kiểm tra gắn kèm. Bài
          tập vẫn giữ nguyên nhưng giáo viên nên kiểm tra lại nội dung cho khớp bài
          mới.
        </p>
      )}
    </div>
  );
}
