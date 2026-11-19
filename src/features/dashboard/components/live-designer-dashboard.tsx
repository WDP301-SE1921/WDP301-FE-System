"use client";

/*
 * Dashboard Thiết kế giáo trình theo canvas 19/11/2026
 * (https://claude.ai/artifact/NhgX52h1rRKmzPp2jjJbDX). Câu hỏi của màn: hôm nay tôi phải soạn/sửa gì,
 * và việc nào đang chờ người khác? Khác canvas có chủ ý:
 * - Không có mốc "số bài cần" (/16): giáo trình đã bỏ kỳ nên không có số buổi cần đáng tin; chỉ hiện số bài thật.
 * - Phản hồi không ghi tên giáo viên: BE chỉ trả teacherId và Thiết kế GT không đọc được danh sách giáo viên.
 */

import Link from "next/link";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/hooks/use-current-role";
import { cn } from "@/lib/utils";
import { academicApi } from "@/features/academic/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { curriculumApi } from "@/features/curriculum/api";
import { curriculumKeys } from "@/features/curriculum/hooks/use-curriculum";
import { curriculumSetupHref } from "@/features/curriculum/setup-href";
import { outcomeApi } from "@/features/outcomes/api";
import { registrationApi } from "@/features/registration-flow/api";
import type { CurriculumLesson } from "@/types/curriculum";
import type { ContentOutcomeSet } from "@/features/curriculum/content-setup";
import {
  ageText,
  FEEDBACK_WARN_DAYS,
  WAIT_WARN_DAYS,
  designerKpis,
  designerRows,
  inProgressUnits,
  openFeedbackRows,
  programNames,
  type CourseRow,
  type FeedbackRow,
} from "../designer-metrics";
import { KpiCard, KpiRow, Panel, PanelError } from "./dashboard-ui";

const VIEWS = ["all", "me", "others"] as const;
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = {
  me: "Cần bạn làm",
  others: "Chờ người khác",
  all: "Tất cả",
};

const STATUS_BADGE: Record<
  CourseRow["status"],
  { label: string; variant: "warning" | "info" | "neutral" }
> = {
  returned: { label: "Bị trả lại", variant: "warning" },
  draft: { label: "Đang soạn", variant: "info" },
  pending: { label: "Chờ duyệt", variant: "neutral" },
  none: { label: "Chưa có giáo trình", variant: "neutral" },
};

const STEP_TONE = {
  done: "bg-primary",
  active: "bg-primary/40",
  warn: "bg-amber-500",
  todo: "bg-muted",
} as const;

const FEEDBACK_BADGE: Record<string, { label: string; variant: "info" | "neutral" }> = {
  OPEN: { label: "Mới", variant: "info" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "neutral" },
};

/** dd/MM theo giờ Việt Nam, như các dashboard khác. */
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

const shortList = (items: string[], max = 2) =>
  items.length > max
    ? `${items.slice(0, max).join(" · ")} +${items.length - max}`
    : items.join(" · ");

function rowAction(row: CourseRow) {
  if (row.status === "returned") return { label: "Sửa theo nhận xét", primary: true };
  if (row.group === "others") return { label: "Xem", primary: false };
  if (row.status === "none")
    return {
      label: row.stepKey === "outcomes" ? "Tạo mục tiêu" : "Bắt đầu soạn",
      primary: false,
    };
  const byStep: Partial<Record<CourseRow["stepKey"], string>> = {
    outcomes: "Tạo mục tiêu",
    lessons: "Soạn tiếp",
    mapping: "Gắn mục tiêu",
    submit: "Gửi duyệt",
  };
  return { label: byStep[row.stepKey] ?? "Mở", primary: false };
}

