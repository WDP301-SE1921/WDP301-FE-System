"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { registrationApi } from "@/features/registration-flow/api";
import {
  classPeriodText,
  scheduleLines,
} from "@/features/registration-flow/calendar";
import { ROUTES } from "@/constants/routes";

/** Lớp phụ trách của giáo viên, dạng bảng như màn Lớp học của Quản lý. */
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
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lớp</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Lịch tuần</TableHead>
                <TableHead>Thời gian học</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead className="text-right">Sĩ số</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="min-w-36 font-medium wrap-anywhere whitespace-normal">
                    {c.name}
                  </TableCell>
                  <TableCell className="min-w-44 whitespace-normal">
                    {c.program.subject} · Khối {c.program.grade}
                    <span className="block text-xs text-muted-foreground">
                      {c.program.name}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-36">
                    {c.weeklySchedules.length ? (
                      <ul className="space-y-0.5 tabular-nums">
                        {scheduleLines(c.weeklySchedules).map((line) => (
                          <li key={line} className="whitespace-nowrap">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Chưa có lịch tuần"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {classPeriodText(c) ?? "—"}
                  </TableCell>
                  <TableCell>{c.room?.name ?? "Chưa gán phòng"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.rosterCount ?? "—"}/{c.capacity}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href={ROUTES.TEACHER.CLASS_DETAIL(c.id)} />}
                    >
                      Xem lớp
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AsyncBoundary>
    </PageContainer>
  );
}
