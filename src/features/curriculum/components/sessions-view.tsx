"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { registrationApi } from "@/features/registration-flow/api";
import { curriculumApi } from "../api";
import { curriculumKeys } from "../hooks/use-curriculum";
import { sessionTime } from "../session-format";
import { SessionGenerator } from "./session-generator";
import { SessionDetailSheet } from "./session-detail-sheet";
import { GenerationHistory } from "./generation-history";
import { Button } from "@/components/ui/button";

const STATUS = {
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
} as const;

/** Danh sách buổi theo lớp cho vai trò không sinh lịch. Quản lý dùng `ProgramSessionGenerator`. */
export function ScheduledSessionsView({
  classId: fixedClassId,
}: {
  classId?: string;
}) {
  const role = useCurrentRole();
  const user = useCurrentUser();
  const [sessionId, setSessionId] = useQueryState(
    "session",
    parseAsString.withDefault(""),
  );
  const [selectedId, setSelectedId] = useQueryState(
    "classId",
    parseAsString.withDefault(""),
  );
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const classId = fixedClassId ?? selectedId;
  const detail = useQuery({
    queryKey: ["registration-class", classId],
    queryFn: ({ signal }) => registrationApi.class(classId, 1, signal),
    enabled: !!classId,
    retry: false,
  });
  const classroom = detail.data;
  const sessions = useQuery({
    queryKey: curriculumKeys.sessions(classId),
    queryFn: ({ signal }) => curriculumApi.sessions(classId, signal),
    enabled: !!classroom,
    retry: false,
  });
  return (
    <PageContainer>
      <PageHeader
        title="Buổi học theo giáo trình"
        description="Xem các buổi học đã sinh. Giờ học hiển thị theo giờ Việt Nam."
      />
      <ApiFeedback error={classes.error} retry={() => void classes.refetch()} />
      <ApiFeedback error={detail.error} retry={() => void detail.refetch()} />
      {!fixedClassId && (
        <div className="space-y-2">
          <Label htmlFor="sessions-class">Lớp học</Label>
          <Select
            value={classId || null}
            items={classes.data?.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.program.subject} · Khối ${item.program.grade}`,
            }))}
            onValueChange={(value) =>
              void setSelectedId(typeof value === "string" ? value : null)
            }
          >
            <SelectTrigger id="sessions-class">
              <SelectValue placeholder="Chọn lớp học" />
            </SelectTrigger>
            <SelectContent>
              {classes.data?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.program.subject} · Khối{" "}
                  {item.program.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {classes.isPending && <p>Đang tải lớp học…</p>}
      {classId && detail.isPending && <p>Đang tải chi tiết lớp…</p>}
      {classroom && (
        <>
          {role === "center_manager" && <GenerationHistory classId={classId} />}
          {role === "center_manager" && user && (
            <Card>
              <CardHeader>
                <CardTitle>Xem trước và sinh lịch · {classroom.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionGenerator
                  key={`${user.id}-${classId}`}
                  classroom={classroom}
                  userId={user.id}
                  classNames={Object.fromEntries(
                    (classes.data ?? []).map((item) => [item.id, item.name]),
                  )}
                />
              </CardContent>
            </Card>
          )}
          <ApiFeedback
            error={sessions.error}
            retry={() => void sessions.refetch()}
          />
          {sessions.isPending && <p>Đang tải buổi học…</p>}
          {sessions.data?.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex flex-wrap justify-between gap-3">
                  <CardTitle>{session.lesson?.title ?? "Buổi học"}</CardTitle>
                  <Badge
                    variant={
                      session.status === "CANCELLED" ? "secondary" : "outline"
                    }
                  >
                    {STATUS[session.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {sessionTime(session.startsAt)} →{" "}
                  {sessionTime(session.endsAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.class.name}
                  {session.lesson?.kind === "MONTHLY_TEST"
                    ? ` · Kiểm tra tháng ${session.lesson.monthKey}`
                    : ""}
                </p>
                <Button
                  variant="outline"
                  onClick={() => void setSessionId(session.id)}
                >
                  Chi tiết buổi học
                </Button>
              </CardContent>
            </Card>
          ))}
          {sessions.isSuccess && !sessions.data.length && (
            <p className="rounded-2xl border border-border p-6 text-center text-muted-foreground">
              Lớp chưa có buổi học đã sinh.
            </p>
          )}
        </>
      )}
      {sessionId && (
        <SessionDetailSheet
          key={sessionId}
          id={sessionId}
          onClose={() => void setSessionId(null)}
        />
      )}
    </PageContainer>
  );
}
