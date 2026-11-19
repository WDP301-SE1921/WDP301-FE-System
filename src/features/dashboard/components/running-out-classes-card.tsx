"use client";

import Link from "next/link";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { classesRunningOut } from "@/features/registration-flow/program-setup";
import { endFullDate } from "@/features/registration-flow/class-end";
import type { CurriculumUnit } from "@/types/curriculum";
import type { RegistrationClass } from "@/types/backend";
import { Panel } from "./dashboard-ui";

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
  const needSchedule = rows.filter((row) => row.scheduledUntil === null);
  const endingSoon = rows.filter((row) => row.scheduledUntil !== null);
  const unknown =
    !!classes.data &&
    classes.data.length > 0 &&
    classes.data.every((item) => item.scheduledUntil === undefined);
  return (
    // Giải thích nằm trong ⓘ như mọi khối khác của dashboard, không câu mô tả dưới tiêu đề.
    <Panel
      title="Lớp cần tạo lịch học"
      tip="Phần trên: lớp chưa có buổi học nào, kèm nút Tạo lịch học. Phần dưới: lớp sắp học xong giáo trình (buổi cuối cách hôm nay dưới 14 ngày), chỉ để biết; lớp học hết giáo trình thì không tạo thêm lịch. Phụ huynh chỉ thấy buổi học trên ứng dụng sau khi lịch được tạo."
    >
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
              Không có lớp nào cần tạo lịch học hay sắp học xong.
            </p>
          ) : (
            <div className="space-y-4">
              {needSchedule.length > 0 && (
                <ul className="space-y-2">
                  {needSchedule.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="font-medium">{row.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          Chưa có buổi học nào
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
              {endingSoon.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lớp sắp học xong</p>
                  <ul className="space-y-2">
                    {endingSoon.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-xl border border-border px-4 py-3"
                      >
                        <span className="font-medium">{row.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {row.scheduledUntil!.slice(0, 10) < today
                            ? "Đã học xong giáo trình"
                            : row.scheduledUntil!.slice(0, 10) === today
                              ? "Buổi cuối hôm nay"
                              : `Kết thúc ${endFullDate(row.scheduledUntil!)} · còn ${row.daysLeft} ngày`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </AsyncBoundary>
    </Panel>
  );
}
