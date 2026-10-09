"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { ClassRoster } from "@/components/shared/academic/class-roster";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/client";
import { registrationApi } from "../api";
import {
  registrationClassSchema,
  schedulesSchema,
  type RegistrationClassInput,
  type SchedulesInput,
} from "../schemas";
import { ApiFeedback, FieldError } from "./api-feedback";
import type {
  AcademicTeacher,
  RegistrationClass,
  RegistrationProgram,
  WeeklySchedule,
} from "@/types/backend";

export function RegistrationClassEditor({ classId }: { classId?: string }) {
  const [programId] = useQueryState("programId", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState(
    "rosterPage",
    parseAsInteger.withDefault(1),
  );
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const teachers = useQuery({
    queryKey: ["academic-teachers", "active"],
    queryFn: ({ signal }) => registrationApi.teachers(signal),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["registration-class", classId, page],
    queryFn: ({ signal }) =>
      registrationApi.class(classId!, Math.max(1, page), signal),
    enabled: !!classId,
    retry: false,
  });
  const classroom = detail.data;
  return (
    <PageContainer>
      <PageHeader
        title={classId ? "Cấu hình lớp học" : "Tạo lớp học"}
        description="Tạo lớp đóng, lưu lịch tuần rồi mở đăng ký."
        actions={
          <Button
            variant="outline"
            render={<Link href={ROUTES.MANAGER.CLASSES} />}
          >
            Danh sách lớp
          </Button>
        }
      />
      <ApiFeedback
        error={teachers.error}
        retry={() => void teachers.refetch()}
      />
      <AsyncBoundary
        isLoading={programs.isPending || (!!classId && detail.isPending)}
        isError={programs.isError || detail.isError}
        error={programs.error ?? detail.error}
        onRetry={() => {
          void programs.refetch();
          void detail.refetch();
        }}
      >
        {(!classId || classroom) && (
          <>
            <ClassDetailsForm
              key={
                classroom
                  ? JSON.stringify([
                      classroom.id,
                      classroom.name,
                      classroom.teacherId,
                      classroom.capacity,
                      classroom.monthlyFee,
                    ])
                  : "new"
              }
              classroom={classroom}
              programs={programs.data ?? []}
              teachers={teachers.data?.items ?? []}
              initialProgramId={programId}
            />
            {classroom && (
              <>
                <ClassSchedules classroom={classroom} />
                <ClassRoster
                  roster={classroom.enrollments}
                  page={page}
                  onPageChange={(v) => void setPage(v)}
                />
              </>
            )}
          </>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
function ClassDetailsForm({
  classroom,
  programs,
  teachers,
  initialProgramId,
}: {
  classroom?: RegistrationClass;
  programs: RegistrationProgram[];
  teachers: AcademicTeacher[];
  initialProgramId: string;
}) {
  const router = useRouter(),
    qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const form = useForm<RegistrationClassInput>({
    resolver: zodResolver(registrationClassSchema),
    defaultValues: {
      programId: classroom?.programId ?? initialProgramId,
      name: classroom?.name ?? "",
      teacherId: classroom?.teacherId ?? "",
      capacity: classroom?.capacity ?? 20,
      monthlyFee: Number(classroom?.monthlyFee ?? 0),
    },
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["registration-classes"] });
    void qc.invalidateQueries({ queryKey: ["registration-class"] });
    void qc.invalidateQueries({ queryKey: ["academic-program"] });
  };
  const save = useMutation({
    mutationFn: ({ programId, teacherId, ...fields }: RegistrationClassInput) =>
      apiRequest<RegistrationClass>(
        classroom ? "classes/" + classroom.id : "classes",
        {
          method: classroom ? "PATCH" : "POST",
          body: classroom
            ? { ...fields, teacherId: teacherId || null }
            : {
                ...fields,
                programId,
                ...(teacherId ? { teacherId } : {}),
                isOpen: false,
              },
        },
      ),
    retry: false,
    onSuccess: (result) => {
      refresh();
      toast.success("Đã lưu thông tin lớp.");
      if (!classroom) router.replace(ROUTES.MANAGER.CLASS_DETAIL(result.id));
    },
  });
  const state = useMutation({
    mutationFn: (body: { isOpen?: boolean; isActive?: boolean }) =>
      apiRequest<RegistrationClass>("classes/" + classroom!.id, {
        method: "PATCH",
        body,
      }),
    retry: false,
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () =>
      apiRequest<unknown>("classes/" + classroom!.id, { method: "DELETE" }),
    retry: false,
    onSuccess: () => {
      refresh();
      router.replace(ROUTES.MANAGER.CLASSES);
    },
  });
  const busy = save.isPending || state.isPending || remove.isPending;
  const choices = programs.filter(
    (p) => p.isActive !== false || p.id === classroom?.programId,
  );
  const teacherChoices: Pick<
    AcademicTeacher,
    "id" | "displayName" | "email"
  >[] = [...teachers];
  if (
    classroom?.teacherId &&
    !teacherChoices.some((t) => t.id === classroom.teacherId)
  )
    teacherChoices.push(
      classroom.teacher ?? {
        id: classroom.teacherId,
        email: "Giáo viên đã gán",
        displayName: null,
      },
    );
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Thông tin lớp</CardTitle>
          {classroom && (
            <Badge
              variant={
                classroom.isActive === false
                  ? "secondary"
                  : classroom.isOpen
                    ? "success"
                    : "outline"
              }
            >
              {classroom.isActive === false
                ? "Ngừng hoạt động"
                : classroom.isOpen
                  ? "Mở đăng ký"
                  : "Đóng đăng ký"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-program">Khóa học</Label>
              <Controller
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <Select
                    disabled={!!classroom || busy}
                    value={field.value || null}
                    items={choices.map((p) => ({
                      value: p.id,
                      label: p.name + " · " + p.subject + " · Khối " + p.grade,
                    }))}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="class-program">
                      <SelectValue placeholder="Chọn khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      {choices.map((p) => (
                        <SelectItem value={p.id} key={p.id}>
                          {p.name} · {p.subject} · Khối {p.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.programId?.message} />
              {!choices.length && (
                <Link
                  href={ROUTES.MANAGER.CATALOG}
                  className="text-sm text-primary underline"
                >
                  Tạo khóa học trước
                </Link>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-name">Tên lớp</Label>
              <Input id="class-name" {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-capacity">Sức chứa</Label>
              <Input
                id="class-capacity"
                type="number"
                min={1}
                max={1000}
                {...form.register("capacity", { valueAsNumber: true })}
              />
              <FieldError message={form.formState.errors.capacity?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-fee">Học phí mỗi tháng (VND)</Label>
              <Input
                id="class-fee"
                type="number"
                min={0}
                step={1000}
                {...form.register("monthlyFee", { valueAsNumber: true })}
              />
              <FieldError message={form.formState.errors.monthlyFee?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="class-teacher">Giáo viên phụ trách</Label>
              <Controller
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    items={[
                      { value: "none", label: "Chưa gán giáo viên" },
                      ...teacherChoices.map((t) => ({
                        value: t.id,
                        label: t.displayName ?? t.email,
                      })),
                    ]}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger id="class-teacher">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Chưa gán giáo viên</SelectItem>
                      {teacherChoices.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.displayName ?? t.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.teacherId?.message} />
              <p className="text-xs text-muted-foreground">
                Lớp có buổi học tương lai sẽ khóa đổi giáo viên.
              </p>
            </div>
          </div>
          <ApiFeedback error={save.error} />
          <ApiFeedback error={state.error} />
          <ApiFeedback error={remove.error} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy} isLoading={save.isPending}>
              Lưu thông tin lớp
            </Button>
            {classroom && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    busy ||
                    (!classroom.isOpen &&
                      (!classroom.weeklySchedules.length ||
                        classroom.isActive === false))
                  }
                  onClick={() => state.mutate({ isOpen: !classroom.isOpen })}
                >
                  {classroom.isOpen ? "Đóng đăng ký" : "Mở đăng ký"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    state.mutate({ isActive: classroom.isActive === false })
                  }
                >
                  {classroom.isActive === false
                    ? "Kích hoạt lớp"
                    : "Ngừng hoạt động"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDeleting(true)}
                >
                  Xóa lớp chưa sử dụng
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  render={
                    <Link href={ROUTES.MANAGER.CLASS_SESSIONS(classroom.id)} />
                  }
                >
                  Giáo trình và buổi học
                </Button>
              </>
            )}
          </div>
        </form>
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title="Xóa lớp học?"
          description="Chỉ xóa lớp chưa có ghi danh, đăng ký hoặc buổi học."
          variant="danger"
          isLoading={remove.isPending}
          onConfirm={async () => {
            try {
              await remove.mutateAsync();
            } catch {
              /* API feedback */
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
function ClassSchedules({ classroom }: { classroom: RegistrationClass }) {
  const slots = useQuery({
    queryKey: ["academic-schedules", classroom.id],
    queryFn: ({ signal }) => registrationApi.schedules(classroom.id, signal),
    retry: false,
  });
  return (
    <AsyncBoundary
      isLoading={slots.isPending}
      isError={slots.isError}
      error={slots.error}
      onRetry={() => void slots.refetch()}
    >
      {slots.data && (
        <ClassSchedulesForm
          key={JSON.stringify([
            slots.data,
            classroom.scheduleLocked,
            classroom.isOpen,
          ])}
          classroom={classroom}
          slots={slots.data}
        />
      )}
    </AsyncBoundary>
  );
}
function ClassSchedulesForm({
  classroom,
  slots,
}: {
  classroom: RegistrationClass;
  slots: WeeklySchedule[];
}) {
  const qc = useQueryClient();
  const form = useForm<SchedulesInput>({
    resolver: zodResolver(schedulesSchema),
    defaultValues: {
      schedules: slots.length
        ? slots.map(({ weekday, startTime, endTime }) => ({
            weekday,
            startTime,
            endTime,
          }))
        : [{ weekday: 1, startTime: "18:00", endTime: "20:00" }],
    },
  });
  const fields = useFieldArray({ control: form.control, name: "schedules" });
  const [ids, setIds] = useState<(string | undefined)[]>(
    slots.length ? slots.map((s) => s.id) : [undefined],
  );
  const [deleting, setDeleting] = useState<number | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({
      queryKey: ["academic-schedules", classroom.id],
    });
    void qc.invalidateQueries({ queryKey: ["registration-class"] });
    void qc.invalidateQueries({ queryKey: ["registration-classes"] });
    toast.success("Đã lưu lịch tuần.");
  };
  const save = useMutation({
    mutationFn: (input: SchedulesInput) =>
      registrationApi.saveSchedules(classroom.id, input),
    retry: false,
    onSuccess: refresh,
  });
  const edit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: WeeklySchedule }) =>
      registrationApi.updateSchedule(classroom.id, id, body),
    retry: false,
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      registrationApi.deleteSchedule(classroom.id, id),
    retry: false,
    onSuccess: refresh,
  });
  const locked = classroom.scheduleLocked === true,
    busy = save.isPending || edit.isPending || remove.isPending;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch cố định hằng tuần</CardTitle>
        <CardDescription>
          {locked
            ? "Lịch tuần đã khóa vì có ghi danh, học viên chuyển vào hoặc buổi học đã sinh."
            : "Giờ Việt Nam. Lưu toàn bộ lịch hoặc cập nhật từng khung giờ."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((v) => {
            if (classroom.isOpen && !v.schedules.length) {
              form.setError("schedules", {
                message: "Đóng đăng ký trước khi xóa toàn bộ lịch.",
              });
              return;
            }
            save.mutate(v);
          })}
        >
          <fieldset disabled={locked || busy} className="space-y-4">
            {fields.fields.map((field, i) => (
              <div
                key={field.id}
                className="grid items-start gap-3 rounded-xl border border-border p-4 sm:grid-cols-4"
              >
                <div className="space-y-2">
                  <Label htmlFor={"schedule-day-" + i}>Thứ học</Label>
                  <Controller
                    control={form.control}
                    name={`schedules.${i}.weekday`}
                    render={({ field: day }) => (
                      <Select
                        value={String(day.value)}
                        items={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                          value: String(n),
                          label: n === 7 ? "Chủ nhật" : "Thứ " + (n + 1),
                        }))}
                        onValueChange={(v) => day.onChange(Number(v))}
                      >
                        <SelectTrigger id={"schedule-day-" + i}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n === 7 ? "Chủ nhật" : "Thứ " + (n + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={"schedule-start-" + i}>Bắt đầu</Label>
                  <Input
                    id={"schedule-start-" + i}
                    type="time"
                    {...form.register(`schedules.${i}.startTime`)}
                  />
                  <FieldError
                    message={
                      form.formState.errors.schedules?.[i]?.startTime?.message
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={"schedule-end-" + i}>Kết thúc</Label>
                  <Input
                    id={"schedule-end-" + i}
                    type="time"
                    {...form.register(`schedules.${i}.endTime`)}
                  />
                  <FieldError
                    message={
                      form.formState.errors.schedules?.[i]?.endTime?.message
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:mt-7">
                  {ids[i] && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (await form.trigger("schedules"))
                          edit.mutate({
                            id: ids[i]!,
                            body: form.getValues("schedules")[i],
                          });
                      }}
                    >
                      Lưu khung giờ
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={classroom.isOpen && fields.fields.length === 1}
                    onClick={() => {
                      if (ids[i]) setDeleting(i);
                      else {
                        fields.remove(i);
                        setIds((rows) => rows.filter((_, n) => n !== i));
                      }
                    }}
                  >
                    Xóa khung giờ
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={fields.fields.length >= 14}
              onClick={() => {
                fields.append({
                  weekday: 1,
                  startTime: "18:00",
                  endTime: "20:00",
                });
                setIds((rows) => [...rows, undefined]);
              }}
            >
              Thêm khung giờ
            </Button>
            <Button type="submit" isLoading={save.isPending}>
              Lưu lịch tuần
            </Button>
          </fieldset>
          <FieldError message={form.formState.errors.schedules?.message} />
          <ApiFeedback error={save.error ?? edit.error ?? remove.error} />
        </form>
        <ConfirmDialog
          open={deleting !== null}
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
          title="Xóa khung giờ đã lưu?"
          variant="danger"
          isLoading={remove.isPending}
          onConfirm={async () => {
            try {
              await remove.mutateAsync(ids[deleting!]!);
            } catch {
              /* API feedback */
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
