"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { ClassRoster } from "@/components/shared/academic/class-roster";
import { registrationApi } from "@/features/registration-flow/api";
import { curriculumApi } from "@/features/curriculum/api";
import { sessionTime } from "@/features/curriculum/session-format";
import { vietnamLocalInput } from "@/features/curriculum/session-contract";
import { scheduleText } from "@/features/registration-flow/calendar";
import { ROUTES } from "@/constants/routes";
import { ApiForm } from "@/components/shared/forms/api-form";
import { displayMoment } from "@/features/academic/components/live-fields";
import { confirmationSchema } from "@/lib/validators/web-workflows";
import { ClassAttendanceSummary } from "./class-attendance-summary";
import { calendarDateLabel } from "@/lib/calendar-date";
export function TeacherClassDetailView({ classId }: { classId: string }) {
  const [page, setPage] = useQueryState(
    "rosterPage",
    parseAsInteger.withDefault(1),
  );
  const [unitId, setUnitId] = useQueryState(
    "unit",
    parseAsString.withDefault(""),
  );
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("overview"),
  );
  const detail = useQuery({
    queryKey: ["registration-class", classId, page],
    queryFn: ({ signal }) =>
      registrationApi.class(classId, Math.max(1, page), signal),
    retry: false,
  });
  const sessions = useQuery({
    queryKey: ["curriculum", "sessions", classId],
    queryFn: ({ signal }) => curriculumApi.sessions(classId, signal),
    retry: false,
  });
  const units = useQuery({
    queryKey: ["curriculum", "teacher", detail.data?.programId],
    queryFn: ({ signal }) =>
      curriculumApi.units(detail.data!.programId, signal),
    enabled: !!detail.data,
    retry: false,
  });
  const c = detail.data;
  const unit = useQuery({
    queryKey: ["curriculum", "unit", unitId],
    queryFn: ({ signal }) => curriculumApi.unit(unitId, signal),
    enabled:
      tab === "curriculum" && !!units.data?.some((item) => item.id === unitId),
    retry: false,
  });
  return (
    <PageContainer>
      <PageHeader
        title={c?.name ?? "Chi tiết lớp"}
        backHref={ROUTES.TEACHER.CLASSES}
        description={
          c
            ? c.program.name +
              " · " +
              c.program.subject +
              " · Khối " +
              c.program.grade
            : undefined
        }
      />
      <Tabs value={tab} onValueChange={(v) => void setTab(String(v))}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="students">Học sinh</TabsTrigger>
          <TabsTrigger value="attendance">Chuyên cần</TabsTrigger>
          <TabsTrigger value="sessions">Buổi học</TabsTrigger>
          <TabsTrigger value="curriculum">Giáo trình</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "attendance" && <ClassAttendanceSummary classId={classId} />}
      <AsyncBoundary
        isLoading={detail.isPending}
        isError={detail.isError}
        error={detail.error}
        onRetry={() => void detail.refetch()}
      >
        {c && tab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>{scheduleText(c.weeklySchedules) || "Chưa có lịch tuần"}</p>
              <p>
                Giáo viên:{" "}
                {c.teacher?.displayName ?? c.teacher?.email ?? "Chưa có tên"}
              </p>
              <p>Sức chứa: {c.capacity} học sinh</p>
              {c.scheduleConfirmedAt ? (
                <p className="text-sm text-muted-foreground">
                  Bạn đã xác nhận lịch cố định lúc{" "}
                  {displayMoment(c.scheduleConfirmedAt)}. Lịch tuần đã khóa;
                  quản lý trung tâm mở khóa nếu cần thay đổi.
                </p>
              ) : (
                c.weeklySchedules.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-border p-4">
                    <p className="font-medium">Xác nhận lịch cố định</p>
                    <ApiForm
                      schema={confirmationSchema}
                      defaults={{ confirmed: false }}
                      fields={[
                        {
                          name: "confirmed",
                          label: `Tôi xác nhận dạy theo lịch: ${scheduleText(c.weeklySchedules)}`,
                          type: "checkbox",
                        },
                      ]}
                      submitLabel="Xác nhận lịch"
                      successMessage="Đã xác nhận lịch cố định."
                      onSubmit={() => registrationApi.confirmSchedule(classId)}
                    />
                  </div>
                )
              )}
              <Button
                variant="outline"
                render={
                  <Link
                    href={
                      ROUTES.TEACHER.SCHEDULE +
                      "?classId=" +
                      encodeURIComponent(classId)
                    }
                  />
                }
              >
                Mở thời khóa biểu
              </Button>
            </CardContent>
          </Card>
        )}
        {c && tab === "students" && (
          <ClassRoster
            roster={c.enrollments}
            page={page}
            onPageChange={(v) => void setPage(v)}
          />
        )}
      </AsyncBoundary>
      {tab === "sessions" && (
        <AsyncBoundary
          isLoading={sessions.isPending}
          isError={sessions.isError}
          error={sessions.error}
          onRetry={() => void sessions.refetch()}
          data={sessions.data}
          emptyProps={{ title: "Chưa có buổi học" }}
        >
          <div className="grid gap-3">
            {sessions.data?.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.lesson?.title ?? "Buổi học"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {sessionTime(s.startsAt)} → {sessionTime(s.endsAt)}
                  </p>
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href={
                          ROUTES.TEACHER.SCHEDULE +
                          "?" +
                          new URLSearchParams({
                            classId,
                            session: s.id,
                            date: vietnamLocalInput(s.startsAt).slice(0, 10),
                          })
                        }
                      />
                    }
                  >
                    Xem nội dung buổi học
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncBoundary>
      )}
      {tab === "curriculum" && (
        <AsyncBoundary
          isLoading={units.isPending}
          isError={units.isError}
          error={units.error}
          onRetry={() => void units.refetch()}
          data={units.data}
          emptyProps={{ title: "Chưa có giáo trình được duyệt" }}
        >
          <div className="grid gap-3">
            {units.data?.map((u) => (
              <Card key={u.id}>
                <CardHeader>
                  <CardTitle>{u.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusBadge category="curriculum" status={u.status} />
                  <p>
                    {calendarDateLabel(u.fromDate.slice(0, 10))} –{" "}
                    {calendarDateLabel(u.toDate.slice(0, 10))}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void setUnitId(unitId === u.id ? null : u.id)
                    }
                  >
                    Xem nội dung giáo trình
                  </Button>
                  {unitId === u.id && (
                    <AsyncBoundary
                      isLoading={unit.isPending}
                      isError={unit.isError}
                      error={unit.error}
                      onRetry={() => void unit.refetch()}
                    >
                      <div className="mt-4 space-y-3">
                        {unit.data?.lessons
                          .filter((lesson) => lesson.kind === "LESSON")
                          .map((lesson) => (
                            <div
                              key={lesson.id}
                              className="rounded-xl border border-border p-3"
                            >
                              <p className="font-medium">
                                {"Bài " + lesson.sequence}: {lesson.title}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm">
                                {lesson.content}
                              </p>
                            </div>
                          ))}
                      </div>
                    </AsyncBoundary>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncBoundary>
      )}
    </PageContainer>
  );
}
