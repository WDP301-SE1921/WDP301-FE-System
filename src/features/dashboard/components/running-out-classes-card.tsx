"use client";

import Link from "next/link";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { classesRunningOut } from "@/features/registration-flow/program-setup";
import { calendarDateLabel } from "@/lib/calendar-date";
import type { CurriculumUnit } from "@/types/curriculum";
import type { RegistrationClass } from "@/types/backend";

interface QueryState<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
}

/** Thẻ của Quản lý: lớp còn dưới 14 ngày buổi học, kèm nút "Tạo lịch học" (Q4: tạo lịch bấm tay). */
export function RunningOutClassesCard({
  classes,
  units,
  today,
}: {
  classes: QueryState<RegistrationClass[]>;
  units: QueryState<CurriculumUnit[]>;
  today: string;
}) {
  const failed = classes.isError ? classes : units.isError ? units : null;
  const rows =
    classes.data && units.data
      ? classesRunningOut({ classes: classes.data, units: units.data, today })
      : [];
  const unknown =
    !!classes.data &&
    classes.data.length > 0 &&
    classes.data.every((item) => item.scheduledUntil === undefined);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Lớp cần tạo lịch học</CardTitle>
        <CardDescription>
          Lớp chưa có buổi học nào, hoặc buổi cuối cách hôm nay dưới 14 ngày, và
          đã có giáo trình được duyệt. Phụ huynh chỉ thấy buổi học trên ứng dụng
          sau khi lịch được tạo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AsyncBoundary
          isLoading={classes.isPending || units.isPending}
          isError={!!failed}
          error={failed?.error}
          onRetry={() => {
            void classes.refetch();
            void units.refetch();
          }}
        >
          {unknown ? (
            <p className="text-sm text-muted-foreground">
              Chưa biết lịch học của các lớp.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có lớp nào cần tạo lịch học.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {row.scheduledUntil === null
                        ? "Chưa có buổi học nào"
                        : `${
                            row.daysLeft === 0
                              ? "Đã hết buổi học"
                              : `Còn ${row.daysLeft} ngày`
                          } · buổi cuối ${calendarDateLabel(row.scheduledUntil)}`}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    render={
                      <Link
                        href={`${ROUTES.MANAGER.SESSIONS}?programId=${encodeURIComponent(row.programId)}&classIds=${encodeURIComponent(row.id)}&unitId=${encodeURIComponent(row.unitId)}`}
                      />
                    }
                  >
                    Tạo lịch học
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </CardContent>
    </Card>
  );
}
