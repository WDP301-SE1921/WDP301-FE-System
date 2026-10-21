"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { calendarDateLabel } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import { registrationApi } from "@/features/registration-flow/api";
import type { CurriculumUnit } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { curriculumReadiness, type CurriculumReadiness } from "../readiness";

/** Điều kiện gửi thẩm định của một giáo trình nháp: khóa → lớp có giáo viên → số bài. */
export function useCurriculumReadiness(
  unit: CurriculumUnit | undefined,
  enabled: boolean,
): { readiness: CurriculumReadiness | null; isLoading: boolean } {
  const active = enabled && !!unit;
  const program = useQuery({
    queryKey: ["curriculum", "program-readiness", unit?.programId],
    queryFn: ({ signal }) => registrationApi.program(unit!.programId, signal),
    enabled: active,
    retry: false,
  });
  // Cùng khóa với hộp Gửi thẩm định nên mở hộp không gọi lại.
  const reviewers = useQuery({
    queryKey: ["curriculum", "reviewers", unit?.id],
    queryFn: ({ signal }) => curriculumApi.reviewers(unit!.id, signal),
    enabled: active,
    retry: false,
  });
  if (!active || !program.data) return { readiness: null, isLoading: program.isPending && active };
  return {
    readiness: curriculumReadiness({
      program: program.data,
      reviewers: reviewers.data,
      fromDate: unit.fromDate,
      toDate: unit.toDate,
    }),
    isLoading: false,
  };
}

type CheckState = "ok" | "bad" | "warn";
const CHECK_ICON = {
  ok: { icon: Tick02Icon, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  bad: { icon: Cancel01Icon, className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300" },
  warn: { icon: Alert02Icon, className: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
} as const;

export function CurriculumReadinessCards({
  unit,
  readiness,
  lessonCount,
  validated,
  canManageClasses,
}: {
  unit: CurriculumUnit;
  readiness: CurriculumReadiness;
  lessonCount: number;
  validated: boolean;
  canManageClasses: boolean;
}) {
  const shortage = readiness.maxNeeded - lessonCount;
  const range = `${calendarDateLabel(unit.fromDate.slice(0, 10))} – ${calendarDateLabel(unit.toDate.slice(0, 10))}`;
  const reviewerNames = readiness.reviewers
    .map((teacher) => teacher.displayName || teacher.email)
    .join(", ");
  const checks: { state: CheckState; label: string; detail: string }[] = [
    {
      state: "ok",
      label: "Khóa học",
      detail: unit.program?.name ?? `${unit.track.subject} · Khối ${unit.track.grade}`,
    },
    {
      state: readiness.activeClasses ? "ok" : "bad",
      label: "Có lớp thuộc khóa",
      detail: readiness.activeClasses
        ? `${readiness.activeClasses} lớp đang hoạt động`
        : "Chưa có lớp nào dùng khóa này",
    },
    {
      state: readiness.reviewers.length ? "ok" : "bad",
      label: "Có giáo viên thẩm định",
      detail: readiness.reviewers.length
        ? reviewerNames
        : readiness.activeClasses
          ? "Các lớp chưa được phân công giáo viên"
          : "Cần lớp có giáo viên phụ trách",
    },
    {
      state: validated ? "ok" : "warn",
      label: "Cấu trúc giáo trình hợp lệ",
      detail: validated
        ? `${lessonCount} bài học, đã kiểm tra`
        : "Bấm Kiểm tra giáo trình trước khi gửi",
    },
  ];
  if (readiness.needs)
    checks.push({
      state: readiness.needs.length && shortage > 0 ? "warn" : "ok",
      label: "Đủ bài cho mọi lớp",
      detail: !readiness.needs.length
        ? "Chưa tính được: các lớp chưa có lịch tuần"
        : shortage > 0
          ? `Thiếu ${shortage} bài cho lớp ${readiness.needs[0].name} (không chặn gửi)`
          : `${lessonCount} bài đủ cho mọi lớp`,
    });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Điều kiện gửi thẩm định</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y divide-border">
            {checks.map((check) => {
              const icon = CHECK_ICON[check.state];
              return (
                <li key={check.label} className="flex items-start gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full",
                      icon.className,
                    )}
                  >
                    <HugeiconsIcon icon={icon.icon} className="size-3.5" />
                    <span className="sr-only">
                      {check.state === "ok" ? "Đạt" : check.state === "bad" ? "Chưa đạt" : "Cần lưu ý"}
                    </span>
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium">{check.label}</span>
                    <span className="block text-xs break-words text-muted-foreground">
                      {check.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          {readiness.blockedReason && (
            <p className="text-xs text-muted-foreground">
              Thứ tự bắt buộc: <b>Khóa học → Lớp có giáo viên → Gửi thẩm định</b>.
              {canManageClasses ? (
                <>
                  {" "}
                  <Link
                    href={`${ROUTES.MANAGER.CLASS_NEW}?programId=${encodeURIComponent(unit.programId)}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Tạo lớp cho khóa này
                  </Link>
                </>
              ) : (
                " Báo Quản lý tạo lớp cho khóa và phân công giáo viên."
              )}
            </p>
          )}
        </CardContent>
      </Card>

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
                : "Khóa chưa có lớp nên chưa tính được số bài."}
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
                            row.needed > lessonCount && "text-amber-800 dark:text-amber-300",
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
                Hiện có <b>{lessonCount} bài</b>. Lớp nào cần nhiều bài hơn số đang có thì Quản lý
                không sinh được lịch cho lớp đó; lớp học nhanh hơn thì thêm bài ôn tập / dự phòng.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
