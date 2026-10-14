"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { PAGINATION_DEFAULTS } from "@/constants/ui";
import { useCurrentRole } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import type { CurriculumUnit } from "@/types/curriculum";
import { useCurriculumUnitPage } from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";
import { calendarDateLabel } from "@/lib/calendar-date";
import { curriculumStage } from "../presentation";
import { cn } from "@/lib/utils";

export function CurriculumUnitsView({
  programId: fixedProgramId,
}: {
  programId?: string;
}) {
  const router = useRouter();
  const role = useCurrentRole();
  const [selectedProgramId] = useQueryState(
    "programId",
    parseAsString.withDefault(""),
  );
  const programId = fixedProgramId ?? (selectedProgramId || undefined);
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(role === "teacher" ? "PENDING_REVIEW" : ""),
  );
  const [grade, setGrade] = useQueryState(
    "grade",
    parseAsString.withDefault(""),
  );
  const [subject, setSubject] = useQueryState(
    "subject",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE),
  );
  const [isCreating, setIsCreating] = useState(false);
  const statuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "ARCHIVED"];
  const filters = {
    programId,
    search,
    subject,
    grade: ["6", "7", "8", "9"].includes(grade) ? Number(grade) : undefined,
    status:
      role === "teacher"
        ? ("PENDING_REVIEW" as const)
        : statuses.includes(status)
          ? (status as CurriculumUnit["status"])
          : undefined,
    page: Math.max(1, page),
    limit: Math.max(1, Math.min(100, pageSize)),
  };
  const units = useCurriculumUnitPage(filters);
  const labels: Record<string, string> =
    role === "teacher"
      ? { PENDING_REVIEW: "Chờ xác nhận giáo trình" }
      : {
          "": "Tất cả trạng thái",
          DRAFT: "Bản nháp",
          PENDING_REVIEW: "Chờ duyệt",
          APPROVED: "Đã duyệt",
          ARCHIVED: "Đã lưu trữ",
        };
  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title={
          role === "teacher"
            ? "Thẩm định giáo trình"
            : role === "center_manager"
              ? "Xác nhận giáo trình"
              : "Thiết kế giáo trình"
        }
        description={
          role === "teacher"
            ? "Đọc và thẩm định nội dung chuyên môn của giáo trình được phân công."
            : "Người thiết kế soạn nội dung, giáo viên thẩm định chuyên môn, quản lý xác nhận áp dụng."
        }
        actions={
          role === "curriculum_designer" && (
            <Button onClick={() => setIsCreating(!isCreating)}>
              {isCreating ? "Đóng form" : "Tạo học phần"}
            </Button>
          )
        }
      />
      <div
        className={cn(
          "grid items-start gap-5",
          isCreating && "xl:grid-cols-[20rem_minmax(0,1fr)]",
        )}
      >
        {isCreating && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Học phần mới</CardTitle>
            </CardHeader>
            <CardContent>
              <UnitForm
                programId={programId}
                onSaved={(id) =>
                  router.push(ROUTES.MANAGER.CURRICULUM_UNIT(id))
                }
              />
            </CardContent>
          </Card>
        )}
        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              aria-label="Tìm học phần"
              placeholder="Tìm theo tên học phần…"
              value={search}
              onChange={(e) => {
                void setSearch(e.target.value);
                void setPage(1);
              }}
            />
            <Select
              value={status || "all"}
              items={Object.entries(labels).map(([value, label]) => ({
                value: value || "all",
                label,
              }))}
              onValueChange={(v) => {
                void setStatus(v === "all" ? null : String(v));
                void setPage(1);
              }}
            >
              <SelectTrigger aria-label="Trạng thái học phần">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(labels).map(([value, label]) => (
                  <SelectItem key={value} value={value || "all"}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              aria-label="Lọc môn học"
              placeholder="Tên môn học"
              value={subject}
              onChange={(e) => {
                void setSubject(e.target.value);
                void setPage(1);
              }}
            />
            <Select
              value={grade || "all"}
              items={[
                { value: "all", label: "Tất cả khối" },
                ...[6, 7, 8, 9].map((g) => ({
                  value: String(g),
                  label: "Khối " + g,
                })),
              ]}
              onValueChange={(v) => {
                void setGrade(v === "all" ? null : String(v));
                void setPage(1);
              }}
            >
              <SelectTrigger aria-label="Khối">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khối</SelectItem>
                {[6, 7, 8, 9].map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Khối {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AsyncBoundary
            isLoading={units.isPending}
            isError={units.isError}
            error={units.error}
            onRetry={() => void units.refetch()}
            data={units.data?.items}
            emptyProps={{ title: "Chưa có học phần phù hợp" }}
          >
            <div
              className={cn(
                "grid gap-3 sm:grid-cols-2",
                !isCreating && "xl:grid-cols-3 2xl:grid-cols-4",
              )}
            >
              {units.data?.items.map((unit) => (
                <Card key={unit.id} className="min-w-0">
                  <CardHeader className="p-4 pb-2">
                    <div className="space-y-2">
                      <CardTitle className="break-words text-base leading-6">
                        {unit.title}
                      </CardTitle>
                      <StatusBadge
                        category="curriculum"
                        status={curriculumStage(unit)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0">
                    <p className="break-words text-sm">
                      {unit.program?.name ?? unit.track.subject} · Khối{" "}
                      {unit.track.grade}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {calendarDateLabel(unit.fromDate.slice(0, 10))} –{" "}
                      {calendarDateLabel(unit.toDate.slice(0, 10))} ·{" "}
                      {unit._count?.lessons ?? 0} nội dung
                    </p>
                    <Button
                      variant="outline"
                      render={
                        <Link
                          href={
                            role === "teacher"
                              ? ROUTES.TEACHER.CURRICULUM_UNIT(unit.id)
                              : ROUTES.MANAGER.CURRICULUM_UNIT(unit.id)
                          }
                        />
                      }
                    >
                      {role === "teacher"
                        ? unit.technicalReviewedAt
                          ? "Xem kết quả thẩm định"
                          : "Đọc và thẩm định"
                        : "Xem giáo trình"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AsyncBoundary>
          {units.data && <TablePagination totalItems={units.data.total} />}
        </div>
      </div>
    </PageContainer>
  );
}
