"use client";
import Link from "next/link";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, teacherSubmissionQueue } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
export function LiveTeacherDashboard() {
  const data = useLiveQuery(
    ["teacher-dashboard", todayInVietnam()],
    async (signal) => {
      const today = todayInVietnam();
      const [classes, sessions, submissions, announcements] = await Promise.all(
        [
          registrationApi.classes(),
          academicApi.sessions({ fromDate: today, toDate: today }, signal),
          teacherSubmissionQueue(signal),
          academicApi.announcements(signal),
        ],
      );
      return { classes, sessions, submissions, announcements };
    },
  );
  return (
    <PageContainer>
      <PageHeader
        title="Công việc giảng dạy"
        description="Lớp, lịch và bài nộp thuộc tài khoản giáo viên đang đăng nhập."
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Lớp phụ trách", data.data.classes.length],
                ["Buổi hôm nay", data.data.sessions.length],
                [
                  "Bài nộp chưa chấm",
                  data.data.submissions.filter(
                    (item) => !item.submission.grades.length,
                  ).length,
                ],
                [
                  "Bản chấm chờ duyệt",
                  data.data.submissions.filter(
                    (item) => item.submission.grades[0]?.status === "DRAFT",
                  ).length,
                ],
              ].map(([label, value]) => (
                <Card key={String(label)}>
                  <CardHeader>
                    <CardTitle>{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Buổi hôm nay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.data.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <p>
                      {session.class.name} · {displayMoment(session.startsAt)} ·{" "}
                      {STATUS_TEXT[session.status]}
                    </p>
                    <Button
                      variant="outline"
                      render={
                        <Link href={`/teacher/attendance/${session.id}`} />
                      }
                    >
                      Mở điểm danh
                    </Button>
                  </div>
                ))}
                {!data.data.sessions.length && (
                  <p>Hôm nay không có buổi được phân công.</p>
                )}
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/teacher/grading" />}>
                Mở bài nộp
              </Button>
              <Button
                variant="outline"
                render={<Link href="/teacher/assignments/new" />}
              >
                Tạo bài tập
              </Button>
              <Button
                variant="outline"
                render={<Link href="/teacher/reports" />}
              >
                Báo cáo học tập
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Thông báo lớp học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.data.announcements.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <p className="font-medium">{item.title}</p>
                    <p className="whitespace-pre-wrap">{item.content}</p>
                  </div>
                ))}
                {!data.data.announcements.length && <p>Chưa có thông báo.</p>}
              </CardContent>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
