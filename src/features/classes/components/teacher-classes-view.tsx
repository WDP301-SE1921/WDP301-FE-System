"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { registrationApi } from "@/features/registration-flow/api";
import { scheduleText } from "@/features/registration-flow/calendar";
import { ROUTES } from "@/constants/routes";
export function TeacherClassesView() {
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const classes = useQuery({
    queryKey: ["registration-classes", "teacher", search],
    queryFn: () => registrationApi.classes({ search }),
    retry: false,
  });
  return (
    <PageContainer>
      <PageHeader
        title="Lớp phụ trách"
        description="Các lớp được phân công cho tài khoản giáo viên hiện tại."
      />
      <Input
        aria-label="Tìm lớp phụ trách"
        placeholder="Tìm tên lớp…"
        value={search}
        onChange={(e) => void setSearch(e.target.value)}
      />
      <AsyncBoundary
        isLoading={classes.isPending}
        isError={classes.isError}
        error={classes.error}
        onRetry={() => void classes.refetch()}
        data={classes.data}
        emptyProps={{ title: "Chưa có lớp được phân công" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {classes.data?.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  {c.program.name} · {c.program.subject} · Khối{" "}
                  {c.program.grade}
                </p>
                <p className="text-sm text-muted-foreground">
                  {scheduleText(c.weeklySchedules) || "Chưa có lịch tuần"}
                </p>
                <Button
                  variant="outline"
                  render={<Link href={ROUTES.TEACHER.CLASS_DETAIL(c.id)} />}
                >
                  Xem lớp và buổi học
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
