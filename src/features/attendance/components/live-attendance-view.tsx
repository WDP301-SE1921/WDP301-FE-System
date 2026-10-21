"use client";
import { useCurrentTime } from "@/hooks/use-current-time";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { academicApi } from "@/features/academic/api";
import { ApiError } from "@/lib/api/client";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  attendanceSchema,
  confirmationSchema,
} from "@/lib/validators/web-workflows";
import type { SessionParticipant } from "@/types/academic-workflows";
const attendanceFormSchema = z.object({
  items: attendanceSchema.shape.items,
  summary: attendanceSchema.shape.summary,
  confirmed: confirmationSchema.shape.confirmed,
});
type AttendanceForm = z.infer<typeof attendanceFormSchema>;

export function LiveAttendanceSession({
  sessionId,
  embedded = false,
}: {
  sessionId: string;
  embedded?: boolean;
}) {
  const session = useLiveQuery(["attendance-session", sessionId], (signal) =>
    academicApi.session(sessionId, signal),
  );
  const roster = useLiveQuery(
    ["roster", sessionId],
    (signal) => academicApi.roster(sessionId, signal),
    !!session.data,
  );
  const prepare = useLiveCommand();
  const now = useCurrentTime();
  const editable =
    session.data?.status === "SCHEDULED" &&
    Date.parse(session.data.endsAt) <= now;
  return (
    <AttendanceContainer embedded={embedded}>
      {embedded ? (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {session.data?.class.name ?? "Điểm danh"}
          </h2>
          {session.data && (
            <p className="text-sm text-muted-foreground">
              {session.data.lesson?.title ?? "Buổi học"} ·{" "}
              {displayMoment(session.data.startsAt)}
            </p>
          )}
        </div>
      ) : (
        <PageHeader
          title={session.data?.class.name ?? "Điểm danh"}
          description={
            session.data
              ? `${session.data.lesson?.title ?? "Buổi học"} · ${displayMoment(session.data.startsAt)}`
              : undefined
          }
        />
      )}
      {/* Buổi đã xếp dạy thay / đổi giáo viên (mở từ thông báo): BE trả 403/404 — giải thích thay vì báo lỗi. */}
      {session.error instanceof ApiError &&
      [403, 404].includes(session.error.status) ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-muted p-4 text-sm"
        >
          Buổi học này không còn trong lịch dạy của bạn — có thể đã được xếp
          giáo viên dạy thay hoặc đổi giáo viên phụ trách. Chọn buổi khác trong
          danh sách.
        </p>
      ) : (
        <AsyncBoundary
          isLoading={session.isPending}
          isError={session.isError}
          error={session.error}
          onRetry={() => void session.refetch()}
          data={session.data}
        >
          {session.data?.status === "SCHEDULED" && (
            <>
              <Button
                disabled={prepare.isPending}
                onClick={() =>
                  prepare.mutate(() => academicApi.prepareRoster(sessionId))
                }
              >
                {prepare.isPending
                  ? "Đang chuẩn bị…"
                  : "Chuẩn bị / cập nhật danh sách học viên"}
              </Button>
              <ApiFeedback error={prepare.error} />
            </>
          )}
          {!editable && session.data?.status === "SCHEDULED" && (
            <p className="text-sm text-muted-foreground">
              Bạn có thể chuẩn bị danh sách; chốt điểm danh sau khi buổi học kết
              thúc.
            </p>
          )}
          <AsyncBoundary
            isLoading={roster.isPending}
            isError={roster.isError}
            error={roster.error}
            onRetry={() => void roster.refetch()}
          >
            <Card>
              <CardHeader>
                <CardTitle>Học viên của buổi</CardTitle>
              </CardHeader>
              <CardContent>
                {roster.data &&
                  (editable ? (
                    <AttendanceEditor
                      key={`${sessionId}-${roster.data.map((row) => `${row.id}:${row.attendance}`).join(",")}`}
                      rows={roster.data}
                      sessionId={sessionId}
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Học sinh</TableHead>
                          <TableHead>Buổi học</TableHead>
                          <TableHead>Kết quả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roster.data.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="whitespace-normal">
                              {row.enrollment.studentProfile?.fullName ??
                                "Hồ sơ học sinh"}
                            </TableCell>
                            <TableCell>
                              {row.kind === "MAKEUP" ? "Học bù" : "Buổi thường"}
                            </TableCell>
                            <TableCell>
                              <Badge>{STATUS_TEXT[row.attendance]}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!roster.data.length && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              Chưa có học viên trong danh sách.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  ))}
              </CardContent>
            </Card>
          </AsyncBoundary>
        </AsyncBoundary>
      )}
    </AttendanceContainer>
  );
}
function AttendanceContainer({
  embedded,
  children,
}: {
  embedded: boolean;
  children: React.ReactNode;
}) {
  return embedded ? (
    <div className="min-w-0 space-y-4">{children}</div>
  ) : (
    <PageContainer>{children}</PageContainer>
  );
}
function AttendanceEditor({
  rows,
  sessionId,
}: {
  rows: SessionParticipant[];
  sessionId: string;
}) {
  const action = useLiveCommand();
  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      items: rows.map((row) => ({
        participantId: row.id,
        status: row.attendance === "UNMARKED" ? undefined : row.attendance,
      })),
      summary: "",
      confirmed: false,
    },
  });
  const items = useWatch({ control: form.control, name: "items" });
  const totals = (status: string) =>
    items.filter((item) => item.status === status).length;
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((value) =>
        action.mutate(() => academicApi.attendance(sessionId, value)),
      )}
    >
      <fieldset disabled={action.isPending} className="space-y-4">
        <div className="flex flex-wrap gap-2" role="status">
          <Badge variant="success">{totals("PRESENT")} có mặt</Badge>
          <Badge variant="danger">{totals("ABSENT")} vắng</Badge>
          <Badge variant="warning">{totals("EXCUSED")} có phép</Badge>
          <Badge variant="outline">
            {items.filter((item) => !item.status).length} chưa chọn
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học sinh</TableHead>
              <TableHead>Kết quả điểm danh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-normal">
                  {row.enrollment.studentProfile?.fullName ?? "Học sinh"}
                  {row.kind === "MAKEUP" && (
                    <Badge variant="outline" className="ml-2">
                      Học bù
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Controller
                    control={form.control}
                    name={`items.${index}.status`}
                    render={({ field }) => (
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label={`Điểm danh ${row.enrollment.studentProfile?.fullName ?? "học sinh"}`}
                      >
                        {(
                          [
                            ["PRESENT", "Có mặt"],
                            ["ABSENT", "Vắng"],
                            ["EXCUSED", "Có phép"],
                          ] as const
                        ).map(([status, label]) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={
                              field.value === status ? "default" : "outline"
                            }
                            aria-pressed={field.value === status}
                            disabled={
                              row.attendance === "EXCUSED" ||
                              status === "EXCUSED"
                            }
                            title={
                              status === "EXCUSED"
                                ? "Có phép được xác định từ đơn nghỉ đã duyệt."
                                : undefined
                            }
                            onClick={() => field.onChange(status)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    )}
                  />
                  {form.formState.errors.items?.[index]?.status?.message && (
                    <p role="alert" className="text-sm text-destructive">
                      Chọn kết quả cho học viên này.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Label htmlFor="attendance-summary">Ghi chú buổi học</Label>
        <Textarea id="attendance-summary" {...form.register("summary")} />
        {form.formState.errors.summary && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.summary.message}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Controller
            control={form.control}
            name="confirmed"
            render={({ field }) => (
              <Checkbox
                id="attendance-confirm"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="attendance-confirm">
            Tôi đã kiểm tra kết quả từng học viên và xác nhận chốt buổi.
          </Label>
        </div>
        {form.formState.errors.confirmed && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.confirmed.message}
          </p>
        )}
        <Button type="submit">
          {action.isPending ? "Đang chốt…" : "Chốt điểm danh"}
        </Button>
      </fieldset>
      <ApiFeedback error={action.error} />
    </form>
  );
}
