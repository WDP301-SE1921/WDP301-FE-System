"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets";
import { ROUTES } from "@/constants/routes";
import { useCurrentRole } from "@/hooks/use-current-role";
import { registrationApi } from "../api";
import { money, scheduleText } from "../calendar";

export function RegistrationClassesView() {
  const router = useRouter();
  const role = useCurrentRole();
  const isStaff = role === "staff";
  const query = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [teacher, setTeacher] = useQueryState("teacher", parseAsString);
  const rows =
    query.data?.filter(
      (item) =>
        `${item.name} ${item.program.subject} ${item.program.grade}`
          .toLocaleLowerCase("vi")
          .includes(search.toLocaleLowerCase("vi")) &&
        (teacher !== "unassigned" || !item.teacherId),
    ) ?? [];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Lớp học và lịch tuần"
        description={
          isStaff
            ? "Chọn lớp để đăng ký học cho học sinh có hồ sơ trên ứng dụng."
            : "Chuẩn bị lớp, học phí, giáo viên và lịch cố định trước khi nhận đăng ký."
        }
        actions={
          role === "center_manager" && (
            <Button render={<Link href={ROUTES.MANAGER.CLASS_NEW} />}>
              Tạo lớp học
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="sm:max-w-md"
          aria-label="Tìm lớp theo tên, môn hoặc khối"
          placeholder="Tìm tên lớp, môn hoặc khối…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {teacher === "unassigned" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void setTeacher(null)}
          >
            Bỏ lọc chưa gán giáo viên
          </Button>
        )}
        {query.data && (
          <span className="text-sm text-muted-foreground sm:ml-auto">
            {rows.length} lớp học
          </span>
        )}
      </div>
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={rows}
        skeleton={<SkeletonCardList count={4} />}
        emptyProps={{
          title: "Chưa có lớp phù hợp",
          description: "Thử đổi từ khóa hoặc bộ lọc giáo viên.",
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((item) => (
            <Card key={item.id} size="sm" className="min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {item.name}
                  </CardTitle>
                  <Badge
                    variant={
                      item.isActive !== false && item.isOpen
                        ? "success"
                        : "secondary"
                    }
                  >
                    {item.isActive === false
                      ? "Ngừng hoạt động"
                      : item.isOpen
                        ? "Mở đăng ký"
                        : "Đóng đăng ký"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {item.program.subject} · Khối {item.program.grade}
                </p>
                <p className="text-sm">{item.program.name}</p>
                <p className="text-sm text-muted-foreground">
                  {scheduleText(item.weeklySchedules) || "Chưa có lịch tuần"}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {money(item.monthlyFee)}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    / tháng
                  </span>
                </p>
                <dl className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Phòng học</dt>
                    <dd className="text-right">
                      {item.room?.name ?? "Chưa gán phòng"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Sĩ số</dt>
                    <dd>
                      {item.rosterCount !== undefined
                        ? `${item.rosterCount} / ${item.capacity}`
                        : `Tối đa ${item.capacity}`}{" "}
                      học sinh
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted-foreground">Giáo viên</dt>
                    <dd className="text-right">
                      {item.teacher?.displayName ||
                        item.teacher?.email ||
                        (item.teacherId ? "Đã phân công" : "Chưa phân công")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto grid gap-2 border-t border-border pt-3">
                  {isStaff ? (
                    <Button
                      size="sm"
                      disabled={
                        item.isActive === false ||
                        !item.isOpen ||
                        !item.weeklySchedules.length
                      }
                      onClick={() =>
                        router.push(
                          ROUTES.STAFF.ENROLLMENT_NEW_FOR({ classId: item.id }),
                        )
                      }
                    >
                      Đăng ký học
                    </Button>
                  ) : (
                    role === "center_manager" && (
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={ROUTES.MANAGER.CLASS_DETAIL(item.id)} />
                        }
                      >
                        Cấu hình lớp
                      </Button>
                    )
                  )}
                  {(isStaff || role === "center_manager") && (
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link
                          href={
                            isStaff
                              ? `${ROUTES.STAFF.SCHEDULE}?${new URLSearchParams({ classId: item.id })}`
                              : ROUTES.MANAGER.CLASS_SESSIONS(item.id)
                          }
                        />
                      }
                    >
                      Xem buổi học
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
