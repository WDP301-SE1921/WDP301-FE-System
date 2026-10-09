"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { curriculumApi } from "@/features/curriculum/api";
import { registrationApi } from "../api";
export function AcademicProgramDetailView({
  programId,
}: {
  programId: string;
}) {
  const role = useCurrentRole();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("overview"),
  );
  const program = useQuery({
    queryKey: ["academic-program", programId],
    queryFn: ({ signal }) => registrationApi.program(programId, signal),
    retry: false,
  });
  const units = useQuery({
    queryKey: ["curriculum", "units", programId],
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    retry: false,
  });
  return (
    <PageContainer>
      <PageHeader
        title={program.data?.name ?? "Khóa học"}
        backHref={ROUTES.MANAGER.CATALOG}
        description={
          program.data
            ? program.data.subject + " · Khối " + program.data.grade
            : undefined
        }
        actions={
          role === "center_manager" &&
          program.data?.isActive !== false && (
            <Button
              render={
                <Link
                  href={
                    ROUTES.MANAGER.CLASS_NEW +
                    "?programId=" +
                    encodeURIComponent(programId)
                  }
                />
              }
            >
              Tạo lớp từ khóa học
            </Button>
          )
        }
      />
      <Tabs value={tab} onValueChange={(v) => void setTab(String(v))}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="curriculum">Giáo trình</TabsTrigger>
          <TabsTrigger value="classes">Các lớp áp dụng</TabsTrigger>
        </TabsList>
      </Tabs>
      <AsyncBoundary
        isLoading={program.isPending}
        isError={program.isError}
        error={program.error}
        onRetry={() => void program.refetch()}
      >
        {program.data && tab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>{program.data.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {program.data.subject} · Khối {program.data.grade}
              </p>
              <StatusBadge
                category="program"
                status={program.data.isActive === false ? "inactive" : "active"}
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Mỗi học phần thuộc khóa này. Quản lý chọn bản đã duyệt khi sinh
                buổi học cho các lớp áp dụng.
              </p>
            </CardContent>
          </Card>
        )}
        {program.data && tab === "classes" && (
          <div className="grid gap-3 md:grid-cols-2">
            {program.data.classes?.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle>{c.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{c.isOpen ? "Mở đăng ký" : "Đóng đăng ký"}</p>
                  {role === "center_manager" && (
                    <Button
                      variant="outline"
                      render={<Link href={ROUTES.MANAGER.CLASS_DETAIL(c.id)} />}
                    >
                      Xem lớp
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {!program.data.classes?.length && <p>Chưa có lớp áp dụng.</p>}
          </div>
        )}
      </AsyncBoundary>
      {tab === "curriculum" && (
        <>
          <AsyncBoundary
            isLoading={units.isPending}
            isError={units.isError}
            error={units.error}
            onRetry={() => void units.refetch()}
            data={units.data}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {units.data?.map((u) => (
                <Card key={u.id}>
                  <CardHeader>
                    <CardTitle>
                      {u.title} · v{u.version}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <StatusBadge category="curriculum" status={u.status} />
                    <p>
                      {u.fromDate.slice(0, 10)} · {u.toDate.slice(0, 10)}
                    </p>
                    <Button
                      variant="outline"
                      render={
                        <Link href={ROUTES.MANAGER.CURRICULUM_UNIT(u.id)} />
                      }
                    >
                      Xem học phần
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AsyncBoundary>
          {role === "curriculum_designer" && (
            <Button
              render={
                <Link
                  href={
                    ROUTES.MANAGER.CURRICULUM +
                    "?programId=" +
                    encodeURIComponent(programId)
                  }
                />
              }
            >
              Tạo giáo trình từ khóa học
            </Button>
          )}
        </>
      )}
    </PageContainer>
  );
}
