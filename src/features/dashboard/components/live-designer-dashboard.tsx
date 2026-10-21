"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  Edit02Icon,
  Clock01Icon,
  ArrowTurnBackwardIcon,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { curriculumApi } from "@/features/curriculum/api";
import { estimateLessons } from "@/features/curriculum/workspace-selectors";
import { todayInVietnam } from "@/lib/calendar-date";
import { DashboardStatCard } from "./dashboard-stat-card";

const OPEN_FEEDBACK = ["OPEN", "IN_PROGRESS"];

/**
 * Dashboard Thiết kế giáo trình (artboard TK-Dashboard). Vai trò này không đọc được lịch lớp
 * nên "bài cần" chờ BE-1 (số buổi/tuần của khóa); hiện số bài đã soạn và số tuần hiệu lực.
 */
export function LiveDesignerDashboard() {
  const today = todayInVietnam();
  const units = useLiveQuery(["designer-dashboard-units"], (signal) =>
    curriculumApi.units(undefined, signal),
  );
  const feedback = useLiveQuery(["designer-dashboard-feedback"], (signal) =>
    academicApi.feedback(signal),
  );
  const all = units.data ?? [];
  const returned = all.filter(
    (unit) =>
      unit.status === "DRAFT" && !!(unit.reviewNote || unit.technicalReviewNote),
  );
  const drafting = all.filter(
    (unit) =>
      unit.status === "DRAFT" && !(unit.reviewNote || unit.technicalReviewNote),
  );
  const pending = all.filter((unit) => unit.status === "PENDING_REVIEW");
  const openFeedback = (feedback.data ?? []).filter((item) =>
    OPEN_FEEDBACK.includes(item.status),
  );
  // Sẵn sàng cho kỳ sau: bản sớm nhất bắt đầu sau hôm nay, theo từng khóa.
  const nextByProgram = new Map<string, (typeof all)[number]>();
  for (const unit of all)
    if (unit.status !== "ARCHIVED" && unit.fromDate.slice(0, 10) > today) {
      const current = nextByProgram.get(unit.programId);
      if (!current || unit.fromDate < current.fromDate)
        nextByProgram.set(unit.programId, unit);
    }
  const readiness = [...nextByProgram.values()].map((unit) => {
    // Thiết kế giáo trình không đọc được lịch lớp: chỉ có số tuần, chưa ước được số bài cần (BE-1).
    const estimate = estimateLessons(
      unit.fromDate.slice(0, 10),
      unit.toDate.slice(0, 10),
      [],
    );
    return { unit, lessons: unit._count?.lessons ?? 0, weeks: estimate?.weeks };
  });
  const stat = (value: number) => (units.isPending ? "…" : value);

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan giáo trình"
        description="Giáo trình đang soạn, bị trả lại, chờ duyệt và phản hồi từ giáo viên."
        actions={
          <Button render={<Link href={ROUTES.MANAGER.CURRICULUM} />}>
            Danh sách giáo trình
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Đang soạn"
          value={stat(drafting.length)}
          note="Bản nháp chưa gửi thẩm định"
          icon={<HugeiconsIcon icon={Edit02Icon} />}
        />
        <DashboardStatCard
          label="Bị trả lại"
          value={stat(returned.length)}
          note="Cần sửa theo nhận xét rồi gửi lại"
          icon={<HugeiconsIcon icon={ArrowTurnBackwardIcon} />}
        />
        <DashboardStatCard
          label="Chờ duyệt"
          value={stat(pending.length)}
          note="Đang chờ giáo viên thẩm định hoặc quản lý xác nhận"
          icon={<HugeiconsIcon icon={Clock01Icon} />}
        />
        <DashboardStatCard
          label="Phản hồi chưa xử lý"
          value={feedback.isPending ? "…" : openFeedback.length}
          note="Ý kiến giáo viên về bài học"
          icon={<HugeiconsIcon icon={BubbleChatIcon} />}
        />
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Sẵn sàng cho kỳ sau theo khóa</CardTitle>
            <CardDescription>
              Giáo trình kỳ sau của từng khóa: số bài đã soạn và số tuần hiệu
              lực. Số bài cần sẽ có khi khóa học có số buổi/tuần (BE-1).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={units.isPending}
              isError={units.isError}
              error={units.error}
              onRetry={() => void units.refetch()}
              data={readiness}
              emptyProps={{
                title: "Chưa có giáo trình cho kỳ sau",
                description: "Tạo giáo trình kỳ mới từ danh sách giáo trình.",
              }}
            >
              <ul className="space-y-4">
                {readiness.map(({ unit, lessons, weeks }) => {
                  return (
                    <li key={unit.id} className="space-y-1.5 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          href={ROUTES.MANAGER.CURRICULUM_UNIT(unit.id)}
                          className="min-w-0 font-medium hover:text-primary"
                        >
                          {unit.program?.name ?? unit.title} · {unit.title}
                        </Link>
                        <span className="tabular-nums text-muted-foreground">
                          {lessons} bài
                          {weeks ? ` · ${weeks} tuần hiệu lực` : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{STATUS_TEXT[unit.status] ?? unit.status}</Badge>
                        <span>
                          Từ {unit.fromDate.slice(0, 10).split("-").reverse().join("/")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Phản hồi mới nhất</CardTitle>
              <Button
                variant="link"
                size="sm"
                render={
                  <Link href={`${ROUTES.MANAGER.CURRICULUM}?tab=feedback`} />
                }
              >
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={feedback.isPending}
              isError={feedback.isError}
              error={feedback.error}
              onRetry={() => void feedback.refetch()}
              data={feedback.data}
              emptyProps={{ title: "Chưa có phản hồi" }}
            >
              <ul className="divide-y divide-border">
                {[...(feedback.data ?? [])]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 3)
                  .map((item) => (
                    <li key={item.id} className="space-y-1 py-3 first:pt-0">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={
                            OPEN_FEEDBACK.includes(item.status)
                              ? "warning"
                              : "outline"
                          }
                        >
                          {STATUS_TEXT[item.status] ?? item.status}
                        </Badge>
                        <time dateTime={item.createdAt}>
                          {displayMoment(item.createdAt)}
                        </time>
                      </div>
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">
                        {item.content}
                      </p>
                    </li>
                  ))}
              </ul>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
