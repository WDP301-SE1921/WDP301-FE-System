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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
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
  return (
    <PageContainer>
      <PageHeader
        title="Môn học và khóa học"
        description="Thiết lập môn, khóa học và các lớp áp dụng."
        actions={
          <Button onClick={() => setEditing("new")}>
            {tab === "subjects" ? "Tạo môn học" : "Tạo chương trình"}
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
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      )}
      <ApiFeedback error={remove.error} />
      {tab === "subjects" ? (
        <AsyncBoundary
          isLoading={subjects.isPending}
          isError={subjects.isError}
          error={subjects.error}
          onRetry={() => void subjects.refetch()}
          data={subjects.data}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {subjects.data?.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex justify-between gap-3">
                    <CardTitle>{s.name}</CardTitle>
                    <StatusBadge
                      category="program"
                      status={s.isActive ? "active" : "inactive"}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    {s.code} · {s._count?.programs ?? 0} khóa học
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditing(s)}>
                      Sửa
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleting(s)}>
                      Xóa / Ngừng sử dụng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncBoundary>
      ) : (
        <AsyncBoundary
          isLoading={programs.isPending}
          isError={programs.isError}
          error={programs.error}
          onRetry={() => void programs.refetch()}
          data={rows}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {rows.slice(start, start + size).map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex justify-between gap-3">
                    <CardTitle>{p.name}</CardTitle>
                    <StatusBadge
                      category="program"
                      status={p.isActive === false ? "inactive" : "active"}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    {p.subject} · Khối {p.grade}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      render={
                        <Link
                          href={ROUTES.MANAGER.CATALOG_PROGRAM_DETAIL(p.id)}
                        />
                      }
                    >
                      Chi tiết khóa
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(p)}>
                      Sửa
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleting(p)}>
                      Xóa / Ngừng sử dụng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AsyncBoundary>
      )}
      {tab !== "subjects" && programs.data && (
        <TablePagination totalItems={rows.length} />
      )}
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
        {program ? "Lưu khóa học" : "Tạo chương trình"}
      </Button>
    </form>
  );
}
