"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
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
import { ApiFeedback, FieldError, SELECT_CLASS } from "./api-feedback";
import type { RegistrationClass, RegistrationProgram } from "@/types/backend";

export function RegistrationClassEditor({ classId }: { classId?: string }) {
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    retry: false,
  });
  const classes = useQuery({
    queryKey: ["registration-classes", "all"],
    queryFn: () => registrationApi.classes(),
    enabled: !!classId,
    retry: false,
  });
  const classroom = classes.data?.find((row) => row.id === classId);
  return (
    <PageContainer>
      <PageHeader
        title={classId ? "Cấu hình lớp học" : "Tạo lớp học"}
        description="Tạo lớp ở trạng thái đóng, lưu lịch tuần rồi mở đăng ký."
        actions={
          <Link
            className="rounded-xl border border-border px-4 py-2 text-sm"
            href={ROUTES.MANAGER.CLASSES}
          >
            Danh sách lớp
          </Link>
        }
      />
      <ApiFeedback
        error={programs.error}
        retry={() => void programs.refetch()}
      />
      <ApiFeedback error={classes.error} retry={() => void classes.refetch()} />
      {programs.isPending || (classId && classes.isPending) ? (
        <p>Đang tải cấu hình…</p>
      ) : classId && !classroom ? (
        <p>Không tìm thấy lớp trong danh sách.</p>
      ) : (
        <>
          <ClassDetailsForm
            key={classId ?? "new"}
            classroom={classroom}
            programs={programs.data ?? []}
          />
          {classroom && <ClassSchedulesForm classroom={classroom} />}
        </>
      )}
    </PageContainer>
  );
}
function ClassDetailsForm({
  classroom,
  programs,
}: {
  classroom?: RegistrationClass;
  programs: RegistrationProgram[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<RegistrationClassInput>({
    resolver: zodResolver(registrationClassSchema),
    defaultValues: {
      programId: classroom?.programId ?? "",
      name: classroom?.name ?? "",
      teacherId: classroom?.teacherId ?? "",
      capacity: classroom?.capacity ?? 20,
      monthlyFee: Number(classroom?.monthlyFee ?? 0),
    },
  });
  const save = useMutation({
    mutationFn: (input: RegistrationClassInput) => {
      const { programId, teacherId, ...fields } = input;
      return apiRequest<RegistrationClass>(
        classroom ? `classes/${classroom.id}` : "classes",
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
      );
    },
    retry: false,
    onSuccess: (result) => {
      queryClient.setQueryData<RegistrationClass[]>(
        ["registration-classes", "all"],
        (rows) =>
          rows
            ? [...rows.filter((row) => row.id !== result.id), result]
            : [result],
      );
      void queryClient.invalidateQueries({
        queryKey: ["registration-classes"],
      });
      toast.success(
        classroom
          ? "Đã lưu thông tin lớp."
          : "Đã tạo lớp. Tiếp tục cấu hình lịch tuần.",
      );
      if (!classroom) router.replace(ROUTES.MANAGER.CLASS_DETAIL(result.id));
    },
  });
  const toggle = useMutation({
    mutationFn: () =>
      apiRequest<RegistrationClass>(`classes/${classroom!.id}`, {
        method: "PATCH",
        body: { isOpen: !classroom!.isOpen },
      }),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["registration-classes"],
      });
      toast.success("Đã cập nhật trạng thái đăng ký.");
    },
  });
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Thông tin lớp</CardTitle>
          {classroom && (
            <Badge variant={classroom.isOpen ? "success" : "secondary"}>
              {classroom.isOpen ? "Mở đăng ký" : "Đóng đăng ký"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((input) => save.mutate(input))}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class-program">Chương trình</Label>
              <select
                id="class-program"
                className={SELECT_CLASS}
                disabled={!!classroom}
                {...form.register("programId")}
              >
                <option value="">Chọn chương trình</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} · {program.subject} · Khối {program.grade}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.programId?.message} />
              {!programs.length && (
                <Link
                  className="text-sm text-primary underline"
                  href={ROUTES.MANAGER.CATALOG}
                >
                  Tạo chương trình trước
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
              <Label htmlFor="class-teacher">
                Mã tài khoản giáo viên (không bắt buộc)
              </Label>
              <Input
                id="class-teacher"
                placeholder="Mã giáo viên do trung tâm cung cấp"
                {...form.register("teacherId")}
              />
              <p className="text-xs text-muted-foreground">
                Để trống để bỏ gán giáo viên. Chỉ dùng tài khoản giáo viên đang
                hoạt động.
              </p>
              <FieldError message={form.formState.errors.teacherId?.message} />
            </div>
          </div>
          <ApiFeedback error={save.error} />
          <ApiFeedback error={toggle.error} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              isLoading={save.isPending}
              disabled={toggle.isPending}
            >
              Lưu thông tin lớp
            </Button>
            {classroom && (
              <Button
                type="button"
                variant="outline"
                isLoading={toggle.isPending}
                disabled={
                  save.isPending ||
                  (!classroom.isOpen && !classroom.weeklySchedules.length)
                }
                onClick={() => toggle.mutate()}
              >
                {classroom.isOpen ? "Đóng đăng ký" : "Mở đăng ký"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
function ClassSchedulesForm({ classroom }: { classroom: RegistrationClass }) {
  const queryClient = useQueryClient();
  const form = useForm<SchedulesInput>({
    resolver: zodResolver(schedulesSchema),
    defaultValues: {
      schedules: classroom.weeklySchedules.length
        ? classroom.weeklySchedules.map(({ weekday, startTime, endTime }) => ({
            weekday,
            startTime,
            endTime,
          }))
        : [{ weekday: 1, startTime: "18:00", endTime: "20:00" }],
    },
  });
  const fields = useFieldArray({ control: form.control, name: "schedules" });
  const save = useMutation({
    mutationFn: (input: SchedulesInput) =>
      apiRequest<RegistrationClass>(`classes/${classroom.id}/schedules`, {
        method: "POST",
        body: input,
      }),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["registration-classes"],
      });
      toast.success("Đã lưu lịch tuần. Bạn có thể mở đăng ký.");
    },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch cố định hằng tuần</CardTitle>
        <CardDescription>
          Lưu toàn bộ các khung giờ cần giữ. Lớp đã có ghi danh chưa kết thúc sẽ
          bị khóa sửa lịch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((input) => save.mutate(input))}
        >
          {fields.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid items-start gap-3 rounded-xl border border-border p-4 sm:grid-cols-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`schedule-day-${index}`}>Thứ học</Label>
                <select
                  id={`schedule-day-${index}`}
                  className={SELECT_CLASS}
                  {...form.register(`schedules.${index}.weekday`, {
                    valueAsNumber: true,
                  })}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <option key={day} value={day}>
                      {day === 7 ? "Chủ nhật" : `Thứ ${day + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`schedule-start-${index}`}>Bắt đầu</Label>
                <Input
                  id={`schedule-start-${index}`}
                  type="time"
                  {...form.register(`schedules.${index}.startTime`)}
                />
                <FieldError
                  message={
                    form.formState.errors.schedules?.[index]?.startTime?.message
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`schedule-end-${index}`}>Kết thúc</Label>
                <Input
                  id={`schedule-end-${index}`}
                  type="time"
                  {...form.register(`schedules.${index}.endTime`)}
                />
                <FieldError
                  message={
                    form.formState.errors.schedules?.[index]?.endTime?.message
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="sm:mt-7"
                disabled={fields.fields.length === 1 || save.isPending}
                onClick={() => fields.remove(index)}
              >
                Xóa khung giờ
              </Button>
            </div>
          ))}
          <FieldError message={form.formState.errors.schedules?.message} />
          <ApiFeedback error={save.error} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={fields.fields.length >= 14 || save.isPending}
              onClick={() =>
                fields.append({
                  weekday: 1,
                  startTime: "18:00",
                  endTime: "20:00",
                })
              }
            >
              Thêm khung giờ
            </Button>
            <Button type="submit" isLoading={save.isPending}>
              Lưu lịch tuần
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
