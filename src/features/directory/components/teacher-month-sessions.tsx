"use client";

import { parseAsString, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { sessionRange } from "@/features/curriculum/session-format";
import { todayInVietnam } from "@/lib/calendar-date";
import type { ScheduledSession } from "@/types/curriculum";

/** `YYYY-MM` → khoảng ngày của tháng. */
export function monthRange(month: string) {
  const [year, value] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return { fromDate: `${month}-01`, toDate: `${month}-${String(last).padStart(2, "0")}` };
}

/**
 * Buổi của cả trung tâm trong tháng. Buổi `COMPLETED` = đã chốt điểm danh; BE đổi `teacherId`
 * sang người dạy thay nên buổi dạy thay tính cho người dạy (mục 6.2, chờ BE-11).
 */
export function useMonthSessions(month: string, enabled = true) {
  const range = monthRange(month);
  return useLiveQuery(
    ["teacher-month-sessions", month],
    (signal) => academicApi.sessions(range, signal),
    enabled && /^\d{4}-\d{2}$/.test(month),
  );
}

export function teacherMonthStats(
  sessions: ScheduledSession[] | undefined,
  teacherId: string,
  now: number,
) {
  const own = (sessions ?? []).filter((item) => item.teacherId === teacherId);
  return {
    taught: own.filter((item) => item.status === "COMPLETED").length,
    pending: own.filter(
      (item) => item.status === "SCHEDULED" && Date.parse(item.endsAt) <= now,
    ).length,
    own,
  };
}

export const currentMonth = () => todayInVietnam().slice(0, 7);

const STATUS: Record<ScheduledSession["status"], string> = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/** Bảng buổi dạy của một giáo viên trong tháng chọn (`?personMonth=`), dùng trong Sheet Nhân sự. */
export function TeacherMonthSessions({ teacherId }: { teacherId: string }) {
  const [month, setMonth] = useQueryState(
    "personMonth",
    parseAsString.withDefault(currentMonth()),
  );
  const sessions = useMonthSessions(month);
  // Mốc so sánh "đã qua giờ" lấy lúc dữ liệu về, đủ cho thống kê theo tháng.
  const now = sessions.dataUpdatedAt;
  const stats = teacherMonthStats(sessions.data, teacherId, now);
  const rows = [...stats.own].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <section className="space-y-3" aria-labelledby="person-sessions">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 id="person-sessions" className="text-sm font-semibold">
          Buổi dạy trong tháng
        </h3>
        <div className="space-y-1">
          <Label htmlFor="person-month" className="text-xs">
            Tháng
          </Label>
          <Input
            id="person-month"
            type="month"
            className="w-40"
            value={month}
            onChange={(event) =>
              void setMonth(event.target.value || null)
            }
          />
        </div>
      </div>
      <AsyncBoundary
        isLoading={sessions.isPending}
        isError={sessions.isError}
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
        data={rows}
        emptyProps={{ title: "Không có buổi dạy trong tháng" }}
      >
        <p className="text-sm text-muted-foreground">
          {stats.taught} buổi đã dạy (đã chốt điểm danh) · {stats.pending} buổi
          chờ điểm danh · {rows.length} buổi trong tháng
        </p>
        <div className="max-h-96 overflow-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Lớp · bài</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="whitespace-normal tabular-nums">
                    {sessionRange(session.startsAt, session.endsAt)}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{session.class.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {session.lesson?.title ?? "Buổi học"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge category="session" status={STATUS[session.status]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AsyncBoundary>
    </section>
  );
}
