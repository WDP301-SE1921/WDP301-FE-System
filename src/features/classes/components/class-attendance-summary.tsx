"use client";
import { parseAsString, useQueryStates } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  dateRangeSchema,
  todayLocalDate,
} from "@/lib/validators/web-workflows";

function percentText(value: number | null) {
  return value === null ? "Chưa có buổi" : `${value}%`;
}

/** SRS §3.4, §5.5: attendance rate of an assigned class, computed by BE from finalized sessions. */
export function ClassAttendanceSummary({ classId }: { classId: string }) {
  const today = todayLocalDate();
  const [{ attendanceFrom, attendanceTo }, setRange] = useQueryStates({
    attendanceFrom: parseAsString.withDefault(
      new Date(Date.parse(`${today}T00:00:00Z`) - 30 * 86400000)
        .toISOString()
        .slice(0, 10),
    ),
    attendanceTo: parseAsString.withDefault(today),
  });
  const range = dateRangeSchema.safeParse({
    fromDate: attendanceFrom,
    toDate: attendanceTo,
  });
  const summary = useLiveQuery(
    ["attendance-summary", classId, attendanceFrom, attendanceTo],
    (signal) =>
      academicApi.attendanceSummary(
        classId,
        { fromDate: attendanceFrom, toDate: attendanceTo },
        signal,
      ),
    range.success,
  );
  const students = summary.data?.students ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tỷ lệ đi học</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attendance-summary-from">Từ ngày</Label>
            <Input
              id="attendance-summary-from"
              type="date"
              value={attendanceFrom}
              onChange={(event) =>
                void setRange({ attendanceFrom: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-summary-to">Đến ngày</Label>
            <Input
              id="attendance-summary-to"
              type="date"
              value={attendanceTo}
              onChange={(event) =>
                void setRange({ attendanceTo: event.target.value })
              }
            />
          </div>
        </div>
        {!range.success && (
          <p role="alert" className="text-sm text-destructive">
            {range.error.issues[0]?.message}
          </p>
        )}
        <AsyncBoundary
          isLoading={range.success && summary.isPending}
          isError={summary.isError}
          error={summary.error}
          onRetry={() => void summary.refetch()}
          data={students}
          emptyProps={{
            title: "Chưa có buổi đã chốt điểm danh trong khoảng ngày",
          }}
        >
          {summary.data && (
            <div className="space-y-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Tỷ lệ cả lớp", percentText(summary.data.attendancePercent)],
                  ["Có mặt", summary.data.counts.present],
                  ["Học bù", summary.data.counts.madeUp],
                  ["Vắng", summary.data.counts.absent],
                  ["Nghỉ có phép", summary.data.counts.excused],
                  ["Buổi phải học", summary.data.counts.required],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-border p-3"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Có mặt</TableHead>
                    <TableHead>Học bù</TableHead>
                    <TableHead>Vắng</TableHead>
                    <TableHead>Nghỉ có phép</TableHead>
                    <TableHead>Tỷ lệ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((row) => (
                    <TableRow key={row.studentId}>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.counts.present}</TableCell>
                      <TableCell>{row.counts.madeUp}</TableCell>
                      <TableCell>{row.counts.absent}</TableCell>
                      <TableCell>{row.counts.excused}</TableCell>
                      <TableCell>
                        {percentText(row.attendancePercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ = (có mặt + học bù) / buổi phải học. Nghỉ có phép trong kỳ
                tạm nghỉ không tính vào buổi phải học.
              </p>
            </div>
          )}
        </AsyncBoundary>
      </CardContent>
    </Card>
  );
}
