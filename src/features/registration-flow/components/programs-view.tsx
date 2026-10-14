"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsString, parseAsInteger, useQueryState } from "nuqs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { PAGINATION_DEFAULTS } from "@/constants/ui";
import { ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/client";
import {
  academicSubjectSchema,
  academicProgramSchema,
  type AcademicSubjectInput,
  type AcademicProgramInput,
} from "@/lib/validators/academic-catalog";
import type { AcademicSubject, RegistrationProgram } from "@/types/backend";
import { registrationApi } from "../api";

export function RegistrationProgramsView() {
  const client = useQueryClient();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("programs"),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [grade, setGrade] = useQueryState(
    "grade",
    parseAsString.withDefault(""),
  );
  const [subjectId, setSubjectId] = useQueryState(
    "subjectId",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(PAGINATION_DEFAULTS.PAGE_SIZE),
  );
  const [editing, setEditing] = useState<
    AcademicSubject | RegistrationProgram | "new" | null
  >(null);
  const [deleting, setDeleting] = useState<
    AcademicSubject | RegistrationProgram | null
  >(null);
  const subjects = useQuery({
    queryKey: ["academic-subjects", tab === "subjects" ? search : ""],
    queryFn: ({ signal }) =>
      registrationApi.subjects(tab === "subjects" ? search : "", signal),
    retry: false,
  });
  const filters = {
    ...(search ? { search } : {}),
    ...(["6", "7", "8", "9"].includes(grade) ? { grade } : {}),
    ...(subjectId ? { subjectId } : {}),
  };
  const programs = useQuery({
    queryKey: ["registration-programs", filters],
    queryFn: ({ signal }) => registrationApi.programsFiltered(filters, signal),
    retry: false,
    enabled: tab !== "subjects",
  });
  function refresh() {
    for (const key of [
      ["academic-subjects"],
      ["registration-programs"],
      ["academic-program"],
      ["registration-classes"],
    ])
      void client.invalidateQueries({ queryKey: key });
  }
  const remove = useMutation({
    mutationFn: () =>
      apiRequest<unknown>(
        (tab === "subjects" ? "subjects/" : "programs/") + deleting!.id,
        { method: "DELETE" },
      ),
    retry: false,
    onSuccess: refresh,
  });
  const rows = programs.data ?? [];
  const size = Math.max(1, Math.min(100, pageSize)),
    start = (Math.max(1, page) - 1) * size;
  const subjectColumns: DataTableColumn<AcademicSubject>[] = [
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
      cell: ({ row }) => row.original._count?.programs ?? 0,
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
        <div className="flex gap-2">
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
  const programColumns: DataTableColumn<RegistrationProgram>[] = [
    {
      accessorKey: "name",
      header: "Khóa học",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    { accessorKey: "subject", header: "Môn học" },
    {
      id: "grade",
      header: "Khối",
      cell: ({ row }) => `Khối ${row.original.grade}`,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <StatusBadge
          category="program"
          status={row.original.isActive === false ? "inactive" : "active"}
        />
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label={`Xem khóa ${row.original.name}`}
            render={
              <Link
                href={ROUTES.MANAGER.CATALOG_PROGRAM_DETAIL(row.original.id)}
              />
            }
          >
            Chi tiết
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Sửa khóa ${row.original.name}`}
            onClick={() => setEditing(row.original)}
          >
            Sửa
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Xóa hoặc ngừng sử dụng khóa ${row.original.name}`}
            onClick={() => setDeleting(row.original)}
          >
            Xóa / Ngừng sử dụng
          </Button>
        </div>
      ),
    },
  ];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Môn học và khóa học"
        description="Thiết lập môn, khóa học và các lớp áp dụng."
        actions={
          <Button onClick={() => setEditing("new")}>
            {tab === "subjects" ? "Tạo môn học" : "Tạo khóa học"}
          </Button>
        }
      />
      <Tabs
        value={tab === "subjects" ? "subjects" : "programs"}
        onValueChange={(v) => {
          void setTab(String(v));
          setEditing(null);
          void setSearch(null);
          void setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="subjects">Môn học</TabsTrigger>
          <TabsTrigger value="programs">Khóa học</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Input
              aria-label="Tìm danh mục"
              placeholder="Tìm theo tên…"
              value={search}
              onChange={(e) => {
                void setSearch(e.target.value);
                void setPage(1);
              }}
            />
            {tab !== "subjects" && (
              <>
                <Select
                  value={subjectId || "all"}
                  items={[
                    { value: "all", label: "Tất cả môn" },
                    ...(subjects.data ?? []).map((s) => ({
                      value: s.id,
                      label: s.name,
                    })),
                  ]}
                  onValueChange={(v) => {
                    void setSubjectId(v === "all" ? null : String(v));
                    void setPage(1);
                  }}
                >
                  <SelectTrigger aria-label="Môn học">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả môn</SelectItem>
                    {subjects.data?.map((s) => (
                      <SelectItem value={s.id} key={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </>
            )}
          </div>
          <ApiFeedback error={remove.error} />
          {tab === "subjects" ? (
            <DataTable
              columns={subjectColumns}
              data={subjects.data ?? []}
              isLoading={subjects.isPending}
              isError={subjects.isError}
              error={subjects.error}
              onRetry={() => void subjects.refetch()}
              emptyTitle="Chưa có môn học phù hợp"
              emptyDescription="Thử tìm theo tên khác hoặc tạo môn học mới."
            />
          ) : (
            <DataTable
              columns={programColumns}
              data={rows.slice(start, start + size)}
              isLoading={programs.isPending}
              isError={programs.isError}
              error={programs.error}
              onRetry={() => void programs.refetch()}
              emptyTitle="Chưa có khóa học phù hợp"
              emptyDescription="Thử đổi từ khóa, môn hoặc khối để xem danh sách."
            />
          )}
          {tab !== "subjects" && programs.data && (
            <TablePagination totalItems={rows.length} />
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
            <DialogTitle>
              {tab === "subjects" ? "Môn học" : "Khóa học"}
            </DialogTitle>
            <DialogDescription>
              {tab === "subjects"
                ? "Cập nhật tên, mã môn và trạng thái sử dụng."
                : "Chọn môn học, khối và tên khóa học."}
            </DialogDescription>
          </DialogHeader>
          {editing &&
            (tab === "subjects" ? (
              <SubjectForm
                key={editing === "new" ? "new" : editing.id}
                subject={
                  editing === "new" ? undefined : (editing as AcademicSubject)
                }
                onSaved={() => {
                  refresh();
                  setEditing(null);
                }}
              />
            ) : (
              <ProgramForm
                key={editing === "new" ? "new" : editing.id}
                program={
                  editing === "new"
                    ? undefined
                    : (editing as RegistrationProgram)
                }
                subjects={subjects.data ?? []}
                onSaved={() => {
                  refresh();
                  setEditing(null);
                }}
              />
            ))}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Xóa hoặc ngừng sử dụng?"
        description={
          (deleting?.name ?? "") +
          " sẽ được xóa nếu chưa có dữ liệu, hoặc ngừng sử dụng nếu đã được áp dụng."
        }
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync();
          } catch {
            /* feedback */
          }
        }}
      />
    </PageContainer>
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
      <Label htmlFor="subject-code">Mã môn</Label>
      <Input id="subject-code" {...form.register("code")} />
      <FieldError message={form.formState.errors.code?.message} />
      <Label htmlFor="subject-name">Tên môn</Label>
      <Input id="subject-name" {...form.register("name")} />
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
}: {
  program?: RegistrationProgram;
  subjects: AcademicSubject[];
  onSaved: () => void;
}) {
  const form = useForm<AcademicProgramInput>({
    resolver: zodResolver(academicProgramSchema),
    defaultValues: {
      name: program?.name ?? "",
      subjectId: program?.subjectId ?? "",
      grade: program?.grade ?? 6,
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
  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <Label htmlFor="program-name">Tên khóa học</Label>
      <Input id="program-name" {...form.register("name")} />
      <FieldError message={form.formState.errors.name?.message} />
      <Label htmlFor="program-subject">Môn học</Label>
      <Controller
        control={form.control}
        name="subjectId"
        render={({ field }) => (
          <Select
            value={field.value || null}
            items={choices.map((s) => ({ value: s.id, label: s.name }))}
            onValueChange={field.onChange}
          >
            <SelectTrigger id="program-subject">
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
      {!choices.length && (
        <p className="text-sm text-muted-foreground">
          Tạo môn học trước khi tạo khóa.
        </p>
      )}
      <Label htmlFor="program-grade">Khối</Label>
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
            <SelectTrigger id="program-grade">
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
      <ApiFeedback error={save.error} />
      <Button
        type="submit"
        disabled={save.isPending || !choices.length}
        isLoading={save.isPending}
      >
        {program ? "Lưu khóa học" : "Tạo khóa học"}
      </Button>
    </form>
  );
}
