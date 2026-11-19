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
import { curriculumSetupHref } from "@/features/curriculum/setup-href";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { academicApi } from "@/features/academic/api";
import {
  displayMoment,
  STATUS_TEXT,
} from "@/features/academic/components/live-fields";
import { curriculumApi } from "@/features/curriculum/api";
import { DashboardStatCard } from "./dashboard-stat-card";

const OPEN_FEEDBACK = ["OPEN", "IN_PROGRESS"];

/**
 * Course frequency gives a planning estimate; schedule previews remain authoritative.
 */
export function LiveDesignerDashboard() {
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
  // Bản mới đang chuẩn bị (nháp hoặc chờ duyệt), bản mới nhất của mỗi khóa. Giáo trình không còn
  // kỳ (đợt F): bản được duyệt thay bản cũ ngay cho các lớp tạo lịch sau đó.
  const nextByProgram = new Map<string, (typeof all)[number]>();
  for (const unit of all)
    if (unit.status === "DRAFT" || unit.status === "PENDING_REVIEW") {
      const current = nextByProgram.get(unit.programId);
      if (!current || unit.version > current.version)
        nextByProgram.set(unit.programId, unit);
    }
  const readiness = [...nextByProgram.values()].map((unit) => ({
    unit,
    lessons: unit._count?.lessons ?? 0,
  }));
  const stat = (value: number) => (units.isPending ? "…" : value);

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan giáo trình"
        description="Giáo trình đang soạn, bị trả lại, chờ duyệt và phản hồi từ giáo viên."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href={ROUTES.MANAGER.CURRICULUM_SETUP} />}>
              Soạn khóa học từng bước
            </Button>
            <Button
              variant="outline"
              render={<Link href={ROUTES.MANAGER.CURRICULUM} />}
            >
              Danh sách giáo trình
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Đang soạn"
          value={stat(drafting.length)}
          note="Bản nháp chưa gửi duyệt"
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
          note="Đang chờ giáo viên duyệt nội dung hoặc Quản lý duyệt áp dụng"
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
            <CardTitle>Bản mới đang chuẩn bị theo khóa</CardTitle>
            <CardDescription>
              Số bài đã soạn của bản mới. Khi được duyệt, bản mới dùng cho các lớp
              tạo lịch sau đó; lớp đang học bản cũ học tiếp tới hết bài.
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
                title: "Không có bản mới đang chuẩn bị",
                description: "Làm bản mới từ trang giáo trình của khóa khi cần sửa nội dung.",
              }}
            >
              <ul className="space-y-4">
                {readiness.map(({ unit, lessons }) => {
                  return (
                    <li key={unit.id} className="space-y-1.5 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          href={curriculumSetupHref({ programId: unit.programId, unitId: unit.id })}
                          className="min-w-0 font-medium hover:text-primary"
                        >
                          {unit.program?.name ?? unit.title} · {unit.title}
                        </Link>
                        <span className="tabular-nums text-muted-foreground">
                          {lessons} bài
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{STATUS_TEXT[unit.status] ?? unit.status}</Badge>
                        <span>Bản {unit.version}</span>
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
