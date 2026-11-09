"use client";
import { Fragment, useId, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import { RowActions } from "@/components/shared/data-table/row-actions";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import { Badge } from "@/components/ui/badge";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { ROUTES } from "@/constants/routes";
import { academicApi } from "@/features/academic/api";
import { useCurrentUser } from "@/hooks/use-current-role";
import { curriculumApi } from "@/features/curriculum/api";
import { curriculumStage } from "@/features/curriculum/presentation";
import { useHubTab } from "@/hooks/use-hub-tab";
import { apiRequest } from "@/lib/api/client";
import { calendarDateLabel } from "@/lib/calendar-date";
import {
  academicSubjectSchema,
  academicProgramSchema,
  type AcademicSubjectInput,
  type AcademicProgramInput,
} from "@/lib/validators/academic-catalog";
import type { AcademicSubject, RegistrationProgram } from "@/types/backend";
import { curriculumEffectiveLabel } from "@/features/curriculum/workspace-selectors";
import { useVietnamDate } from "@/hooks/use-vietnam-date";
import type { CurriculumUnit } from "@/types/curriculum";
import { registrationApi } from "../api";
import {
  PROGRAM_GRADES,
  SESSIONS_PER_WEEK,
  findSameSubjectGradeProgram,
  isSubjectCodeTaken,
  pickChangedFields,
  safeManagerReturnPath,
  suggestProgramName,
  suggestSubjectCode,
  withFinalPeriod,
} from "../program-form";
import { NumberStepper } from "./number-stepper";

const PROGRAMS_PAGE_SIZE = 10;
const PROGRAM_FILTERS = {
  all: "Tất cả khóa",
  review: "Có giáo trình chờ duyệt áp dụng",
  outcomeReview: "Có mục tiêu chờ duyệt",
} as const;
/** BE chưa có route liệt kê bộ mục tiêu theo trạng thái cho mọi khóa (B9), nên kiểm từng khóa; giới hạn số khóa. */
const OUTCOME_CHECK_LIMIT = 30;
const PROGRAM_FILTER_KEYS = Object.keys(
  PROGRAM_FILTERS,
) as (keyof typeof PROGRAM_FILTERS)[];

function useCatalogRefresh() {
  const client = useQueryClient();
  return () => {
    for (const key of [
      ["academic-subjects"],
      ["registration-programs"],
      ["academic-program"],
      ["registration-classes"],
      ["registration-class"],
      ["curriculum"],
      ["web-api"],
    ])
      void client.invalidateQueries({ queryKey: key });
  };
}

/** Thân tab "Khóa học & giáo trình" của Quản lý; chỉ hiện khi tab đó đang mở. */
export function ProgramsCatalogTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  return tab === "programs" ? <ProgramsCatalog /> : null;
}

/** Thân tab "Danh mục môn" của Quản lý; chỉ hiện khi tab đó đang mở. */
export function SubjectsCatalogTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  return tab === "subjects" ? <SubjectsCatalog /> : null;
}

/**
 * Nút "Tạo khóa học" mở hộp thoại; bảng nhóm theo khóa, dưới mỗi khóa là các giáo trình theo kỳ.
 * Quản lý chỉ xem / duyệt áp dụng giáo trình ở trang chi tiết, không có nút tạo giáo trình.
 */
