"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ApiError } from "@/lib/api/client";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useCurrentUser } from "@/hooks/use-current-role";
import { dayLabel, vietnamDay } from "@/lib/session-preview";
import { bulkCancelSchema, type BulkCancelInput } from "@/lib/validators/curriculum";
import type { CancelBlocker, ScheduledSession } from "@/types/curriculum";
import { curriculumApi } from "../api";
import {
  blockerText,
  expandBlockedIds,
  futureSessions,
  planBulkBatches,
  withoutBlocked,
} from "../center-closures";
import {
  clearAcademicAttempt,
  readAcademicAttempt,
  saveAcademicAttempt,
  uncertainAcademicFailure,
} from "../operation-storage";

type Phase = "review" | "running" | "blocked" | "uncertain" | "error" | "done";

/**
 * Hủy và dời bài cho mọi buổi trong một ngày nghỉ (B6). Chia lô theo lớp (tối đa 200 buổi mỗi lô),
 * xem trước từng lô ngay trước khi hủy lô đó vì lô trước dời bài làm bản xem trước cũ sai.
 */
export function BulkCancelDialog({
  range,
  reason,
  onClose,
}: {
  range: { fromDate: string; toDate: string };
  reason: string;
  onClose: () => void;
}) {
  const user = useCurrentUser();
  const client = useQueryClient();
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [queueState, setQueue] = useState<string[][] | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [blockers, setBlockers] = useState<CancelBlocker[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [cancelled, setCancelled] = useState(0);
  const [skippedNames, setSkippedNames] = useState<string[]>([]);
  const [batchesDone, setBatchesDone] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const now = useCurrentTime();

  const sessionsQuery = useQuery({
    queryKey: ["curriculum", "closure-sessions", range.fromDate, range.toDate],
    queryFn: ({ signal }) =>
      curriculumApi.sessions("", signal, {
        fromDate: range.fromDate,
        toDate: range.toDate,
        status: "SCHEDULED",
      }),
    retry: false,
    gcTime: 0,
  });
  const pastCount = useMemo(
    () =>
      (sessionsQuery.data ?? []).filter(
        (row) =>
          row.status === "SCHEDULED" &&
          vietnamDay(row.startsAt) >= range.fromDate &&
          vietnamDay(row.startsAt) <= range.toDate &&
          Date.parse(row.startsAt) <= now,
      ).length,
    [sessionsQuery.data, range.fromDate, range.toDate, now],
  );
  const targets = useMemo(() => {
    const open = (sessionsQuery.data ?? []).filter(
      (row) =>
        row.status === "SCHEDULED" &&
        vietnamDay(row.startsAt) >= range.fromDate &&
        vietnamDay(row.startsAt) <= range.toDate &&
        !excluded.has(row.id),
    );
    return futureSessions(open, now);
  }, [sessionsQuery.data, excluded, range.fromDate, range.toDate, now]);
  const byId = useMemo(
    () => new Map<string, ScheduledSession>((sessionsQuery.data ?? []).map((row) => [row.id, row])),
    [sessionsQuery.data],
  );
  const plan = useMemo(() => planBulkBatches(targets), [targets]);
  const queue = queueState ?? plan.batches;
  const first = queue[0];
  const classCount = new Set(queue.flat().map((id) => byId.get(id)?.classId)).size;
  const total = queue.flat().length;

  const preview = useQuery({
    queryKey: ["curriculum", "bulk-cancel-preview", first?.join(",")],
    queryFn: () =>
      curriculumApi.bulkCancelPreview({ sessionIds: first!, shiftLessons: true, reason }),
    enabled: !!first && phase === "review",
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const previewBlockers = preview.data && !preview.data.cancellable ? preview.data.blockers : [];
  const shownBlockers = phase === "blocked" ? blockers : previewBlockers;

  function refresh() {
    for (const key of [
      ["academic-calendar"],
      ["curriculum", "sessions"],
      ["curriculum", "closure-sessions"],
      ["academic-session"],
    ])
      void client.invalidateQueries({ queryKey: key });
  }

  async function run() {
    if (!user) return;
    const attemptSchema = bulkCancelSchema;
    let rest = queue;
    if (!totalBatches) setTotalBatches(rest.length);
    setPhase("running");
    setError(null);
    try {
      while (rest.length) {
        const ids = rest[0];
        const target = `closure-bulk:${ids[0]}:${ids.length}`;
        let attempt = readAcademicAttempt<BulkCancelInput>(user.id, target, attemptSchema);
        if (!attempt) {
          // Xem trước ngay trước khi hủy: lô trước đã dời bài nên bản xem trước cũ không còn đúng.
          const fresh = await curriculumApi.bulkCancelPreview({
            sessionIds: ids,
            shiftLessons: true,
            reason,
          });
          if (!fresh.cancellable) {
            setBlockers(fresh.blockers);
            setQueue(rest);
            setPhase("blocked");
            return;
          }
          attempt = saveAcademicAttempt(user.id, target, attemptSchema, {
            sessionIds: ids,
            shiftLessons: true,
            reason,
          });
        }
        await curriculumApi.bulkCancel(attempt.body, attempt.key);
        clearAcademicAttempt(user.id, target);
        rest = rest.slice(1);
        setQueue(rest);
        setCancelled((count) => count + ids.length);
        setBatchesDone((count) => count + 1);
      }
      refresh();
      setPhase("done");
      if (!plan.oversizedClassIds.length)
        toast.success("Đã hủy các buổi trong ngày nghỉ.");
    } catch (failure) {
      refresh();
      if (failure instanceof ApiError && failure.code === "BULK_CANCEL_BLOCKED") {
        const details = failure.details as { blockers?: CancelBlocker[] } | undefined;
        const ids = rest[0];
        clearAcademicAttempt(user.id, `closure-bulk:${ids[0]}:${ids.length}`);
        setBlockers(details?.blockers ?? []);
        setQueue(rest);
        setPhase("blocked");
        return;
      }
      if (!uncertainAcademicFailure(failure) && rest[0])
        clearAcademicAttempt(user.id, `closure-bulk:${rest[0][0]}:${rest[0].length}`);
      setQueue(rest);
      setError(failure);
      setPhase(uncertainAcademicFailure(failure) ? "uncertain" : "error");
    }
  }

  async function excludeBlocked(list: readonly CancelBlocker[]) {
    const current = queue;
    const inQueue = new Set(current.flat());
    // Blocker ngoài hàng đợi (dời bài đụng buổi sau): tra lớp của buổi đó để bỏ cả lớp.
    const classes = new Map<string, string>();
    for (const [id, row] of byId) classes.set(id, row.classId);
    const outside = [
      ...new Set(
        list
          .filter((row) => !inQueue.has(row.sessionId) && !classes.has(row.sessionId))
          .map((row) => row.sessionId),
      ),
    ];
    const notes: string[] = [];
    try {
      await Promise.all(
        outside.map(async (id) => {
          const session = await curriculumApi.session(id);
          classes.set(id, session.classId);
          notes.push(`${session.class.name}: buổi ${dayLabel(session.startsAt)}`);
        }),
      );
    } catch (failure) {
      // Không tra được lớp thì dừng, không xem trước lại (sẽ lặp mãi cùng một lỗi).
      setError(failure);
      setPhase("error");
      return;
    }
    if (notes.length) setSkippedNames((names) => [...names, ...notes]);
    const { ids } = expandBlockedIds(current.flat(), list, (id) => classes.get(id));
    setExcluded((prev) => new Set([...prev, ...ids]));
    setQueue(
      current
        .map((batch) => withoutBlocked(batch, ids.map((sessionId) => ({ sessionId }))))
        .filter((batch) => batch.length),
    );
    setBlockers([]);
    setPhase("review");
  }

  const batchLabel = `Đã hủy ${batchesDone}/${Math.max(totalBatches, batchesDone)} lô (${cancelled} buổi).`;
  const oversized = plan.oversizedClassIds
    .map((id) => [...byId.values()].find((row) => row.classId === id)?.class.name ?? id)
    .join(", ");
  return (
    <Dialog open onOpenChange={(open) => !open && phase !== "running" && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hủy và dời bài các buổi trong ngày nghỉ</DialogTitle>
          <DialogDescription>
            Buổi bị hủy, các buổi sau lấy bài sớm hơn một bài. Mỗi lớp chậm một bài
            cho mỗi buổi bị hủy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <ApiFeedback error={sessionsQuery.error ?? error} />
          {sessionsQuery.isPending && <p>Đang tải các buổi trong ngày nghỉ…</p>}
          {sessionsQuery.isSuccess && phase !== "done" && !total && (
            <p className="rounded-xl bg-muted p-4">
              Không còn buổi nào có thể hủy trong khoảng này.
            </p>
          )}
          {!!oversized && (
            <p role="alert" className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
              Lớp {oversized} có hơn 200 buổi trong khoảng này nên chưa hủy cùng lúc
              được. Rút ngắn ngày nghỉ hoặc hủy từng buổi.
            </p>
          )}
          {!!pastCount && phase !== "done" && (
            <p className="text-muted-foreground">
              {pastCount} buổi đã diễn ra hoặc đã bắt đầu, không hủy.
            </p>
          )}
          {!!total && phase !== "done" && (
            <p className="font-medium">
              Hủy {total} buổi của {classCount} lớp. Phụ huynh sẽ nhận thông báo kèm
              lý do &quot;{reason}&quot;.
              {queue.length > 1 &&
                ` Chia ${queue.length} lô theo lớp; mỗi lô được xem trước ngay trước khi hủy.`}
            </p>
          )}
          {preview.isPending && !!first && phase === "review" && <p>Đang xem trước…</p>}
          {!!first && phase === "review" && (
            <p className="text-muted-foreground">
              Đang xem trước lô 1/{queue.length}. Các lô sau được xem trước lại ngay
              trước khi hủy.
            </p>
          )}
          <ApiFeedback error={preview.error} />
          {preview.data?.cancellable && (
            <ul className="space-y-1 rounded-xl bg-muted p-4">
              {preview.data.classes.slice(0, 6).map((row) => (
                <li key={row.classId}>
                  {row.className}: hủy {row.cancelledSessions.length} buổi
                  {row.pushedLessons.length
                    ? `, ${row.pushedLessons.length} bài bị đẩy ra (${
                        row.pushedLessons.every((lesson) => lesson.fitsInTerm)
                          ? "vào lần tạo lịch sau"
                          : "một số bài chưa có buổi trong kỳ này"
                      })`
                    : ""}
                  .
                </li>
              ))}
              {preview.data.classes.length > 6 && (
                <li>và {preview.data.classes.length - 6} lớp nữa.</li>
              )}
            </ul>
          )}
          {!!shownBlockers.length && (
            <div role="alert" className="space-y-2 rounded-xl bg-destructive/5 p-4">
              <p className="font-medium text-destructive">
                Có {shownBlockers.length} buổi chưa hủy được. Chưa buổi nào của lô này bị hủy.
              </p>
              <ul className="space-y-1">
                {shownBlockers.slice(0, 10).map((row) => {
                  const session = byId.get(row.sessionId);
                  return (
                    <li key={`${row.sessionId}:${row.code}`}>
                      {session
                        ? `${session.class.name} · ${dayLabel(session.startsAt)}: `
                        : ""}
                      {blockerText(row.code)}
                    </li>
                  );
                })}
                {shownBlockers.length > 10 && <li>và {shownBlockers.length - 10} buổi nữa.</li>}
              </ul>
              <Button type="button" variant="outline" onClick={() => void excludeBlocked(shownBlockers)}>
                Bỏ các buổi này ra và xem trước lại
              </Button>
            </div>
          )}
          {(phase === "running" || batchesDone > 0) && <p role="status">{batchLabel}</p>}
          {phase === "uncertain" && (
            <p role="status" className="rounded-xl bg-muted p-4">
              Chưa chắc lô này đã được hủy hay chưa. Bấm &quot;Thử lại&quot; sẽ gửi lại đúng
              lô đó, hệ thống không hủy hai lần.
            </p>
          )}
          {phase === "done" && (
            <p role="status" className="rounded-xl bg-muted p-4">
              Đã hủy {cancelled} buổi. Bài của các lớp đã được dời sang buổi sau.
              {!!oversized && ` Chưa hủy lớp ${oversized} vì có hơn 200 buổi trong khoảng này.`}
              {!!skippedNames.length &&
                ` Chưa hủy ${[...new Set(skippedNames)].join("; ")} (sau ngày nghỉ) vì có học viên đặt học bù nên không dời bài được. Xử lý học bù trước, hoặc hủy riêng lớp này bằng "Hủy, bỏ bài".`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {(phase === "review" || phase === "uncertain" || phase === "error") && (
            <Button
              type="button"
              variant="danger"
              disabled={
                !total ||
                (phase === "review" &&
                  (preview.isPending || !preview.data?.cancellable))
              }
              onClick={() => void run()}
            >
              {phase === "review" ? "Xác nhận hủy" : "Thử lại"}
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={phase === "running"} onClick={onClose}>
            {phase === "done" ? "Xong" : "Đóng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
