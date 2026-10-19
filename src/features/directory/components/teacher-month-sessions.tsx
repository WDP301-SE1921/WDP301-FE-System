"use client";

import { parseAsString, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { useTeacherNames } from "@/features/registration-flow/teacher-names";
import { todayInVietnam } from "@/lib/calendar-date";
import type { AuditLogRecord } from "@/types/academic-workflows";
import type { ScheduledSession } from "@/types/curriculum";
import { directoryApi } from "../api";

/** `YYYY-MM` → khoảng ngày của tháng. */
export function monthRange(month: string) {
  const [year, value] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return { fromDate: `${month}-01`, toDate: `${month}-${String(last).padStart(2, "0")}` };
}

/**
 * Buổi của cả trung tâm trong tháng. Buổi `COMPLETED` = đã chốt điểm danh; BE đổi `teacherId`
 * sang người dạy thay nên buổi dạy thay tính cho người dạy (mục 6.2).
 */
export function useMonthSessions(month: string, enabled = true) {
  const range = monthRange(month);
  return useLiveQuery(
    ["teacher-month-sessions", month],
    (signal) => academicApi.sessions(range, signal),
    enabled && /^\d{4}-\d{2}$/.test(month),
  );
}

/**
 * Các lần xếp dạy thay (audit `SESSION_SUBSTITUTE_ASSIGNED`) tạo đến hết tháng. BE chỉ cho xếp
 * dạy thay buổi tương lai, nên buổi nào trong tháng đã được xếp đều có trong danh sách.
 */
export function useMonthSubstitutions(month: string, enabled = true) {
  return useLiveQuery(
    ["teacher-month-substitutes", month],
    (signal) =>
      directoryApi.substituteAudits(
        `${monthRange(month).toDate}T23:59:59.999+07:00`,
        signal,
      ),
    enabled && /^\d{4}-\d{2}$/.test(month),
  );
}

/** Buổi → giáo viên ban đầu, lấy ở lần xếp dạy thay đầu tiên của buổi. */
export function substitutionOrigins(audits: AuditLogRecord[] | undefined) {
  const origins = new Map<string, string>();
  // BE trả mới nhất trước; ghi đè dần để còn lại giáo viên trước lần xếp đầu tiên.
  for (const audit of audits ?? []) {
    const before = audit.beforeData as { teacherId?: unknown } | null;
    if (typeof before?.teacherId === "string")
      origins.set(audit.entityId, before.teacherId);
  }
  return origins;
}

export function teacherMonthStats(
  sessions: ScheduledSession[] | undefined,
  teacherId: string,
  now: number,
  origins?: Map<string, string>,
) {
  const all = sessions ?? [];
  const own = all.filter((item) => item.teacherId === teacherId);
  const originOf = (item: ScheduledSession) =>
    origins?.get(item.id) ?? item.teacherId;
  return {
    taught: own.filter((item) => item.status === "COMPLETED").length,
    pending: own.filter(
      (item) => item.status === "SCHEDULED" && Date.parse(item.endsAt) <= now,
    ).length,
    /** Buổi giáo viên dạy thay cho người khác, không tính buổi đã hủy. */
    substituted: own.filter(
      (item) => item.status !== "CANCELLED" && originOf(item) !== teacherId,
    ).length,
    /** Buổi của giáo viên do người khác dạy thay. */
    replaced: all.filter(
      (item) =>
        item.status !== "CANCELLED" &&
        item.teacherId !== teacherId &&
        originOf(item) === teacherId,
    ),
    own,
    originOf,
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
  const substitutions = useMonthSubstitutions(month);
  const { names } = useTeacherNames();
  const origins = substitutions.data
    ? substitutionOrigins(substitutions.data)
    : undefined;
  // Mốc so sánh "đã qua giờ" lấy lúc dữ liệu về, đủ cho thống kê theo tháng.
  const now = sessions.dataUpdatedAt;
  const stats = teacherMonthStats(sessions.data, teacherId, now, origins);
  const rows = [...stats.own, ...stats.replaced].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const teacherName = (id: string | null) =>
    (id && names.get(id)) || "giáo viên khác";
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
          {[
            `${stats.taught} buổi đã dạy (đã chốt điểm danh)`,
            `${stats.pending} buổi chờ điểm danh`,
            origins ? `${stats.substituted} buổi dạy thay` : null,
            origins ? `${stats.replaced.length} buổi người khác dạy thay` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {substitutions.isError && (
          <p className="text-xs text-muted-foreground">
            Chưa đọc được lịch sử xếp dạy thay nên không tách buổi dạy thay.
          </p>
        )}
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
              {rows.map((session) => {
                const origin = stats.originOf(session);
                const isReplaced = session.teacherId !== teacherId;
                return (
                  <TableRow
                    key={session.id}
                    className={isReplaced ? "text-muted-foreground" : undefined}
                  >
                    <TableCell className="whitespace-normal tabular-nums">
                      {sessionRange(session.startsAt, session.endsAt)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{session.class.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {session.lesson?.title ?? "Buổi học"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-1">
                        <StatusBadge
                          category="session"
                          status={STATUS[session.status]}
                        />
                        {isReplaced ? (
                          <Badge variant="secondary">
                            {teacherName(session.teacherId)} dạy thay
                          </Badge>
                        ) : (
                          origin !== teacherId && (
                            <Badge variant="info">
                              Dạy thay {teacherName(origin)}
                            </Badge>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </AsyncBoundary>
    </section>
  );
}