function ProgramsCatalog() {
  const today = useVietnamDate();
  const router = useRouter();
  const refresh = useCatalogRefresh();
  const [{ search, catalogPage, programFilter }, setFilters] = useQueryStates({
    search: parseAsString.withDefault(""),
    catalogPage: parseAsInteger.withDefault(1),
    programFilter: parseAsStringLiteral(PROGRAM_FILTER_KEYS).withDefault("all"),
  });
  const [, setProgram] = useQueryState("program", parseAsString);
  // Hộp sửa khóa đi theo URL để trang lớp dẫn thẳng tới đây khi khóa thiếu số buổi/tuần.
  const [{ editProgram: editProgramId, returnTo }, setEditView] =
    useQueryStates({ editProgram: parseAsString, returnTo: parseAsString });
  const closeEdit = () =>
    void setEditView({ editProgram: null, returnTo: null });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<RegistrationProgram | null>(null);
  const programs = useQuery({
    queryKey: ["registration-programs", { search }],
    queryFn: ({ signal }) =>
      registrationApi.programsFiltered(
        search.trim() ? { search: search.trim() } : {},
        signal,
      ),
    retry: false,
  });
  // Một lần đọc toàn bộ giáo trình và lớp rồi nhóm theo khóa, không gọi riêng từng dòng.
  const units = useQuery({
    queryKey: ["curriculum", "units", "catalog"],
    queryFn: ({ signal }) => curriculumApi.units(undefined, signal),
    retry: false,
  });
  const classes = useQuery({
    queryKey: ["registration-classes", "catalog"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });
  // Chỉ gọi khi bộ lọc "Có mục tiêu chờ duyệt" đang bật: mỗi khóa một request.
  const currentUser = useCurrentUser();
  const outcomeCheckOn = programFilter === "outcomeReview";
  const checkedPrograms = (programs.data ?? []).slice(0, OUTCOME_CHECK_LIMIT);
  const outcomeChecks = useQueries({
    queries: checkedPrograms.map((program) => ({
      // Cùng tiền tố `useLiveQuery`: duyệt hoặc trả bộ mục tiêu (invalidate ["web-api", userId]) làm mới luôn bộ lọc này.
      queryKey: ["web-api", currentUser?.id, "outcome-sets-pending", program.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        academicApi.outcomeSets(program.id, { status: "TECHNICALLY_APPROVED" }, signal),
      enabled: outcomeCheckOn,
      retry: false,
    })),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest<unknown>(`programs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    retry: false,
    onSuccess: refresh,
  });
  const listedEditing = programs.data?.find(
    (program) => program.id === editProgramId,
  );
  // Khóa không có trong danh sách đang lọc (mở từ link) thì đọc riêng.
  const editDetail = useQuery({
    queryKey: ["academic-program", editProgramId],
    queryFn: ({ signal }) => registrationApi.program(editProgramId!, signal),
    enabled: !!editProgramId && !programs.isPending && !listedEditing,
    retry: false,
  });
  const editing = editProgramId
    ? (listedEditing ?? editDetail.data ?? null)
    : null;
  const onCreated = (created: RegistrationProgram) => {
    refresh();
    setCreating(false);
    toast.success(withFinalPeriod(`Đã tạo khóa ${created.name}`), {
      duration: 10_000,
      action: {
        label: "Tạo lớp cho khóa này",
        onClick: () =>
          router.push(
            `${ROUTES.MANAGER.CLASS_NEW}?programId=${encodeURIComponent(created.id)}`,
          ),
      },
    });
  };
  const onEdited = () => {
    // Đọc trước khi đóng hộp: đóng hộp xóa cả `returnTo` khỏi URL.
    const backPath = safeManagerReturnPath(returnTo);
    refresh();
    closeEdit();
    toast.success(
      "Đã lưu thay đổi.",
      backPath
        ? {
            duration: 10_000,
            action: {
              label: "Quay lại lớp",
              onClick: () => router.push(backPath),
            },
          }
        : undefined,
    );
  };
  const unitsByProgram = new Map<string, CurriculumUnit[]>();
  for (const unit of [...(units.data ?? [])].sort((left, right) =>
    left.fromDate.localeCompare(right.fromDate),
  ))
    unitsByProgram.set(unit.programId, [
      ...(unitsByProgram.get(unit.programId) ?? []),
      unit,
    ]);
  const classNames = new Map<string, string[]>();
  // Lớp chưa có giáo viên: giáo trình của khóa chưa có người thẩm định.
  const classesWithoutTeacher = new Map<string, number>();
  for (const classroom of classes.data ?? [])
    if (classroom.isActive !== false) {
      classNames.set(classroom.programId, [
        ...(classNames.get(classroom.programId) ?? []),
        classroom.name,
      ]);
      if (!classroom.teacherId)
        classesWithoutTeacher.set(
          classroom.programId,
          (classesWithoutTeacher.get(classroom.programId) ?? 0) + 1,
        );
    }
  const outcomePendingIds = new Set<string>();
  let outcomeChecking = 0;
  let outcomeFailed = 0;
  checkedPrograms.forEach((program, index) => {
    const check = outcomeChecks[index];
    if (!check || !outcomeCheckOn) return;
    if (check.isPending) outcomeChecking++;
    else if (check.isError) outcomeFailed++;
    else if (check.data?.some((set) => set.status === "TECHNICALLY_APPROVED"))
      outcomePendingIds.add(program.id);
  });
  const outcomeUnchecked = outcomeCheckOn
    ? Math.max(0, (programs.data?.length ?? 0) - OUTCOME_CHECK_LIMIT)
    : 0;
  const rows = (programs.data ?? []).filter((program) =>
    programFilter === "all"
      ? true
      : programFilter === "outcomeReview"
        ? outcomePendingIds.has(program.id)
        : (unitsByProgram.get(program.id) ?? []).some(
            (unit) => curriculumStage(unit) === "PENDING_MANAGER_CONFIRMATION",
          ),
  );
  const start = (Math.max(1, catalogPage) - 1) * PROGRAMS_PAGE_SIZE;
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Sau khi tạo khóa: tạo lớp và phân công giáo viên để giáo viên duyệt
          nội dung giáo trình. Quản lý duyệt áp dụng rồi tạo lịch học cho các
          lớp.
        </p>
        <Button onClick={() => setCreating(true)}>Tạo khóa học</Button>
      </div>
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4">
          <FilterBar
            searchPlaceholder="Tìm khóa học…"
            onSearchChange={() => void setFilters({ catalogPage: null })}
            onClearFilters={() =>
              void setFilters({ programFilter: null, catalogPage: null })
            }
          >
            <Select
              items={PROGRAM_FILTERS}
              value={programFilter}
              onValueChange={(value) =>
                void setFilters({
                  programFilter:
                    PROGRAM_FILTER_KEYS.find((key) => key === value) ?? null,
                  catalogPage: null,
                })
              }
            >
              <SelectTrigger
                className="w-56 rounded-xl"
                aria-label="Lọc khóa học"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_FILTER_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {PROGRAM_FILTERS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
          {outcomeCheckOn && (
            <div role="status" className="space-y-1 text-sm text-muted-foreground">
              {outcomeChecking > 0 && (
                <p>
                  Đang kiểm tra mục tiêu của {outcomeChecking}/{checkedPrograms.length} khóa…
                </p>
              )}
              {outcomeFailed > 0 && (
                <p className="text-destructive">
                  Không kiểm tra được {outcomeFailed} khóa. Danh sách dưới đây có thể thiếu.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      outcomeChecks.forEach((check) => {
                        if (check.isError) void check.refetch();
                      })
                    }
                  >
                    Thử lại
                  </button>
                </p>
              )}
              {outcomeUnchecked > 0 && (
                <p>
                  Mới kiểm {OUTCOME_CHECK_LIMIT}/{programs.data?.length} khóa. Khóa còn lại chưa
                  được kiểm; dùng ô tìm kiếm để thu hẹp danh sách.
                </p>
              )}
            </div>
          )}
          <ApiFeedback error={remove.error} />
          <ApiFeedback
            error={classes.error}
            retry={() => void classes.refetch()}
          />
          <AsyncBoundary
            isLoading={programs.isPending}
            isError={programs.isError || units.isError}
            error={programs.error ?? units.error}
            onRetry={() => {
              void programs.refetch();
              void units.refetch();
            }}
            data={rows}
            emptyProps={{
              title: "Chưa có khóa học phù hợp",
              description:
                "Thử đổi từ khóa hoặc bộ lọc, hoặc tạo khóa học mới.",
            }}
          >
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khóa học / giáo trình</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                    <TableHead className="text-right">Bài</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="sticky right-0 bg-muted text-right">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows
                    .slice(start, start + PROGRAMS_PAGE_SIZE)
                    .map((program) => {
                      const programUnits = unitsByProgram.get(program.id) ?? [];
                      const programClasses = classNames.get(program.id) ?? [];
                      const withoutTeacher =
                        classesWithoutTeacher.get(program.id) ?? 0;
                      return (
                        <Fragment key={program.id}>
                          <TableRow className="bg-muted hover:bg-muted">
                            <TableCell
                              colSpan={4}
                              className="whitespace-normal"
                            >
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <Button
                                  variant="link"
                                  className="h-auto p-0 font-semibold"
                                  aria-label={`Xem khóa ${program.name}`}
                                  onClick={() => void setProgram(program.id)}
                                >
                                  {program.name}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {program.subject} · Khối {program.grade} ·{" "}
                                  {program.sessionsPerWeek == null ? "Chưa cấu hình số buổi/tuần" : `${program.sessionsPerWeek} buổi/tuần`} ·{" "}
                                  {classes.isPending
                                    ? "đang tải lớp…"
                                    : classes.isError
                                      ? "chưa tải được lớp"
                                      : programClasses.length
                                        ? programClasses.join(", ")
                                        : "chưa có lớp"}
                                </span>
                                {program.isActive === false && (
                                  <StatusBadge
                                    category="program"
                                    status="inactive"
                                  />
                                )}
                                {classes.isSuccess &&
                                  program.isActive !== false &&
                                  (!programClasses.length ? (
                                    <Badge variant="warning">
                                      Chưa thể duyệt nội dung giáo trình
                                    </Badge>
                                  ) : withoutTeacher ? (
                                    <Badge variant="warning">
                                      {withoutTeacher === programClasses.length
                                        ? "Lớp chưa có giáo viên"
                                        : `${withoutTeacher} lớp chưa có giáo viên`}
                                    </Badge>
                                  ) : null)}
                              </div>
                            </TableCell>
                            <TableCell className="sticky right-0 bg-muted text-right">
                              <div className="flex justify-end gap-1">
                                {classes.isSuccess &&
                                  program.isActive !== false &&
                                  (!programClasses.length ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      render={
                                        <Link
                                          href={`${ROUTES.MANAGER.CLASS_NEW}?programId=${encodeURIComponent(program.id)}`}
                                        />
                                      }
                                    >
                                      Tạo lớp cho khóa này
                                    </Button>
                                  ) : withoutTeacher ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      render={
                                        <Link
                                          href={ROUTES.MANAGER.CLASSES_UNASSIGNED}
                                        />
                                      }
                                    >
                                      Phân công giáo viên
                                    </Button>
                                  ) : null)}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  aria-label={`Sửa khóa ${program.name}`}
                                  onClick={() =>
                                    void setEditView({
                                      editProgram: program.id,
                                      returnTo: null,
                                    })
                                  }
                                >
                                  Sửa khóa
                                </Button>
                                <RowActions
                                  items={[
                                    {
                                      id: "detail",
                                      label: "Chi tiết khóa",
                                      onClick: () =>
                                        void setProgram(program.id),
                                    },
                                    {
                                      id: "delete",
                                      label: "Xóa / Ngừng sử dụng",
                                      danger: true,
                                      onClick: () => setDeleting(program),
                                    },
                                  ]}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                          {units.isPending && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="pl-8 text-muted-foreground"
                              >
                                Đang tải giáo trình…
                              </TableCell>
                            </TableRow>
                          )}
                          {!units.isPending && !programUnits.length && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="pl-8 text-muted-foreground"
                              >
                                Chưa có giáo trình
                              </TableCell>
                            </TableRow>
                          )}
                          {programUnits.map((unit) => {
                            const stage = curriculumStage(unit);
                            return (
                              <TableRow key={unit.id}>
                                <TableCell className="max-w-96 whitespace-normal pl-8">
                                  {unit.title} · bản {unit.version}
                                </TableCell>
                                <TableCell>
                                  {calendarDateLabel(
                                    unit.fromDate.slice(0, 10),
                                  )}{" "}
                                  →{" "}
                                  {calendarDateLabel(unit.toDate.slice(0, 10))}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {unit._count?.lessons ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    category="curriculum"
                                    status={stage}
                                  />
                                  {curriculumEffectiveLabel(unit, today) && <p className="mt-1 text-xs text-muted-foreground">{curriculumEffectiveLabel(unit, today)}</p>}
                                </TableCell>
                                <TableCell className="sticky right-0 bg-card text-right">
                                  <Button
                                    size="sm"
                                    variant={
                                      stage === "PENDING_MANAGER_CONFIRMATION"
                                        ? "default"
                                        : "ghost"
                                    }
                                    aria-label={`${stage === "PENDING_MANAGER_CONFIRMATION" ? "Duyệt áp dụng" : "Xem"} giáo trình ${unit.title}`}
                                    render={
                                      <Link
                                        href={ROUTES.MANAGER.CURRICULUM_UNIT(
                                          unit.id,
                                        )}
                                      />
                                    }
                                  >
                                    {stage === "PENDING_MANAGER_CONFIRMATION"
                                      ? "Duyệt áp dụng"
                                      : "Xem"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </AsyncBoundary>
          {programs.data && (
            <TablePagination
              totalItems={rows.length}
              pageParamKey="catalogPage"
              fixedPageSize={PROGRAMS_PAGE_SIZE}
            />
          )}
        </CardContent>
      </Card>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Tạo khóa học</DialogTitle>
            <DialogDescription>{PROGRAM_DIALOG_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          {creating && (
            <ProgramForm
              onSaved={onCreated}
              onCancel={() => setCreating(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editProgramId}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Sửa khóa học</DialogTitle>
            <DialogDescription>{PROGRAM_DIALOG_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <AsyncBoundary
            isLoading={!editing && (programs.isPending || editDetail.isPending)}
            isError={!editing && editDetail.isError}
            error={editDetail.error}
            onRetry={() => void editDetail.refetch()}
          >
            {editing && (
              <ProgramForm
                key={editing.id}
                program={editing}
                onSaved={onEdited}
                onCancel={closeEdit}
              />
            )}
          </AsyncBoundary>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa hoặc ngừng sử dụng?"
        description={`${deleting?.name ?? ""} sẽ được xóa nếu chưa có dữ liệu, hoặc ngừng sử dụng nếu đã được áp dụng.`}
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
          } catch {
            /* Lỗi hiện ở ApiFeedback phía trên bảng. */
          }
        }}
      />
    </div>
  );
}

function SubjectsCatalog() {
  const refresh = useCatalogRefresh();
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [createKey, setCreateKey] = useState(0);
  const [editing, setEditing] = useState<AcademicSubject | null>(null);
  const [deleting, setDeleting] = useState<AcademicSubject | null>(null);
  const subjects = useQuery({
    queryKey: ["academic-subjects", search],
    queryFn: ({ signal }) => registrationApi.subjects(search.trim(), signal),
    retry: false,
  });
  // Danh sách đầy đủ (không lọc) để chặn mã môn trùng.
  const allSubjects = useQuery({
    queryKey: ["academic-subjects", ""],
    queryFn: ({ signal }) => registrationApi.subjects("", signal),
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest<unknown>(`subjects/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    retry: false,
    onSuccess: refresh,
  });
  const columns: DataTableColumn<AcademicSubject>[] = [
    {
      accessorKey: "name",
      header: "Môn học",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    { accessorKey: "code", header: "Mã môn" },
    {
      id: "programs",
      header: "Khóa học",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original._count?.programs ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <StatusBadge
          category="program"
          status={row.original.isActive ? "active" : "inactive"}
        />
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            aria-label={`Sửa môn ${row.original.name}`}
            onClick={() => setEditing(row.original)}
          >
            Sửa
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Xóa hoặc ngừng sử dụng môn ${row.original.name}`}
            onClick={() => setDeleting(row.original)}
          >
            Xóa / Ngừng sử dụng
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Thêm môn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApiFeedback
            error={allSubjects.error}
            retry={() => void allSubjects.refetch()}
          />
          <SubjectForm
            key={createKey}
            existing={allSubjects.data}
            submitLabel="Thêm môn"
            onSaved={() => {
              refresh();
              setCreateKey((value) => value + 1);
            }}
          />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4">
          <FilterBar searchPlaceholder="Tìm môn học…" />
          <ApiFeedback error={remove.error} />
          <DataTable
            columns={columns}
            data={subjects.data ?? []}
            isLoading={subjects.isPending}
            isError={subjects.isError}
            error={subjects.error}
            onRetry={() => void subjects.refetch()}
            emptyTitle="Chưa có môn học phù hợp"
            emptyDescription="Thử tìm theo tên khác hoặc thêm môn mới."
          />
        </CardContent>
      </Card>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa môn học</DialogTitle>
            <DialogDescription>
              Cập nhật tên, mã môn và trạng thái sử dụng.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <SubjectForm
              key={editing.id}
              subject={editing}
              existing={allSubjects.data}
              submitLabel="Lưu thay đổi"
              onCancel={() => setEditing(null)}
              onSaved={() => {
                refresh();
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa hoặc ngừng sử dụng?"
        description={`${deleting?.name ?? ""} sẽ được xóa nếu chưa có dữ liệu, hoặc ngừng sử dụng nếu đã được áp dụng.`}
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
          } catch {
            /* Lỗi hiện ở ApiFeedback phía trên bảng. */
          }
        }}
      />
    </div>
  );
}

const SUBJECT_CODE_TAKEN = "Mã môn này đã có. Chọn mã khác.";

/**
 * Thêm hoặc sửa một môn. Tạo môn mới thì mã tự gợi ý theo tên cho tới khi người dùng tự gõ mã.
 * `existing` là danh sách môn đầy đủ để báo mã trùng ngay ở ô mã (BE có thể trả lỗi chung);
 * chưa tải xong (`undefined`) thì chưa cho lưu, vì chưa kiểm được mã trùng.
 */
function SubjectForm({
  subject,
  existing,
  submitLabel,
  onSaved,
  onCancel,
}: {
  subject?: AcademicSubject;
  existing: AcademicSubject[] | undefined;
  submitLabel: string;
  onSaved: (saved: AcademicSubject) => void;
  onCancel?: () => void;
}) {
  const id = useId();
  const form = useForm<AcademicSubjectInput>({
    resolver: zodResolver(academicSubjectSchema),
    defaultValues: {
      code: subject?.code ?? "",
      name: subject?.name ?? "",
      isActive: subject?.isActive ?? true,
    },
  });
  const save = useMutation({
    mutationFn: ({ isActive, ...fields }: AcademicSubjectInput) =>
      apiRequest<AcademicSubject>(
        subject ? "subjects/" + subject.id : "subjects",
        {
          method: subject ? "PATCH" : "POST",
          body: subject ? { ...fields, isActive } : fields,
        },
      ),
    retry: false,
    onSuccess: (saved) => {
      toast.success(
        subject
          ? "Đã lưu thay đổi."
          : withFinalPeriod(`Đã tạo môn ${saved.name}`),
      );
      onSaved(saved);
    },
  });
  const code = useWatch({ control: form.control, name: "code" });
  const { errors, dirtyFields, isSubmitted } = form.formState;
  const isCodeTyped = !!dirtyFields.code;
  const codeTaken = isSubjectCodeTaken(existing ?? [], code, subject?.id);
  const codeError = errors.code?.message ?? (codeTaken ? SUBJECT_CODE_TAKEN : undefined);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((value) => {
        if (!existing) return;
        if (codeTaken) {
          form.setFocus("code");
          return;
        }
        save.mutate(value);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Tên môn</Label>
        <Input
          id={`${id}-name`}
          placeholder="Ví dụ: Toán"
          aria-invalid={!!errors.name}
          aria-describedby={`${id}-name-error`}
          {...form.register("name", {
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              if (subject || isCodeTyped) return;
              form.setValue("code", suggestSubjectCode(event.target.value), {
                shouldValidate: isSubmitted,
              });
            },
          })}
        />
        <div id={`${id}-name-error`}>
          <FieldError message={errors.name?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-code`}>Mã môn</Label>
        <Input
          id={`${id}-code`}
          placeholder="Ví dụ: TOAN"
          aria-invalid={!!codeError}
          aria-describedby={`${id}-code-help ${id}-code-error`}
          {...form.register("code")}
        />
        <p id={`${id}-code-help`} className="text-xs text-muted-foreground">
          {subject
            ? "Viết liền, không dấu."
            : "Viết liền, không dấu. Tự gợi ý theo tên môn."}
        </p>
        <div id={`${id}-code-error`}>
          <FieldError message={codeError} />
        </div>
      </div>
      {subject && (
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${id}-active`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor={`${id}-active`}>Đang sử dụng</Label>
            </div>
          )}
        />
      )}
      <ApiFeedback error={save.error} />
      {!existing && (
        <p role="status" className="text-xs text-muted-foreground">
          Đang tải danh sách môn để kiểm tra mã trùng…
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={onCancel}
          >
            Hủy
          </Button>
        )}
        <Button type="submit" isLoading={save.isPending} disabled={!existing}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

const PROGRAM_DIALOG_DESCRIPTION =
  "Khóa học là một môn của một khối, ví dụ Toán 7. Lớp và giáo trình đều thuộc một khóa.";
/** Tạo khóa bắt buộc có số buổi/tuần; khóa cũ chưa đặt thì sửa vẫn để trống được. */
const createProgramSchema = academicProgramSchema.superRefine(
  (value, context) => {
    if (value.sessionsPerWeek === undefined)
      context.addIssue({
        code: "custom",
        path: ["sessionsPerWeek"],
        message: "Chọn số buổi mỗi tuần.",
      });
  },
);

/**
 * Form trong hộp tạo / sửa khóa. "+ Thêm môn" thay nội dung hộp bằng form môn: hai form
 * không lồng nhau, còn giá trị đã chọn của khóa vẫn giữ trong `form` của container này.
 */
function ProgramForm({
  program,
  onSaved,
  onCancel,
}: {
  program?: RegistrationProgram;
  onSaved: (saved: RegistrationProgram) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const client = useQueryClient();
  const [view, setView] = useState<"program" | "subject">("program");
  // Môn vừa thêm trong hộp, giữ tới khi danh sách môn tải lại có nó.
  const [addedSubjects, setAddedSubjects] = useState<AcademicSubject[]>([]);
  // Cùng khóa cache với tab Danh mục môn; cần đủ danh sách để chọn môn và chặn mã trùng.
  const subjectsQuery = useQuery({
    queryKey: ["academic-subjects", ""],
    queryFn: ({ signal }) => registrationApi.subjects("", signal),
    retry: false,
  });
  const subjects = subjectsQuery.data ?? [];
  const allPrograms = useQuery({
    queryKey: ["registration-programs", { search: "" }],
    queryFn: ({ signal }) => registrationApi.programsFiltered({}, signal),
    retry: false,
  });
  const form = useForm<AcademicProgramInput>({
    resolver: zodResolver(program ? academicProgramSchema : createProgramSchema),
    defaultValues: {
      name: program?.name ?? "",
      subjectId: program?.subjectId ?? "",
      grade: program?.grade,
      sessionsPerWeek: program
        ? (program.sessionsPerWeek ?? undefined)
        : SESSIONS_PER_WEEK.default,
      isActive: program?.isActive ?? true,
    },
  });
  const save = useMutation({
    mutationFn: (body: Partial<AcademicProgramInput>) =>
      apiRequest<RegistrationProgram>(
        program ? "programs/" + program.id : "programs",
        { method: program ? "PATCH" : "POST", body },
      ),
    retry: false,
    onSuccess: onSaved,
  });
  const submit = form.handleSubmit((value) => {
    if (!program) {
      const { name, subjectId: chosenSubjectId, grade: chosenGrade, sessionsPerWeek } = value;
      save.mutate({ name, subjectId: chosenSubjectId, grade: chosenGrade, sessionsPerWeek });
      return;
    }
    // Sửa khóa chỉ gửi phần đã đổi (xem `pickChangedFields`).
    const changed = pickChangedFields(value, form.formState.dirtyFields);
    if (!Object.keys(changed).length) {
      toast.info("Chưa có thay đổi.");
      return;
    }
    save.mutate(changed);
  });
  const [subjectId, grade] = useWatch({
    control: form.control,
    name: ["subjectId", "grade"],
  });
  const { errors, dirtyFields, isSubmitted } = form.formState;
  const known = [
    ...subjects,
    ...addedSubjects.filter(
      (added) => !subjects.some((item) => item.id === added.id),
    ),
  ];
  const choices = known.filter(
    (item) => item.isActive || item.id === program?.subjectId,
  );
  const subject = known.find((item) => item.id === subjectId);
  const sameProgram = program
    ? undefined
    : findSameSubjectGradeProgram(allPrograms.data ?? [], subject, grade);
  // Ô tên chỉ "dirty" khi người dùng tự gõ; xóa trắng thì hết dirty và lại tự điền.
  const isNameTyped = !!dirtyFields.name;
  const fillName = (subjectName?: string, nextGrade?: number) => {
    if (program || isNameTyped) return;
    const suggestion = suggestProgramName(subjectName, nextGrade);
    if (suggestion)
      form.setValue("name", suggestion, { shouldValidate: isSubmitted });
  };

  if (view === "subject")
    return (
      <section aria-labelledby={`${id}-new-subject`} className="space-y-4">
        <h3 id={`${id}-new-subject`} className="font-medium">
          Thêm môn
        </h3>
        <SubjectForm
          existing={known}
          submitLabel="Thêm môn"
          onCancel={() => setView("program")}
          onSaved={(added) => {
            setAddedSubjects((list) => [...list, added]);
            void client.invalidateQueries({ queryKey: ["academic-subjects"] });
            form.setValue("subjectId", added.id, {
              shouldDirty: true,
              shouldValidate: isSubmitted,
            });
            fillName(added.name, form.getValues("grade"));
            setView("program");
          }}
        />
      </section>
    );

  const submitLabels = program
    ? { idle: "Lưu thay đổi", busy: "Đang lưu…" }
    : { idle: "Tạo khóa học", busy: "Đang tạo…" };
  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <div className="space-y-2">
        {subjectsQuery.isPending ? (
          <>
            <p className="text-sm font-medium">Môn học</p>
            <p role="status" className="text-sm text-muted-foreground">
              Đang tải danh sách môn…
            </p>
          </>
        ) : subjectsQuery.isError ? (
          <>
            <p className="text-sm font-medium">Môn học</p>
            <ApiFeedback
              error={subjectsQuery.error}
              retry={() => void subjectsQuery.refetch()}
            />
          </>
        ) : choices.length ? (
          <Controller
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <ChoiceCards
                legend="Môn học"
                name={`${id}-subject`}
                columns={3}
                value={field.value}
                disabled={save.isPending}
                invalid={!!errors.subjectId}
                describedBy={`${id}-subject-error`}
                options={choices.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                onChange={(value) => {
                  field.onChange(value);
                  fillName(
                    known.find((item) => item.id === value)?.name,
                    form.getValues("grade"),
                  );
                }}
              />
            )}
          />
        ) : (
          <>
            <p className="text-sm font-medium">Môn học</p>
            <p className="text-sm text-muted-foreground">
              Chưa có môn nào. Thêm môn đầu tiên.
            </p>
          </>
        )}
        {/* Nút riêng, không phải một thẻ radio: đi qua bằng phím mũi tên không tự mở form môn. */}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-2xl border-dashed"
          disabled={save.isPending || !subjectsQuery.isSuccess}
          onClick={() => setView("subject")}
        >
          + Thêm môn
        </Button>
        <div id={`${id}-subject-error`}>
          <FieldError message={errors.subjectId?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Controller
          control={form.control}
          name="grade"
          render={({ field }) => (
            <ChoiceCards
              legend="Khối"
              name={`${id}-grade`}
              value={field.value == null ? "" : String(field.value)}
              disabled={save.isPending}
              invalid={!!errors.grade}
              describedBy={`${id}-grade-error`}
              options={PROGRAM_GRADES.map((value) => ({
                value: String(value),
                label: `Khối ${value}`,
              }))}
              onChange={(value) => {
                const next = Number(value);
                field.onChange(next);
                fillName(subject?.name, next);
              }}
            />
          )}
        />
        <div id={`${id}-grade-error`}>
          <FieldError message={errors.grade?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <p id={`${id}-weekly-label`} className="text-sm font-medium">
          Số buổi mỗi tuần
        </p>
        <Controller
          control={form.control}
          name="sessionsPerWeek"
          render={({ field }) => (
            <NumberStepper
              labelId={`${id}-weekly-label`}
              value={field.value}
              onChange={field.onChange}
              min={SESSIONS_PER_WEEK.min}
              max={SESSIONS_PER_WEEK.max}
              startValue={SESSIONS_PER_WEEK.default}
              format={(value) => `${value} buổi/tuần`}
              emptyText="Chưa đặt"
              decreaseLabel="Giảm số buổi/tuần"
              increaseLabel="Tăng số buổi/tuần"
              describedBy={`${id}-weekly-help ${id}-weekly-error`}
              disabled={save.isPending}
            />
          )}
        />
        <p id={`${id}-weekly-help`} className="text-xs text-muted-foreground">
          Mỗi lớp của khóa sẽ học đúng số buổi này mỗi tuần.
          {program && program.sessionsPerWeek == null
            ? " Khóa này chưa đặt số buổi; bấm − hoặc + để đặt."
            : ""}
        </p>
        <div id={`${id}-weekly-error`}>
          <FieldError message={errors.sessionsPerWeek?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Tên khóa học</Label>
        <Input
          id={`${id}-name`}
          placeholder="Ví dụ: Toán 7"
          aria-invalid={!!errors.name}
          aria-describedby={`${id}-name-help ${id}-name-error`}
          {...form.register("name", {
            onBlur: () => {
              if (!form.getValues("name").trim())
                fillName(subject?.name, form.getValues("grade"));
            },
          })}
        />
        {!program && (
          <p id={`${id}-name-help`} className="text-xs text-muted-foreground">
            Tự điền theo môn và khối. Sửa nếu cần, ví dụ Toán 7 nâng cao.
          </p>
        )}
        <div id={`${id}-name-error`}>
          <FieldError message={errors.name?.message} />
        </div>
      </div>
      {sameProgram && (
        <Alert variant="info" role="status">
          Đã có khóa {sameProgram.name} cùng môn và khối. Chỉ tạo thêm khi cần
          một khóa khác, ví dụ nâng cao.
        </Alert>
      )}
      {program && (
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${id}-active`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor={`${id}-active`}>Đang sử dụng</Label>
            </div>
          )}
        />
      )}
      <ApiFeedback error={save.error} />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={onCancel}
        >
          Hủy
        </Button>
        <Button type="submit" isLoading={save.isPending}>
          {save.isPending ? submitLabels.busy : submitLabels.idle}
        </Button>
      </DialogFooter>
    </form>
  );
}
