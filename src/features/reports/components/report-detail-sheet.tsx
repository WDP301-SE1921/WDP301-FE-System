"use client";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import { formatScore } from "@/lib/format";
import type { ReportRow } from "@/types/academic-workflows";

/** Chuyên cần dưới mức này thì tô cảnh báo để giáo viên thấy em cần nhắc. */
const LOW_ATTENDANCE_PERCENT = 80;
/** Điểm trung bình (thang 10) dưới mức này thì tô cảnh báo. */
const LOW_SCORE = 5;

/** Điểm trung bình của báo cáo: BE lưu %, giáo viên đọc thang 10 như mọi màn khác. */
function tenScale(row: ReportRow) {
  return row.averageScore === null ? null : row.averageScore / 10;
}

interface ReportDetailSheetProps {
  reportId: string | null;
  onClose: () => void;
  dayText: (value: string) => string;
}

/** Đọc một báo cáo ngay trên web: tiến độ dạy, chuyên cần và điểm từng em, nhận xét AI. */
export function ReportDetailSheet({
  reportId,
  onClose,
  dayText,
}: ReportDetailSheetProps) {
  const report = useLiveQuery(
    ["report", reportId ?? ""],
    (signal) => academicApi.report(reportId ?? "", signal),
    !!reportId,
  );
  const data = report.data;
  const progress = data?.teachingProgress;
  return (
    <Sheet open={!!reportId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="pr-12">
          <SheetTitle>{data?.className ?? "Báo cáo học tập"}</SheetTitle>
          <SheetDescription>
            {data?.from && data.to
              ? `Từ ${dayText(data.from)} đến ${dayText(data.to)} · ${
                  data.scope === "STUDENT" ? "Một học sinh" : "Toàn lớp"
                } · số liệu chốt lúc ${displayMoment(data.generatedAt)}`
              : "Đang tải báo cáo…"}
          </SheetDescription>
        </SheetHeader>
        <AsyncBoundary
          isLoading={report.isPending}
          isError={report.isError}
          error={report.error}
          onRetry={() => void report.refetch()}
          data={data ? [data] : undefined}
        >
          {data && progress && (
            <div className="space-y-6 pt-4 pb-6">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border p-4">
                  <dt className="text-sm text-muted-foreground">Buổi đã dạy</dt>
                  <dd className="text-2xl font-semibold tabular-nums">
                    {progress.completedSessions}/{progress.totalSessions}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <dt className="text-sm text-muted-foreground">Tiến độ dạy</dt>
                  <dd className="text-2xl font-semibold tabular-nums">
                    {progress.percent === null
                      ? "—"
                      : `${Math.round(progress.percent)}%`}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <dt className="text-sm text-muted-foreground">Học sinh</dt>
                  <dd className="text-2xl font-semibold tabular-nums">
                    {data.rows.length}
                  </dd>
                </div>
              </dl>
              <section className="space-y-2" aria-labelledby="report-ai">
                <h3 id="report-ai" className="font-semibold">
                  Nhận xét
                </h3>
                {data.aiSummary ? (
                  <p className="rounded-2xl bg-muted p-4 text-sm leading-relaxed whitespace-pre-line">
                    {data.aiSummary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Báo cáo này không yêu cầu AI viết nhận xét.
                  </p>
                )}
              </section>
              <section className="space-y-2" aria-labelledby="report-rows">
                <h3 id="report-rows" className="font-semibold">
                  Từng học sinh
                </h3>
                {data.rows.length ? (
                  <div className="overflow-x-auto rounded-2xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Học sinh</TableHead>
                          <TableHead className="text-right">
                            Có mặt / phải học
                          </TableHead>
                          <TableHead className="text-right">
                            Chuyên cần
                          </TableHead>
                          <TableHead className="text-right">
                            Bài có điểm
                          </TableHead>
                          <TableHead className="text-right">
                            Điểm TB (thang 10)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rows.map((row) => {
                          const score = tenScale(row);
                          const lowAttendance =
                            row.attendancePercent !== null &&
                            row.attendancePercent < LOW_ATTENDANCE_PERCENT;
                          const lowScore = score !== null && score < LOW_SCORE;
                          return (
                            <TableRow key={row.studentId}>
                              <TableCell className="font-medium whitespace-normal">
                                {row.name}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.attended}/{row.required}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.attendancePercent === null ? (
                                  "—"
                                ) : lowAttendance ? (
                                  <Badge variant="warning">
                                    {Math.round(row.attendancePercent)}%
                                  </Badge>
                                ) : (
                                  `${Math.round(row.attendancePercent)}%`
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.publishedGrades}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {score === null ? (
                                  "—"
                                ) : lowScore ? (
                                  <Badge variant="warning">
                                    {formatScore(score)}
                                  </Badge>
                                ) : (
                                  formatScore(score)
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có học sinh nào có buổi đã chốt hoặc điểm đã công bố
                    trong khoảng này.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tô vàng: chuyên cần dưới {LOW_ATTENDANCE_PERCENT}% hoặc điểm
                  trung bình dưới {LOW_SCORE}.
                </p>
              </section>
            </div>
          )}
        </AsyncBoundary>
      </SheetContent>
    </Sheet>
  );
}
