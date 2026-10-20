"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
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
import { useCurrentRole, useCurrentUser } from "@/hooks/use-current-role";
import { ROUTES } from "@/constants/routes";
import { useCurriculumUnits } from "../hooks/use-curriculum";
import { UnitForm } from "./unit-form";
import { calendarDateLabel } from "@/lib/calendar-date";
import { curriculumStage } from "../presentation";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  curriculumLabel,
  curriculumEffectiveLabel,
  curriculumNeedsAction,
  curriculumNextStep,
  groupCurricula,
} from "../workspace-selectors";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { useHubTab } from "@/hooks/use-hub-tab";
import { useVietnamDate } from "@/hooks/use-vietnam-date";

/** Trang danh sách giáo trình (Giáo viên thẩm định, admin). */
export function CurriculumUnitsView({ programId }: { programId?: string }) {
  const role = useCurrentRole();
  const [isCreating, setIsCreating] = useState(false);
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
              {isCreating ? "Đóng form" : "Tạo giáo trình"}
            </Button>
          )
        }
      />
      <CurriculumUnitsBody programId={programId} isCreating={isCreating} />
    </PageContainer>
  );
}

/** Tab "Giáo trình" của Thiết kế giáo trình trên màn Khóa học & giáo trình. */
export function CurriculumUnitsTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  const role = useCurrentRole();
  const [isCreating, setIsCreating] = useState(false);
  if (tab !== "curriculum") return null;
  return (
    <div className="min-w-0 space-y-5">
      {role === "curriculum_designer" && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Đóng form" : "Tạo giáo trình"}
          </Button>
        </div>
      )}
      <CurriculumUnitsBody
        isCreating={role === "curriculum_designer" && isCreating}
      />
    </div>
  );
}

export function CurriculumUnitsBody({
  programId: fixedProgramId,
  isCreating = false,
}: {
  programId?: string;
  isCreating?: boolean;
}) {
  const router = useRouter();
  const today = useVietnamDate();
  const role = useCurrentRole();
  const user = useCurrentUser();
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
    parseAsString.withDefault(""),
  );
  const [grade, setGrade] = useQueryState(
    "grade",
    parseAsString.withDefault(""),
  );
  const [subject, setSubject] = useQueryState(
    "subject",
    parseAsString.withDefault(""),
  );
  const [scope, setScope] = useQueryState(
    "curriculumScope",
    parseAsStringLiteral([
      "all",
      "mine",
      "applied",
      "preparing",
      "archived",
    ]).withDefault(role === "teacher" ? "mine" : "all"),
  );
  const units = useCurriculumUnits(programId);
  const needle = search.trim().toLocaleLowerCase("vi");
  const rows = (units.data ?? []).filter(
    (unit) =>
      (!needle ||
        curriculumLabel(unit).toLocaleLowerCase("vi").includes(needle)) &&
      (!subject ||
        unit.track.subject
          .toLocaleLowerCase("vi")
          .includes(subject.toLocaleLowerCase("vi"))) &&
      (!grade || String(unit.track.grade) === grade) &&
      (!status || unit.status === status) &&
      (scope !== "mine" || curriculumNeedsAction(unit, role, user?.id)) &&
      (scope !== "applied" || unit.status === "APPROVED") &&
      (scope !== "preparing" ||
        ["DRAFT", "PENDING_REVIEW"].includes(unit.status)) &&
      (scope !== "archived" || unit.status === "ARCHIVED"),
  );
  const scopes = {
    all: "Tất cả",
    mine: "Cần tôi xử lý",
    applied: "Đã duyệt",
    preparing: "Đang soạn & chờ duyệt",
    archived: "Lưu trữ",
  };
  return (
    <div
      className={cn(
        "grid items-start gap-5",
        isCreating && "xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]",
      )}
    >
      {isCreating && role === "curriculum_designer" && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Giáo trình cho kỳ mới</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitForm
              programId={programId}
              onSaved={(id, source) =>
                router.push(
                  `${ROUTES.MANAGER.CURRICULUM_UNIT(id)}${source === "csv" ? "?editor=import" : ""}`,
                )
              }
            />
          </CardContent>
        </Card>
      )}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="min-w-48 flex-1"
            aria-label="Tìm giáo trình"
            placeholder="Tìm khóa học, tên kỳ…"
            value={search}
            onChange={(event) => void setSearch(event.target.value)}
          />
          <Input
            className="w-40"
            aria-label="Lọc môn học"
            placeholder="Tên môn học"
            value={subject}
            onChange={(event) => void setSubject(event.target.value)}
          />
          <Select
            value={grade || "all"}
            items={{
              all: "Tất cả khối",
              6: "Khối 6",
              7: "Khối 7",
              8: "Khối 8",
              9: "Khối 9",
            }}
            onValueChange={(value) =>
              void setGrade(value === "all" ? null : String(value))
            }
          >
            <SelectTrigger className="w-36" aria-label="Lọc khối">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khối</SelectItem>
              {[6, 7, 8, 9].map((item) => (
                <SelectItem key={item} value={String(item)}>
                  Khối {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status && (
            <Button variant="outline" onClick={() => void setStatus(null)}>
              Bỏ lọc trạng thái
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Phạm vi giáo trình">
          {Object.entries(scopes).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={scope === key ? "secondary" : "ghost"}
              onClick={() => {
                void setScope(key as typeof scope);
                void setStatus(null);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <AsyncBoundary
          isLoading={units.isPending}
          isError={units.isError}
          error={units.error}
          onRetry={() => void units.refetch()}
          data={rows}
          emptyProps={{
            title: "Chưa có giáo trình phù hợp",
            description: "Thử đổi từ khóa hoặc bộ lọc.",
          }}
        >
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giáo trình · kỳ</TableHead>
                  <TableHead>Hiệu lực</TableHead>
                  <TableHead>Số bài</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Bước tiếp theo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              {groupCurricula(rows).map((group) => (
                <TableBody key={group.id}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={6} className="font-semibold">
                      {group.name} · Khối {group.units[0].track.grade}
                    </TableCell>
                  </TableRow>
                  {group.units.map((unit) => (
                    <TableRow
                      key={unit.id}
                      className={
                        curriculumNeedsAction(unit, role, user?.id)
                          ? "bg-primary/5"
                          : undefined
                      }
                    >
                      <TableCell className="max-w-72 whitespace-normal">
                        <p className="font-medium">{curriculumLabel(unit)}</p>
                        <p className="text-xs text-muted-foreground">
                          Phiên bản {unit.version}
                        </p>
                      </TableCell>
                      <TableCell>
                        {calendarDateLabel(unit.fromDate.slice(0, 10))} –{" "}
                        {calendarDateLabel(unit.toDate.slice(0, 10))}
                      </TableCell>
                      <TableCell>{unit._count?.lessons ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge
                          category="curriculum"
                          status={curriculumStage(unit)}
                        />
                        {curriculumEffectiveLabel(unit, today) && <p className="mt-1 text-xs text-muted-foreground">{curriculumEffectiveLabel(unit, today)}</p>}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal text-sm">
                        {curriculumNextStep(unit)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
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
                          {curriculumNeedsAction(unit, role, user?.id)
                            ? role === "teacher"
                              ? "Thẩm định"
                              : "Mở"
                            : "Xem"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ))}
            </Table>
          </div>
        </AsyncBoundary>
        {units.data && (
          <p className="text-xs text-muted-foreground">
            {rows.length} phiên bản · {groupCurricula(rows).length} khóa học ·
            dòng tô màu là việc cần bạn xử lý.
          </p>
        )}
      </div>
    </div>
  );
}
