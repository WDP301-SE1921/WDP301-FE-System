"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CurriculumHubTab } from "@/constants/curriculum-hub";
import { ROUTES } from "@/constants/routes";
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

const PROGRAMS_PAGE_SIZE = 10;
const PROGRAM_FILTERS = {
  all: "Tất cả khóa",
  review: "Có giáo trình chờ duyệt",
} as const;
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

/** Thân tab "Môn học" của Quản lý; chỉ hiện khi tab đó đang mở. */
export function SubjectsCatalogTab({
  tabs,
}: {
  tabs: readonly CurriculumHubTab[];
}) {
  const [tab] = useHubTab(tabs);
  return tab === "subjects" ? <SubjectsCatalog /> : null;
}

/**
 * Trái: tạo khóa học. Phải: bảng nhóm theo khóa, dưới mỗi khóa là các giáo trình theo kỳ.
 * Quản lý chỉ xem / duyệt giáo trình ở trang chi tiết, không có nút tạo giáo trình.
 */
function ProgramsCatalog() {
  const today = useVietnamDate();
  const refresh = useCatalogRefresh();
  const [{ search, catalogPage, programFilter }, setFilters] = useQueryStates({
    search: parseAsString.withDefault(""),
    catalogPage: parseAsInteger.withDefault(1),
    programFilter: parseAsStringLiteral(PROGRAM_FILTER_KEYS).withDefault("all"),
  });
  const [, setProgram] = useQueryState("program", parseAsString);
  const [createKey, setCreateKey] = useState(0);
  const [editing, setEditing] = useState<RegistrationProgram | null>(null);
  const [deleting, setDeleting] = useState<RegistrationProgram | null>(null);
  const subjects = useQuery({
    queryKey: ["academic-subjects", ""],
    queryFn: ({ signal }) => registrationApi.subjects("", signal),
    retry: false,
  });
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
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest<unknown>(`programs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    retry: false,
    onSuccess: refresh,
  });
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
  const rows = (programs.data ?? []).filter(
    (program) =>
      programFilter === "all" ||
      (unitsByProgram.get(program.id) ?? []).some(
        (unit) => curriculumStage(unit) === "PENDING_MANAGER_CONFIRMATION",
      ),
  );
  const start = (Math.max(1, catalogPage) - 1) * PROGRAMS_PAGE_SIZE;
  return (
    <div className="min-w-0 space-y-6">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Tạo khóa học</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApiFeedback
            error={subjects.error}
            retry={() => void subjects.refetch()}
          />
          <ProgramForm
            key={createKey}
            inline
            subjects={subjects.data ?? []}
            onSaved={() => {
              refresh();
              setCreateKey((value) => value + 1);
            }}
          />
          <p className="text-sm text-muted-foreground">
            Sau khi tạo khóa: tạo lớp cho khóa và phân công giáo viên thì Thiết
            kế giáo trình mới gửi thẩm định giáo trình được. Quản lý duyệt áp
            dụng và sinh lịch cho các lớp.
          </p>
        </CardContent>
      </Card>
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
                                      Chưa thể thẩm định giáo trình
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
                                  onClick={() => setEditing(program)}
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
                                  {unit.title} · v{unit.version}
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
                                    aria-label={`${stage === "PENDING_MANAGER_CONFIRMATION" ? "Duyệt" : "Xem"} giáo trình ${unit.title}`}
                                    render={
                                      <Link
                                        href={ROUTES.MANAGER.CURRICULUM_UNIT(
                                          unit.id,
                                        )}
                                      />
                                    }
                                  >
                                    {stage === "PENDING_MANAGER_CONFIRMATION"
                                      ? "Duyệt"
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
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa khóa học</DialogTitle>
            <DialogDescription>
              Chọn môn học, khối và tên khóa học.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <ProgramForm
              key={editing.id}
              program={editing}
              subjects={subjects.data ?? []}
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
          <CardTitle>Tạo môn học</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectForm
            key={createKey}
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
            emptyDescription="Thử tìm theo tên khác hoặc tạo môn học mới."
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

function SubjectForm({
  subject,
  onSaved,
}: {
  subject?: AcademicSubject;
  onSaved: () => void;
}) {
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
    onSuccess: onSaved,
  });
  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <Label htmlFor={subject ? "subject-code-edit" : "subject-code"}>
        Mã môn
      </Label>
      <Input
        id={subject ? "subject-code-edit" : "subject-code"}
        placeholder="Ví dụ: TOAN"
        {...form.register("code")}
      />
      <FieldError message={form.formState.errors.code?.message} />
      <Label htmlFor={subject ? "subject-name-edit" : "subject-name"}>
        Tên môn
      </Label>
      <Input
        id={subject ? "subject-name-edit" : "subject-name"}
        placeholder="Ví dụ: Toán"
        {...form.register("name")}
      />
      <FieldError message={form.formState.errors.name?.message} />
      {subject && (
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="subject-active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="subject-active">Đang sử dụng</Label>
            </div>
          )}
        />
      )}
      <ApiFeedback error={save.error} />
      <Button
        type="submit"
        disabled={save.isPending}
        isLoading={save.isPending}
      >
        Lưu môn học
      </Button>
    </form>
  );
}
function ProgramForm({
  program,
  subjects,
  onSaved,
  inline = false,
}: {
  program?: RegistrationProgram;
  subjects: AcademicSubject[];
  onSaved: () => void;
  /** Một hàng ngang trên trang danh sách khóa (để bảng bên dưới dùng đủ chiều ngang). */
  inline?: boolean;
}) {
  const form = useForm<AcademicProgramInput>({
    resolver: zodResolver(academicProgramSchema.superRefine((value, context) => {
      if (!program && value.sessionsPerWeek === undefined)
        context.addIssue({ code: "custom", path: ["sessionsPerWeek"], message: "Nhập số buổi/tuần của khóa." });
    })),
    defaultValues: {
      name: program?.name ?? "",
      subjectId: program?.subjectId ?? "",
      grade: program?.grade ?? 6,
      sessionsPerWeek: program?.sessionsPerWeek ?? undefined,
      isActive: program?.isActive ?? true,
    },
  });
  const save = useMutation({
    mutationFn: ({ isActive, ...fields }: AcademicProgramInput) =>
      apiRequest<RegistrationProgram>(
        program ? "programs/" + program.id : "programs",
        {
          method: program ? "PATCH" : "POST",
          body: program ? { ...fields, isActive } : fields,
        },
      ),
    retry: false,
    onSuccess: onSaved,
  });
  const choices = subjects.filter(
    (s) => s.isActive || s.id === program?.subjectId,
  );
  const idPrefix = program ? "program-edit" : "program";
  return (
    <form
      className={
        inline
          ? "grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start"
          : "space-y-3"
      }
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Tên khóa học</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="Ví dụ: Toán 7"
          {...form.register("name")}
        />
        <FieldError message={form.formState.errors.name?.message} />
      </div>
      <div className={inline ? "contents" : "grid gap-3 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-subject`}>Môn học</Label>
          <Controller
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <Select
                value={field.value || null}
                items={choices.map((s) => ({ value: s.id, label: s.name }))}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={`${idPrefix}-subject`} className="w-full">
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((s) => (
                    <SelectItem value={s.id} key={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={form.formState.errors.subjectId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-grade`}>Khối</Label>
          <Controller
            control={form.control}
            name="grade"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                items={[6, 7, 8, 9].map((g) => ({
                  value: String(g),
                  label: "Khối " + g,
                }))}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger id={`${idPrefix}-grade`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 7, 8, 9].map((g) => (
                    <SelectItem value={String(g)} key={g}>
                      Khối {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-weekly`}>Số buổi/tuần</Label>
        <Input id={`${idPrefix}-weekly`} type="number" min={1} max={14} step={1}
          aria-invalid={!!form.formState.errors.sessionsPerWeek}
          aria-describedby={`${idPrefix}-weekly-help`}
          placeholder="Chưa cấu hình"
          {...form.register("sessionsPerWeek", { setValueAs: (value) => value === "" ? undefined : Number(value) })}
        />
        <p id={`${idPrefix}-weekly-help`} className="text-xs text-muted-foreground">
          Mỗi khung giờ học tính là một buổi. {program && program.sessionsPerWeek == null ? "Để trống để giữ nguyên khóa chưa cấu hình." : "Từ 1 đến 14 buổi/tuần."}
        </p>
        <FieldError message={form.formState.errors.sessionsPerWeek?.message} />
      </div>
      {!choices.length && (
        <p
          className={cn(
            "text-sm text-muted-foreground",
            inline && "md:col-span-5",
          )}
        >
          Tạo môn học trước khi tạo khóa.
        </p>
      )}
      {program && (
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id="program-active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="program-active">Đang sử dụng</Label>
            </div>
          )}
        />
      )}
      <div className={inline ? "md:col-span-5 md:row-start-2 empty:hidden" : undefined}>
        <ApiFeedback error={save.error} />
      </div>
      <div className={inline ? "md:pt-7" : undefined}>
        <Button
          type="submit"
          disabled={save.isPending || !choices.length}
          isLoading={save.isPending}
        >
          {program ? "Lưu khóa học" : "Tạo khóa học"}
        </Button>
      </div>
    </form>
  );
}
