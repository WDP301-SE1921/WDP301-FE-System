"use client";
import Link from "next/link";
import { useCurrentTime } from "@/hooks/use-current-time";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { academicApi } from "@/features/academic/api";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import {
  attendanceSchema,
  confirmationSchema,
} from "@/lib/validators/web-workflows";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import type { SessionParticipant } from "@/types/academic-workflows";
const attendanceFormSchema = z.object({
  items: attendanceSchema.shape.items,
  summary: attendanceSchema.shape.summary,
  confirmed: confirmationSchema.shape.confirmed,
});
type AttendanceForm = z.infer<typeof attendanceFormSchema>;

export function LiveAttendanceList() {
  const today = todayInVietnam();
  const [{ fromDate, toDate }, setRange] = useQueryStates({
    fromDate: parseAsString.withDefault(
      new Date(Date.parse(`${today}T00:00:00Z`) - 7 * 86400000)
        .toISOString()
        .slice(0, 10),
    ),
    toDate: parseAsString.withDefault(today),
  });
  const sessions = useLiveQuery(
    ["attendance-list", fromDate, toDate],
    (signal) => academicApi.sessions({ fromDate, toDate }, signal),
  );
  return (
    <PageContainer>
      <PageHeader
        title="Điểm danh buổi học"
        description="Danh sách buổi được phân công cho tài khoản đang đăng nhập."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attendance-from">Từ ngày</Label>
          <Input
            id="attendance-from"
            type="date"
            value={fromDate}
            onChange={(event) =>
              void setRange({ fromDate: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendance-to">Đến ngày</Label>
          <Input
            id="attendance-to"
            type="date"
            value={toDate}
            onChange={(event) => void setRange({ toDate: event.target.value })}
          />
        </div>
      </div>
      <AsyncBoundary
        isLoading={sessions.isPending}
        isError={sessions.isError}
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
        data={sessions.data}
        emptyProps={{ title: "Không có buổi học trong khoảng ngày" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.data?.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>
                  {session.class.name} · {session.lesson?.title ?? "Buổi học"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  {displayMoment(session.startsAt)} –{" "}
                  {displayMoment(session.endsAt)}
                </p>
                <Badge>{STATUS_TEXT[session.status]}</Badge>
                <div>
                  <Button
                    variant="outline"
                    render={<Link href={`/teacher/attendance/${session.id}`} />}
                  >
                    Mở danh sách và điểm danh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
export function LiveAttendanceSession({ sessionId }: { sessionId: string }) {
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
    <PageContainer>
      <PageHeader
        title={session.data?.class.name ?? "Điểm danh"}
        description={
          session.data
            ? `${session.data.lesson?.title ?? "Buổi học"} · ${displayMoment(session.data.startsAt)}`
            : undefined
        }
      />
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
                  <div className="space-y-3">
                    {roster.data.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap justify-between gap-3"
                      >
                        <p>
                          {row.enrollment.studentProfile?.fullName ??
                            "Hồ sơ học sinh"}{" "}
                          · {row.kind === "MAKEUP" ? "Học bù" : "Buổi thường"}
                        </p>
                        <Badge>{STATUS_TEXT[row.attendance]}</Badge>
                      </div>
                    ))}
                    {!roster.data.length && (
                      <p>Chưa có học viên trong danh sách.</p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </AsyncBoundary>
      </AsyncBoundary>
    </PageContainer>
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
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((value) =>
        action.mutate(() => academicApi.attendance(sessionId, value)),
      )}
    >
      <fieldset disabled={action.isPending} className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="space-y-2 rounded-2xl border border-border p-4"
          >
            <Controller
              control={form.control}
              name={`items.${index}.status`}
              render={({ field }) => (
                <LiveSelect
                  label={`${row.enrollment.studentProfile?.fullName ?? "Học sinh"}${row.kind === "MAKEUP" ? " · Học bù" : ""}`}
                  value={field.value ?? ""}
                  options={
                    row.attendance === "EXCUSED"
                      ? [
                          {
                            value: "EXCUSED",
                            label: "Nghỉ được phép (đã có đơn)",
                          },
                        ]
                      : [
                          { value: "PRESENT", label: "Có mặt" },
                          { value: "ABSENT", label: "Vắng" },
                        ]
                  }
                  disabled={row.attendance === "EXCUSED"}
                  onChange={field.onChange}
                />
              )}
            />
            {form.formState.errors.items?.[index]?.status?.message && (
              <p role="alert" className="text-sm text-destructive">
                Chọn kết quả cho học viên này.
              </p>
            )}
          </div>
        ))}
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
