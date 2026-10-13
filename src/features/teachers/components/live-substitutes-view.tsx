"use client";
import { parseAsString, useQueryStates } from "nuqs";
import { useCurrentTime } from "@/hooks/use-current-time";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
} from "@/features/academic/components/live-fields";
import {
  dateRangeSchema,
  reasonSchema,
  requiredId,
  todayLocalDate,
} from "@/lib/validators/web-workflows";
import { z } from "zod";

const substituteFormSchema = z.object({
  teacherId: requiredId,
  reason: reasonSchema.shape.reason,
});
function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}

/** SRS §3.1, §5.4: only the manager assigns a substitute for one existing session. */
export function LiveSubstitutesView() {
  const today = todayLocalDate();
  const now = useCurrentTime();
  const [{ fromDate, toDate, sessionId }, setFilters] = useQueryStates({
    fromDate: parseAsString.withDefault(today),
    toDate: parseAsString.withDefault(addDays(today, 14)),
    sessionId: parseAsString.withDefault(""),
  });
  const range = dateRangeSchema.safeParse({ fromDate, toDate });
  const sessions = useLiveQuery(
    ["substitute-sessions", fromDate, toDate],
    (signal) => academicApi.sessions({ fromDate, toDate }, signal),
    range.success,
  );
  const upcoming = (sessions.data ?? []).filter(
    (session) =>
      session.status === "SCHEDULED" && Date.parse(session.startsAt) > now,
  );
  const selected = upcoming.find((session) => session.id === sessionId);
  return (
    <PageContainer>
      <PageHeader
        title="Xếp giáo viên dạy thay"
        description="Chọn một buổi sắp diễn ra rồi chọn giáo viên đang rảnh. Buổi học, bài học và danh sách học viên được giữ nguyên."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="substitute-from">Từ ngày</Label>
          <Input
            id="substitute-from"
            type="date"
            value={fromDate}
            onChange={(event) =>
              void setFilters({ fromDate: event.target.value, sessionId: "" })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="substitute-to">Đến ngày</Label>
          <Input
            id="substitute-to"
            type="date"
            value={toDate}
            onChange={(event) =>
              void setFilters({ toDate: event.target.value, sessionId: "" })
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
        isLoading={range.success && sessions.isPending}
        isError={sessions.isError}
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
        data={upcoming}
        emptyProps={{ title: "Không có buổi sắp diễn ra trong khoảng ngày" }}
      >
        <LiveSelect
          label="Buổi cần dạy thay"
          value={sessionId}
          options={upcoming.map((session) => ({
            value: session.id,
            label: `${session.class.name} · ${displayMoment(session.startsAt)} · GV ${session.teacher?.displayName ?? "chưa có tên"}`,
          }))}
          onChange={(value) => void setFilters({ sessionId: value })}
        />
      </AsyncBoundary>
      {selected && <SubstituteForm key={selected.id} sessionId={selected.id} />}
    </PageContainer>
  );
}

function SubstituteForm({ sessionId }: { sessionId: string }) {
  const detail = useLiveQuery(["substitute-session", sessionId], (signal) =>
    academicApi.session(sessionId, signal),
  );
  const candidates = useLiveQuery(
    ["substitute-candidates", sessionId],
    (signal) => academicApi.substituteCandidates(sessionId, signal),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Giáo viên dạy thay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AsyncBoundary
          isLoading={detail.isPending || candidates.isPending}
          isError={detail.isError || candidates.isError}
          error={detail.error ?? candidates.error}
          onRetry={() => {
            void detail.refetch();
            void candidates.refetch();
          }}
          data={candidates.data}
          emptyProps={{
            title: "Không có giáo viên rảnh",
            description:
              "Mọi giáo viên đang hoạt động đều có buổi trùng giờ này.",
          }}
        >
          {detail.data && (
            <>
              <p className="text-sm">
                {detail.data.class.name} ·{" "}
                {detail.data.lesson?.title ?? "Buổi học"} ·{" "}
                {displayMoment(detail.data.startsAt)} – giáo viên hiện tại:{" "}
                {detail.data.teacher?.displayName ?? "chưa có tên"}
              </p>
              <ApiForm
                schema={substituteFormSchema}
                fields={[
                  {
                    name: "teacherId",
                    label: "Giáo viên dạy thay",
                    type: "select",
                    options: (candidates.data ?? []).map((teacher) => ({
                      value: teacher.id,
                      label: teacher.displayName ?? teacher.email,
                    })),
                  },
                  { name: "reason", label: "Lý do", type: "textarea" },
                ]}
                submitLabel="Xếp dạy thay"
                successMessage="Đã xếp giáo viên dạy thay cho buổi học."
                onSubmit={(value) =>
                  academicApi.substitute(sessionId, {
                    ...value,
                    expectedRevision: detail.data.revision,
                  })
                }
              />
            </>
          )}
        </AsyncBoundary>
      </CardContent>
    </Card>
  );
}
