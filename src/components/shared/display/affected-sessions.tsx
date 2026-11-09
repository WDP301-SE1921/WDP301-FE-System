"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dayLabel, timeRange } from "@/lib/session-preview";

export interface SessionLike {
  id: string;
  startsAt: string;
  endsAt: string;
  lesson?: { title: string } | null;
}
type Tone = "warning" | "info" | "plain";
export interface SessionGroup {
  sessions: SessionLike[];
  tag: string;
  tone: Tone;
  /** Hiện tối đa bấy nhiêu buổi, còn lại ghi "và N buổi nữa". */
  limit?: number;
}

const ROW_TONE: Record<Tone, string> = {
  warning: "bg-amber-50 dark:bg-amber-950/30",
  info: "bg-primary/5",
  plain: "",
};
const BADGE_TONE = { warning: "warning", info: "info", plain: "secondary" } as const;

/**
 * Danh sách buổi chia hai phần ở một mốc (ngày nghỉ, ngày hiệu lực). Chỉ để xem trước: đang tải
 * hay lỗi tải đều không chặn việc gửi thao tác.
 */
export function AffectedSessions({
  isLoading,
  isError,
  onRetry,
  first,
  second,
  splitLabel,
  title = "Các buổi bị ảnh hưởng",
  emptyText = "Không có buổi đang lên lịch trong khoảng này.",
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  first: SessionGroup;
  second?: SessionGroup;
  splitLabel: string;
  title?: string;
  emptyText?: string;
}) {
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Đang tải các buổi học…</p>;
  if (isError)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">
          Không xem trước được các buổi bị ảnh hưởng. Vẫn gửi được; hệ thống kiểm
          tra lại khi xác nhận.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  const isEmpty = !first.sessions.length && !second?.sessions.length;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {isEmpty ? (
        <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-border text-sm">
          <Group group={first} />
          {!!second?.sessions.length && (
            <>
              <li className="border-t border-dashed border-primary px-4 py-2 text-xs font-semibold text-primary first:border-t-0">
                {splitLabel}
              </li>
              <Group group={second} />
            </>
          )}
        </ol>
      )}
    </section>
  );
}

function Group({ group }: { group: SessionGroup }) {
  const limit = group.limit ?? 6;
  const shown = group.sessions.slice(0, limit);
  return (
    <>
      {shown.map((session) => (
        <li
          key={session.id}
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-border px-4 py-2.5 first:border-t-0 sm:grid-cols-[8rem_7rem_minmax(0,1fr)_auto]",
            ROW_TONE[group.tone],
          )}
        >
          <span className="font-medium tabular-nums">{dayLabel(session.startsAt)}</span>
          <Badge variant={BADGE_TONE[group.tone]} className="sm:order-last">
            {group.tag}
          </Badge>
          <span className="text-muted-foreground tabular-nums">
            {timeRange(session.startsAt, session.endsAt)}
          </span>
          <span className="truncate text-muted-foreground sm:text-foreground">
            {session.lesson?.title ?? "Buổi học"}
          </span>
        </li>
      ))}
      {group.sessions.length > limit && (
        <li className={cn("border-t border-border px-4 py-2.5 text-muted-foreground", ROW_TONE[group.tone])}>
          và {group.sessions.length - limit} buổi nữa
        </li>
      )}
    </>
  );
}