export function LiveDesignerDashboard() {
  const user = useCurrentUser();
  const [now] = useState(() => Date.now());
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEWS).withDefault("all"),
  );

  const units = useLiveQuery(["designer-dashboard-units"], (signal) =>
    curriculumApi.units(undefined, signal),
  );
  const programs = useLiveQuery(["designer-dashboard-programs"], (signal) =>
    registrationApi.programsFiltered({}, signal),
  );
  const feedback = useLiveQuery(["designer-dashboard-feedback"], async (signal) => {
    const [items, lessons] = await Promise.all([
      academicApi.feedback(signal),
      academicApi.lessons(signal),
    ]);
    return { items, lessons };
  });

  const working = inProgressUnits(units.data ?? []);
  // Bộ mục tiêu: khóa có bản đang làm và khóa đang mở chưa có giáo trình nào.
  const programIds = [
    ...new Set([
      ...working.map((unit) => unit.programId),
      ...(programs.data ?? [])
        .filter(
          (program) =>
            program.isActive !== false &&
            !(units.data ?? []).some(
              (unit) =>
                unit.programId === program.id && unit.status !== "ARCHIVED",
            ),
        )
        .map((program) => program.id),
    ]),
  ];
  const details = useQueries({
    queries: working.map((unit) => ({
      queryKey: curriculumKeys.unit(unit.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        curriculumApi.unit(unit.id, signal),
      retry: false,
    })),
  });
  const sets = useQueries({
    queries: programIds.map((programId) => ({
      // Cùng khóa với trang soạn từng bước để thêm mục tiêu xong hai nơi cùng cập nhật.
      queryKey: ["web-api", user?.id, "outcome-sets", programId, "all"],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        outcomeApi.sets(programId, signal),
      enabled: !!user && !!units.data && !!programs.data,
      retry: false,
    })),
  });

  const tableLoading =
    units.isPending ||
    programs.isPending ||
    details.some((query) => query.isPending) ||
    sets.some((query) => query.isPending);
  const tableError =
    units.isError ||
    programs.isError ||
    details.some((query) => query.isError) ||
    sets.some((query) => query.isError);
  const retryTable = () => {
    void units.refetch();
    void programs.refetch();
    details.forEach((query) => void query.refetch());
    sets.forEach((query) => void query.refetch());
  };

  const lessonsByUnit = new Map<string, CurriculumLesson[]>();
  details.forEach((query, i) => {
    if (query.data) lessonsByUnit.set(working[i].id, query.data.lessons);
  });
  const setsByProgram = new Map<string, ContentOutcomeSet[]>();
  sets.forEach((query, i) => {
    if (query.data) setsByProgram.set(programIds[i], query.data);
  });

  const ready = !tableLoading && !tableError;
  const { rows, stableCourses } = ready
    ? designerRows({
        programs: programs.data ?? [],
        units: units.data ?? [],
        lessonsByUnit,
        setsByProgram,
        now,
      })
    : { rows: [] as CourseRow[], stableCourses: 0 };
  const kpis = designerKpis(rows, feedback.data?.items ?? [], now);
  const names = programNames(programs.data ?? [], units.data ?? []);
  const feedbackRows = openFeedbackRows(
    feedback.data?.items ?? [],
    feedback.data?.lessons ?? [],
    names,
    now,
  );

  const counts = {
    all: rows.length,
    me: rows.filter((row) => row.group === "me").length,
    others: rows.filter((row) => row.group === "others").length,
  };
  const shown = view === "all" ? rows : rows.filter((row) => row.group === view);

  const pendingParts = [
    kpis.pending.atTeacher ? `GV ${kpis.pending.atTeacher}` : null,
    kpis.pending.atManager ? `QL ${kpis.pending.atManager}` : null,
    kpis.pending.atDesigner ? `chờ bạn ${kpis.pending.atDesigner}` : null,
    kpis.pending.oldestDays !== null
      ? `lâu nhất ${ageText(kpis.pending.oldestDays)}`
      : null,
  ].filter(Boolean);
  const feedbackParts = [
    kpis.feedback.fresh ? `Mới ${kpis.feedback.fresh}` : null,
    kpis.feedback.inProgress ? `Đang xử lý ${kpis.feedback.inProgress}` : null,
    kpis.feedback.oldestDays !== null
      ? `cũ nhất ${ageText(kpis.feedback.oldestDays)}`
      : null,
  ].filter(Boolean);

  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Tổng quan giáo trình"
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

      <KpiRow>
        <KpiCard
          label="Bị trả lại"
          tip="Giáo trình giáo viên hoặc Quản lý trả lại; sửa theo nhận xét rồi gửi duyệt lại."
          value={kpis.returned.count}
          sub={
            kpis.returned.count
              ? `${shortList(kpis.returned.courses)}${kpis.returned.oldestDays !== null ? ` · ${ageText(kpis.returned.oldestDays)}` : ""}`
              : "Không có"
          }
          warn={kpis.returned.count > 0}
          isLoading={tableLoading}
          isError={tableError}
          onRetry={retryTable}
        />
        <KpiCard
          label="Đang soạn"
          tip="Bản nháp chưa gửi duyệt (không tính bản bị trả lại)."
          value={kpis.drafting.count}
          sub={kpis.drafting.count ? shortList(kpis.drafting.courses) : "Không có"}
          isLoading={tableLoading}
          isError={tableError}
          onRetry={retryTable}
        />
        <KpiCard
          label="Chờ duyệt"
          tip={`Đã gửi duyệt: giáo viên duyệt nội dung (GV) rồi Quản lý duyệt áp dụng (QL). Chờ quá ${WAIT_WARN_DAYS} ngày thì tô cam.`}
          value={kpis.pending.count}
          sub={pendingParts.length ? pendingParts.join(" · ") : "Không có"}
          warn={kpis.pending.oldestWarn}
          isLoading={tableLoading}
          isError={tableError}
          onRetry={retryTable}
        />
        <KpiCard
          label="Phản hồi mở"
          tip={`Ý kiến của giáo viên về bài học, đang ở trạng thái Mới hoặc Đang xử lý. Quá ${FEEDBACK_WARN_DAYS} ngày thì tô cam.`}
          value={kpis.feedback.count}
          sub={feedbackParts.length ? feedbackParts.join(" · ") : "Không có"}
          warn={kpis.feedback.oldestWarn}
          isLoading={feedback.isPending}
          isError={feedback.isError}
          onRetry={() => void feedback.refetch()}
        />
      </KpiRow>

      <div className="flex flex-wrap items-start gap-6">
        <Panel
          title="Tiến độ theo khóa"
          tip="Mỗi bản giáo trình đang soạn hoặc chờ duyệt, cùng các khóa đang mở chưa có giáo trình. Thanh 6 bước giống trang soạn từng bước."
          // Bảng cần ~60rem cho đủ 6 cột; màn hẹp hơn thì khung phản hồi xuống hàng dưới.
          className="min-w-0 flex-[999_1_60rem]"
          actions={
            <Tabs
              value={view}
              onValueChange={(value) => {
                const next = VIEWS.find((key) => key === value);
                if (next) void setView(next === "all" ? null : next);
              }}
            >
              <TabsList aria-label="Lọc khóa" className="w-full sm:w-auto">
                {(["me", "others", "all"] as const).map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex-1 px-2 text-xs sm:flex-none sm:px-3 sm:text-sm"
                  >
                    {VIEW_LABEL[key]}
                    <span className="ml-1.5 tabular-nums text-muted-foreground">
                      {ready ? counts[key] : "…"}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        >
          {tableError ? (
            <PanelError onRetry={retryTable} />
          ) : tableLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <CourseTable rows={shown} view={view} stableCourses={stableCourses} />
          )}
        </Panel>

        <Panel
          title="Phản hồi giáo viên"
          className="min-w-0 flex-[1_1_22rem]"
          actions={
            <Button
              variant="link"
              size="sm"
              render={<Link href={`${ROUTES.MANAGER.CURRICULUM}?tab=feedback`} />}
            >
              Xem tất cả
            </Button>
          }
        >
          {feedback.isError ? (
            <PanelError onRetry={() => void feedback.refetch()} />
          ) : feedback.isPending ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : feedbackRows.length ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3">
              {feedbackRows.map((row) => (
                <FeedbackItem key={row.id} row={row} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Không có phản hồi đang mở
            </p>
          )}
        </Panel>
      </div>
    </PageContainer>
  );
}

function CourseTable({
  rows,
  view,
  stableCourses,
}: {
  rows: CourseRow[];
  view: (typeof VIEWS)[number];
  stableCourses: number;
}) {
  return (
    <>
      {rows.length ? (
        <div className="overflow-x-auto">
          <Table className="min-w-200 [&_td]:px-3 [&_th]:px-3">
            <TableHeader>
              <TableRow>
                <TableHead>Khóa</TableHead>
                <TableHead>Bước</TableHead>
                <TableHead className="text-right">Bài học</TableHead>
                <TableHead className="text-right">Chưa gắn MT</TableHead>
                <TableHead>Đang chờ</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <CourseRowView key={row.key} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {view === "me"
            ? "Không có giáo trình nào cần bạn làm"
            : view === "others"
              ? "Không có bản nào đang chờ duyệt"
              : "Không có giáo trình đang soạn hoặc chờ duyệt"}
        </p>
      )}
      {stableCourses > 0 && (
        <Link
          href={ROUTES.MANAGER.CURRICULUM}
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>
            <span className="tabular-nums">{stableCourses}</span> khóa đang áp dụng, không có bản mới
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </>
  );
}

function CourseRowView({ row }: { row: CourseRow }) {
  const badge = STATUS_BADGE[row.status];
  const action = rowAction(row);
  const href = curriculumSetupHref({
    programId: row.programId,
    unitId: row.unitId,
    step: row.stepKey,
  });
  const returned = row.status === "returned";
  return (
    <>
      <TableRow className={cn(returned && "border-b-0 bg-amber-50/60 dark:bg-amber-950/20")}>
        <TableCell>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.course}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {row.version !== null && <span>Bản {row.version}</span>}
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-0.5" aria-hidden="true">
              {row.steps.map((step) => (
                <span
                  key={step.key}
                  title={step.title}
                  className={cn("h-1.5 w-5 rounded-full", STEP_TONE[step.tone])}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="tabular-nums">{row.stepIndex}/6</span> · {row.stepTitle}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {row.lessons === null ? "—" : row.lessons}
        </TableCell>
        <TableCell
          className={cn(
            "text-right tabular-nums",
            row.unmappedWarn && "font-semibold text-amber-700 dark:text-amber-400",
          )}
        >
          {row.unmapped === null ? "—" : row.unmapped}
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                "max-w-48 truncate",
                row.waitingFor === "Bạn" && "font-medium text-primary",
              )}
            >
              {row.waitingFor}
            </span>
            {row.ageLabel && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  row.ageWarn
                    ? "font-medium text-amber-700 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              >
                {row.ageLabel}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="sm"
            variant={action.primary ? "default" : "outline"}
            render={<Link href={href} />}
          >
            {action.label}
          </Button>
        </TableCell>
      </TableRow>
      {returned && row.note && (
        <TableRow className="bg-amber-50/60 hover:bg-amber-50/60 dark:bg-amber-950/20">
          <TableCell colSpan={6} className="pt-0">
            <div className="space-y-1 rounded-xl bg-amber-100/70 px-3 py-2.5 text-sm dark:bg-amber-950/50">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {row.note.by}
                {row.note.at && (
                  <> · {DAY_MONTH.format(new Date(row.note.at))}</>
                )}
              </p>
              <p className="line-clamp-2 whitespace-pre-wrap break-words text-amber-950 dark:text-amber-100">
                {row.note.text}
              </p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function FeedbackItem({ row }: { row: FeedbackRow }) {
  const badge = FEEDBACK_BADGE[row.status] ?? { label: row.status, variant: "neutral" as const };
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {row.ageDays !== null && (
          <span
            className={cn(
              "text-xs tabular-nums",
              row.ageWarn
                ? "font-medium text-amber-700 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {ageText(row.ageDays)}
          </span>
        )}
      </div>
      <p className="text-sm font-medium">
        {row.course ? `${row.course} › ` : ""}
        {row.lesson}
      </p>
      <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
        {row.text}
      </p>
      <div>
        <Button
          size="sm"
          variant="outline"
          render={
            <Link
              href={`${ROUTES.MANAGER.CURRICULUM}?${new URLSearchParams({ tab: "feedback", feedback: row.id })}`}
            />
          }
        >
          Xử lý
        </Button>
      </div>
    </li>
  );
}
