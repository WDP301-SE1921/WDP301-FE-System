"use client";
import Link from "next/link";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-role";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { currentEnrollmentClass } from "@/features/academic/api";
import {
  displayDate,
  scheduleText,
} from "@/features/registration-flow/calendar";
import { directoryApi } from "../api";
export function LiveStudentDetailView({ id }: { id: string }) {
  const user = useCurrentUser();
  const data = useLiveQuery(["student-detail", id], async (signal) => {
    const [student, enrollments, schedule] = await Promise.all([
      directoryApi.student(id, signal),
      directoryApi.studentEnrollments(id, signal),
      directoryApi.studentSchedule(id, signal),
    ]);
    return { student, enrollments, schedule };
  });
  return (
    <PageContainer>
      <PageHeader
        title={data.data?.student.fullName ?? "Hồ sơ học sinh"}
        description="Ghi danh và lịch sử học tại trung tâm."
      />
      <AsyncBoundary
        isLoading={data.isPending}
        isError={data.isError}
        error={data.error}
        onRetry={() => void data.refetch()}
        data={data.data}
      >
        {data.data && (
          <>
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p>
                  Khối {data.data.student.grade} ·{" "}
                  {data.data.student.status === "ACTIVE"
                    ? "Hoạt động"
                    : "Ngừng học"}
                </p>
                <p>Phụ huynh: {data.data.student.parentProfile.user.email}</p>
                {user?.role === "staff" &&
                  data.data.student.status === "ACTIVE" && (
                    <Button
                      render={
                        <Link
                          href={`/staff/enrollments/new?studentId=${id}&email=${encodeURIComponent(data.data.student.parentProfile.user.email)}`}
                        />
                      }
                    >
                      Đăng ký thêm lớp
                    </Button>
                  )}
                {user?.role === "staff" && (
                  <Button
                    variant="outline"
                    render={
                      <Link href={`/staff/absences/makeup?studentId=${id}`} />
                    }
                  >
                    Nghỉ học và học bù
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lịch tuần hiện tại và sắp tới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.data.schedule.map((slot, index) => (
                  <p key={`${slot.enrollmentId}-${slot.classId}-${index}`}>
                    {slot.className} · {scheduleText([slot])}
                    {slot.effectiveFrom
                      ? ` · Từ ${displayDate(slot.effectiveFrom)}`
                      : ""}
                    {slot.effectiveTo
                      ? ` đến ${displayDate(slot.effectiveTo)}`
                      : ""}
                  </p>
                ))}
                {!data.data.schedule.length && (
                  <p>Chưa có lịch tuần đang hiệu lực.</p>
                )}
              </CardContent>
            </Card>
            {data.data.enrollments.map((enrollment) => {
              const currentId = currentEnrollmentClass(enrollment);
              const current =
                enrollment.placements.find(
                  (placement) => placement.classId === currentId,
                )?.class ?? enrollment.class;
              return (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <CardTitle>
                      {current.name} · {current.program.subject}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge>
                      {enrollment.status === "ENDED"
                        ? "Đã kết thúc"
                        : "Ghi danh"}
                    </Badge>
                    <p>
                      {enrollment.startDate &&
                        displayDate(enrollment.startDate)}{" "}
                      – {enrollment.endDate && displayDate(enrollment.endDate)}{" "}
                      · {enrollment.packageMonths} tháng
                    </p>
                    <p>{scheduleText(current.weeklySchedules)}</p>
                    {enrollment.placements.length > 1 && (
                      <details>
                        <summary>Lịch sử xếp lớp</summary>
                        {enrollment.placements.map((placement) => (
                          <p
                            key={`${placement.classId}-${placement.effectiveFrom}`}
                          >
                            {placement.class?.name ?? placement.classId} ·{" "}
                            {displayDate(placement.effectiveFrom)} –{" "}
                            {placement.effectiveTo
                              ? displayDate(placement.effectiveTo)
                              : "hiện tại"}
                          </p>
                        ))}
                      </details>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!data.data.enrollments.length && <p>Chưa có ghi danh.</p>}
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
