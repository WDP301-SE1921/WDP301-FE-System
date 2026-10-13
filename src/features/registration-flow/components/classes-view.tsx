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
import { ROUTES } from "@/constants/routes";
import { useCurrentRole } from "@/hooks/use-current-role";
import { registrationApi } from "../api";
import { money, scheduleText } from "../calendar";
import { ApiFeedback } from "./api-feedback";

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
  const [teacher] = useQueryState("teacher", parseAsString);
  const rows =
    query.data?.filter(
      (item) =>
        `${item.name} ${item.program.subject} ${item.program.grade}`
          .toLocaleLowerCase("vi")
          .includes(search.toLocaleLowerCase("vi")) &&
        (teacher !== "unassigned" || !item.teacherId),
    ) ?? [];
  return (
    <PageContainer>
      <PageHeader
        title="Lớp học và lịch tuần"
        description={
          isStaff
            ? "Chọn lớp để đăng ký học cho học sinh có hồ sơ trên ứng dụng."
            : "Chuẩn bị lớp, học phí, giáo viên và lịch cố định trước khi nhận đăng ký."
        }
        actions={
          role === "center_manager" && (
            <Link
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              href={ROUTES.MANAGER.CLASS_NEW}
            >
              Tạo lớp học
            </Link>
          )
        }
      />
      <Input
        aria-label="Tìm lớp theo tên, môn hoặc khối"
        placeholder="Tìm tên lớp, môn hoặc khối…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ApiFeedback error={query.error} retry={() => void query.refetch()} />
      {query.isPending && <p>Đang tải lớp học…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle>{item.name}</CardTitle>
                <Badge variant={item.isOpen ? "success" : "secondary"}>
                  {item.isActive === false
                    ? "Ngừng hoạt động"
                    : item.isOpen
                      ? "Mở đăng ký"
                      : "Đóng đăng ký"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {item.program.subject} · Khối {item.program.grade} ·{" "}
                {item.program.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {scheduleText(item.weeklySchedules) || "Chưa có lịch tuần"}
              </p>
              <p className="text-sm">
                {money(item.monthlyFee)}/tháng · Sức chứa {item.capacity} học
                sinh
              </p>
              <p className="text-sm">
                Phòng: {item.room?.name ?? "Chưa gán phòng"}
                {item.rosterCount !== undefined &&
                  ` · ${item.rosterCount} học sinh đang học`}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.teacherId ? "Đã gán giáo viên" : "Chưa gán giáo viên"}
              </p>
              <div className="flex flex-wrap gap-2">
                {isStaff ? (
                  <Button
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
                    Thêm học sinh vào lớp
                  </Button>
                ) : (
                  role === "center_manager" && (
                    <Button
                      variant="outline"
                      render={
                        <Link href={ROUTES.MANAGER.CLASS_DETAIL(item.id)} />
                      }
                    >
                      Cấu hình lớp / gán giáo viên
                    </Button>
                  )
                )}
                {(isStaff || role === "center_manager") && (
                  <Button
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
                    Buổi học / giáo trình
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {query.isSuccess && !rows.length && (
        <p className="rounded-2xl border border-border p-6 text-center text-muted-foreground">
          Không có lớp phù hợp.
        </p>
      )}
    </PageContainer>
  );
}
