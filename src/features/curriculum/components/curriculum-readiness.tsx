"use client";

import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calendarDateLabel } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import { registrationApi } from "@/features/registration-flow/api";
import type { CurriculumUnit } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { useCenterClosures } from "../hooks/use-center-closures";
import { curriculumReadiness, type CurriculumReadiness } from "../readiness";
import type { SubmitCheck, SubmitCheckState } from "../submit-checklist";

/** Dữ liệu cho danh sách kiểm tra gửi duyệt: khóa học (số buổi cần) và giáo viên duyệt. */
export function useCurriculumReadiness(
  unit: CurriculumUnit | undefined,
  enabled: boolean,
): {
  readiness: CurriculumReadiness | null;
  /** `undefined` khi chưa tải xong hoặc lỗi tải. */
  reviewerCount: number | undefined;
  isLoading: boolean;
} {
  const active = enabled && !!unit;
  const program = useQuery({
    queryKey: ["curriculum", "program-readiness", unit?.programId],
    queryFn: ({ signal }) => registrationApi.program(unit!.programId, signal),
    enabled: active,
    retry: false,
  });
  // Cùng khóa với hộp Gửi duyệt nên mở hộp không gọi lại.
  const reviewers = useQuery({
    queryKey: ["curriculum", "reviewers", unit?.id],
    queryFn: ({ signal }) => curriculumApi.reviewers(unit!.id, signal),
    enabled: active,
    retry: false,
  });
  const { closures } = useCenterClosures(
    unit?.fromDate ?? "",
    unit?.toDate ?? "",
    active,
  );
  const reviewerCount = active ? reviewers.data?.length : undefined;
  if (!active || !program.data)
    return {
      readiness: null,
      reviewerCount,
      isLoading: active && (program.isPending || reviewers.isPending),
    };
  return {
    readiness: curriculumReadiness({
      program: program.data,
      reviewers: reviewers.data,
      fromDate: unit.fromDate,
      toDate: unit.toDate,
      closures,
    }),
    reviewerCount,
    isLoading: false,
  };
}

const CHECK_ICON: Record<
  SubmitCheckState,
  { icon: typeof Tick02Icon; className: string; word: string }
> = {
  ok: {
    icon: Tick02Icon,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    word: "Đạt",
  },
  block: {
    icon: Cancel01Icon,
    className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    word: "Cần làm",
  },
  warn: {
    icon: Alert02Icon,
    className:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    word: "Lưu ý",
  },
  unknown: {
    icon: Alert02Icon,
    className: "bg-muted text-muted-foreground",
    word: "Chưa rõ",
  },
};

export function CurriculumReadinessCards({
  unit,
  readiness,
  lessonCount,
  checks,
  onRenumber,
  renumbering,
}: {
  unit: CurriculumUnit;
  readiness: CurriculumReadiness | null;
  lessonCount: number;
  /** Kết quả `submitChecklist`, tính ở trang để nút Gửi duyệt dùng cùng một kết quả. */
  checks: SubmitCheck[];
  onRenumber?: () => void;
  renumbering?: boolean;
}) {
  const shortage = readiness ? readiness.maxNeeded - lessonCount : 0;
  const range = `${calendarDateLabel(unit.fromDate.slice(0, 10))} – ${calendarDateLabel(unit.toDate.slice(0, 10))}`;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Kiểm tra trước khi gửi duyệt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y divide-border">
            {checks.map((check) => {
              const icon = CHECK_ICON[check.state];
              return (
                <li key={check.key} className="flex items-start gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      icon.className,
                    )}
                  >
                    <HugeiconsIcon icon={icon.icon} className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {check.label}
                      {check.state !== "ok" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            icon.className,
                          )}
                        >
                          {icon.word}
                        </span>
                      )}
                      {check.state === "ok" && (
                        <span className="sr-only">{icon.word}</span>
                      )}
                    </span>
                    {check.detail && (
                      <span className="block text-xs break-words text-muted-foreground">
                        {check.detail}
                      </span>
                    )}
                    {check.fix === "renumber" && onRenumber && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        isLoading={renumbering}
                        disabled={renumbering}
                        onClick={onRenumber}
                      >
                        Đánh số lại
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {readiness && (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Số bài cần cho kỳ này</CardTitle>
            {readiness.needs?.length ? (
              <Badge variant={shortage > 0 ? "warning" : "success"}>
                {shortage > 0 ? `Thiếu ${shortage} bài` : "Đủ bài"}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Chuẩn khóa:{" "}
              {readiness.sessionsPerWeek == null
                ? "chưa cấu hình"
                : `${readiness.sessionsPerWeek} buổi/tuần`}
              .
              {readiness.plannedNeed !== null &&
                ` Dự kiến ${readiness.plannedNeed} bài theo số tuần làm tròn; số thực tế từng lớp ở dưới.`}
            </p>
            <p className="text-sm text-muted-foreground">
              Mỗi buổi một bài, tính theo lịch tuần của từng lớp trong {range}.
            </p>
            {readiness.needs === null ? (
              <p className="text-sm text-muted-foreground">
                Máy chủ chưa trả lịch tuần của lớp nên chưa tính được số bài.
              </p>
            ) : !readiness.needs.length ? (
              <p className="text-sm text-muted-foreground">
                {readiness.activeClasses
                  ? "Các lớp của khóa chưa có lịch tuần nên chưa tính được số bài."
                  : "Khóa chưa có lớp nên chưa tính được số bài. Vẫn gửi duyệt được."}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lớp</TableHead>
                        <TableHead className="text-right">Buổi/tuần</TableHead>
                        <TableHead className="text-right">Cần</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readiness.needs.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.perWeek}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium tabular-nums",
                              row.needed > lessonCount &&
                                "text-amber-800 dark:text-amber-300",
                            )}
                          >
                            {row.needed}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hiện có <b>{lessonCount} bài</b>. Lớp nào cần nhiều bài hơn số
                  đang có thì Quản lý không tạo được lịch học cho lớp đó; lớp
                  học nhanh hơn thì thêm bài ôn tập / dự phòng.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Số buổi cần nhiều nhất: theo lịch từng lớp, không có thì theo chuẩn của khóa. */
export function neededLessons(
  readiness: CurriculumReadiness | null,
): number | null {
  if (!readiness) return null;
  if (readiness.needs?.length) return readiness.maxNeeded;
  return readiness.plannedNeed;
}
