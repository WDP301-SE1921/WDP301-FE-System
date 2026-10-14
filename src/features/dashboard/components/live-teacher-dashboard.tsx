"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkSquare01Icon,
  SchoolIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi, teacherSubmissionQueue } from "@/features/academic/api";
import { registrationApi } from "@/features/registration-flow/api";
import { todayInVietnam } from "@/features/registration-flow/calendar";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { DashboardStatCard } from "./dashboard-stat-card";

export function LiveTeacherDashboard() {
  const today = todayInVietnam();
  const classes = useLiveQuery(["teacher-dashboard-classes"], () =>
    registrationApi.classes(),
  );
  const sessions = useLiveQuery(
    ["teacher-dashboard-sessions", today],
    (signal) =>
      academicApi.sessions({ fromDate: today, toDate: today }, signal),
  );
  const submissions = useLiveQuery(
    ["teacher-dashboard-submissions"],
    teacherSubmissionQueue,
  );
  const announcements = useLiveQuery(
    ["teacher-dashboard-announcements"],
    academicApi.announcements,
  );
  const todaySessions = (sessions.data ?? []).filter(
    (item) => item.status !== "CANCELLED",
  );
  const ungraded = submissions.data?.filter(
    (item) => !item.submission.grades.length,
  ).length;
  const pendingReview = submissions.data?.filter(
    (item) => item.submission.grades[0]?.status === "DRAFT",
  ).length;
  const readyToPublish = submissions.data?.filter(
    (item) => item.submission.grades[0]?.status === "APPROVED",
  ).length;
  const cards = [
    {
      label: "Lớp phụ trách",
      value: classes.data?.length ?? "—",
      note: classes.isPending ? "Đang tải lớp học…" : "Lớp được phân công",
      icon: SchoolIcon,
    },
    {
      label: "Buổi học hôm nay",
      value: sessions.data ? todaySessions.length : "—",
      note: sessions.isPending ? "Đang tải lịch…" : "Không bao gồm buổi đã hủy",
      icon: Calendar03Icon,
    },
    {
      label: "Bài nộp chưa chấm",
      value: ungraded ?? "—",
      note: submissions.isPending ? "Đang tải bài nộp…" : "Chưa có bản chấm",
      icon: Task01Icon,
    },
    {
      label: "Bản chấm chờ duyệt",
      value: pendingReview ?? "—",
      note: submissions.isPending
        ? "Đang tải bài nộp…"
        : "Cần giáo viên kiểm tra",
      icon: CheckmarkSquare01Icon,
    },
  ];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Tổng quan giảng dạy"
        description="Lịch hôm nay và các công việc cần xử lý trong lớp của bạn."
        actions={
          <Button render={<Link href="/teacher/assignments/new" />}>
            Tạo bài tập / kiểm tra
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            note={card.note}
            icon={<HugeiconsIcon icon={card.icon} />}
          />
        ))}
      </div>
      {classes.isError && (
        <AsyncBoundary
          isLoading={false}
          isError
          error={classes.error}
          onRetry={() => void classes.refetch()}
        >
          {null}
        </AsyncBoundary>
      )}
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>Buổi học hôm nay</CardTitle>
                <CardDescription>
                  {today.split("-").reverse().join("/")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/teacher/schedule" />}
              >
                Xem lịch dạy
              </Button>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={sessions.isPending}
                isError={sessions.isError}
                error={sessions.error}
                onRetry={() => void sessions.refetch()}
                data={sessions.data}
                emptyProps={{ title: "Hôm nay không có buổi được phân công" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Giờ học</TableHead>
                      <TableHead>Lớp / nội dung</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.data?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {new Intl.DateTimeFormat("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Ho_Chi_Minh",
                          }).format(new Date(session.startsAt))}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/teacher/classes/${session.classId}`}
                            className="font-medium hover:underline"
                          >
                            {session.class.name}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {session.lesson?.title ?? "Buổi học"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {STATUS_TEXT[session.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {session.status !== "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link
                                  href={`/teacher/attendance/${session.id}`}
                                />
                              }
                            >
                              Điểm danh
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Bài nộp gần đây</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/teacher/grading" />}
              >
                Xem tất cả
              </Button>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={submissions.isPending}
                isError={submissions.isError}
                error={submissions.error}
                onRetry={() => void submissions.refetch()}
                data={submissions.data}
                emptyProps={{ title: "Chưa có bài nộp" }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bài tập / kiểm tra</TableHead>
                      <TableHead>Nộp lúc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.data
                      ?.slice(0, 5)
                      .map(({ assignment, submission }) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Lần nộp {submission.attemptNo}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {displayMoment(submission.submittedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {submission.grades[0]
                                ? STATUS_TEXT[submission.grades[0].status]
                                : "Chưa chấm"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              render={
                                <Link
                                  href={`/teacher/grading/${submission.id}`}
                                />
                              }
                            >
                              Xem bài
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Việc cần làm</CardTitle>
              <CardDescription>
                Giáo viên duyệt trước khi công bố kết quả.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={submissions.isPending}
                isError={submissions.isError}
                error={submissions.error}
                onRetry={() => void submissions.refetch()}
              >
                <div className="divide-y divide-border">
                  {[
                    { label: "Chấm bài nộp", count: ungraded },
                    { label: "Duyệt bản chấm", count: pendingReview },
                    {
                      label: "Công bố kết quả đã duyệt",
                      count: readyToPublish,
                    },
                  ].map((task) => (
                    <Link
                      key={task.label}
                      href="/teacher/grading"
                      className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0 hover:text-primary"
                    >
                      <span>{task.label}</span>
                      <Badge variant="secondary">{task.count ?? 0}</Badge>
                    </Link>
                  ))}
                </div>
              </AsyncBoundary>
              <Button
                variant="outline"
                className="mt-5 w-full"
                render={<Link href="/teacher/curriculum" />}
              >
                Thẩm định giáo trình
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                render={<Link href="/teacher/reports" />}
              >
                Báo cáo học tập
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Thông báo lớp học</CardTitle>
              <CardDescription>
                Các thông báo dành cho lớp của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncBoundary
                isLoading={announcements.isPending}
                isError={announcements.isError}
                error={announcements.error}
                onRetry={() => void announcements.refetch()}
                data={announcements.data}
                emptyProps={{ title: "Chưa có thông báo" }}
              >
                <div className="divide-y divide-border">
                  {announcements.data?.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="space-y-2 py-3 first:pt-0 last:pb-0"
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </AsyncBoundary>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
