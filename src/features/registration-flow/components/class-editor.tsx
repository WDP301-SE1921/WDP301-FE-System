"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { RowActions } from "@/components/shared/data-table/row-actions";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { ClassRoster } from "@/components/shared/academic/class-roster";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { subjectDotClass } from "@/constants/subjects";
import { apiRequest } from "@/lib/api/client";
import { calendarDateLabel } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";
import { useCurrentTime } from "@/hooks/use-current-time";
import { curriculumApi } from "@/features/curriculum/api";
import { curriculumStage } from "@/features/curriculum/presentation";
import { registrationApi } from "../api";
import { todayInVietnam } from "../calendar";
import { canOpenRegistration, useClassStateMutation } from "../class-state";
import { isSubstituteSession, useTeacherNames } from "../teacher-names";
import {
  registrationClassSchema,
  schedulesSchema,
  type RegistrationClassInput,
  type SchedulesInput,
} from "../schemas";
import { ApiFeedback, FieldError } from "./api-feedback";
import { ApiForm } from "@/components/shared/forms/api-form";
import { displayMoment } from "@/features/academic/components/live-fields";
import {
  confirmationSchema,
  localDateTimeSchema,
  reasonSchema,
  requiredId,
  vietnamDateTime,
} from "@/lib/validators/web-workflows";
import type { RoomRecord } from "@/types/academic-workflows";
import type {
  AcademicTeacher,
  RegistrationClass,
  RegistrationProgram,
  WeeklySchedule,
} from "@/types/backend";
import type { CurriculumUnit, ScheduledSession } from "@/types/curriculum";

const DETAIL_TABS = {
  overview: "Tổng quan",
  students: "Học sinh",
  sessions: "Buổi học",
} as const;
type DetailTab = keyof typeof DETAIL_TABS;
const DETAIL_TAB_KEYS = Object.keys(DETAIL_TABS) as DetailTab[];
const SESSION_FILTERS = {
  upcoming: "Sắp tới",
  past: "Đã qua",
  all: "Tất cả",
} as const;
type SessionFilter = keyof typeof SESSION_FILTERS;
const SESSION_FILTER_KEYS = Object.keys(SESSION_FILTERS) as SessionFilter[];
const SESSIONS_PAGE_SIZE = 10;

function useEditorData(classId?: string) {
  const [page] = useQueryState("rosterPage", parseAsInteger.withDefault(1));
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
  const rooms = useQuery({
    queryKey: ["registration-rooms"],
    queryFn: ({ signal }) => registrationApi.rooms(signal),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["registration-class", classId, page],
    queryFn: ({ signal }) =>
      registrationApi.class(classId!, Math.max(1, page), signal),
    enabled: !!classId,
    retry: false,
  });
  return { page, programs, teachers, rooms, detail };
}

/** Tạo lớp (`/manager/classes/new`, giữ nguyên) hoặc chi tiết lớp chia tab (`/manager/classes/[id]`). */
export function RegistrationClassEditor({ classId }: { classId?: string }) {
  return classId ? <ClassDetailHub classId={classId} /> : <ClassCreateView />;
}

function ClassCreateView() {
  const [programId] = useQueryState("programId", parseAsString.withDefault(""));
  const { programs, teachers, rooms } = useEditorData();
  return (
    <PageContainer>
      <PageHeader
        title="Tạo lớp học"
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
      <ApiFeedback error={rooms.error} retry={() => void rooms.refetch()} />
      <AsyncBoundary
        isLoading={programs.isPending}
        isError={programs.isError}
        error={programs.error}
        onRetry={() => void programs.refetch()}
      >
        <ClassDetailsForm
          programs={programs.data ?? []}
          teachers={teachers.data?.items ?? []}
          rooms={rooms.data ?? []}
          initialProgramId={programId}
        />
      </AsyncBoundary>
    </PageContainer>
  );
}

function classStatusBadge(classroom: RegistrationClass) {
  return classroom.isActive === false
    ? { label: "Ngừng hoạt động", variant: "secondary" as const }
    : classroom.isOpen
      ? { label: "Mở đăng ký", variant: "success" as const }
      : { label: "Đóng đăng ký", variant: "outline" as const };
}

function ClassDetailHub({ classId }: { classId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [{ tab }, setView] = useQueryStates({
    tab: parseAsStringLiteral(DETAIL_TAB_KEYS).withDefault("overview"),
    rosterPage: parseAsInteger,
  });
  const { page, programs, teachers, rooms, detail } = useEditorData(classId);
  const { names: teacherNames } = useTeacherNames();
  const classroom = detail.data;
  const sessions = useQuery({
    queryKey: ["registration-class", "sessions", classId],
    queryFn: ({ signal }) => curriculumApi.sessions(classId, signal),
    retry: false,
  });
  const units = useQuery({
    queryKey: ["curriculum", "units", classroom?.programId],
    queryFn: ({ signal }) => curriculumApi.units(classroom!.programId, signal),
    enabled: !!classroom,
    retry: false,
  });
  const classState = useClassStateMutation();
  const remove = useMutation({
    mutationFn: () =>
      apiRequest<unknown>(`classes/${encodeURIComponent(classId)}`, {
        method: "DELETE",
      }),
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["registration-classes"] });
      router.replace(ROUTES.MANAGER.CLASSES);
    },
  });
  const [changingTeacher, setChangingTeacher] = useState(false);
  const [confirming, setConfirming] = useState<"active" | "delete" | null>(
    null,
  );
  const status = classroom ? classStatusBadge(classroom) : null;
  const teacherName =
    classroom?.teacher?.displayName ||
    classroom?.teacher?.email ||
    (classroom?.teacherId
      ? (teacherNames.get(classroom.teacherId) ?? "Đã phân công")
      : "Chưa phân công giáo viên");
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title={classroom?.name ?? "Chi tiết lớp"}
        breadcrumbs={[
          { label: "Lớp học", href: ROUTES.MANAGER.CLASSES },
          { label: classroom?.name ?? "Chi tiết lớp" },
        ]}
        description={
          classroom
            ? [
                `${classroom.program.subject} · Khối ${classroom.program.grade}`,
                classroom.room?.name ?? "Chưa gán phòng",
                teacherName,
              ].join(" · ")
            : undefined
        }
        actions={
          classroom && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={
                  classState.isPending ||
                  (!classroom.isOpen && !canOpenRegistration(classroom))
                }
                isLoading={classState.isPending}
                onClick={() =>
                  classState.mutate({
                    id: classroom.id,
                    body: { isOpen: !classroom.isOpen },
                  })
                }
              >
                {classroom.isOpen ? "Đóng đăng ký" : "Mở đăng ký"}
              </Button>
              <RowActions
                items={[
                  {
                    id: "sessions",
                    label: "Giáo trình và buổi học",
                    onClick: () =>
                      router.push(ROUTES.MANAGER.CLASS_SESSIONS(classroom.id)),
                  },
                  {
                    id: "active",
                    label:
                      classroom.isActive === false
                        ? "Kích hoạt lớp"
                        : "Ngừng hoạt động",
                    onClick: () => setConfirming("active"),
                  },
                  "separator",
                  {
                    id: "delete",
                    label: "Xóa lớp chưa sử dụng",
                    danger: true,
                    onClick: () => setConfirming("delete"),
                  },
                ]}
              />
            </div>
          )
        }
      />
      {classroom && status && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-full",
              subjectDotClass(classroom.program.subject),
            )}
          />
          <Badge variant={status.variant}>{status.label}</Badge>
          {classroom.scheduleConfirmedAt && (
            <Badge variant="info">Lịch tuần đã xác nhận</Badge>
          )}
          {classroom.pendingTeacher && classroom.pendingTeacherFrom && (
            <Badge variant="warning">
              Đổi giáo viên từ {displayMoment(classroom.pendingTeacherFrom)}
            </Badge>
          )}
        </div>
      )}
      <ApiFeedback error={classState.error} />
      <ApiFeedback error={remove.error} />
      <ApiFeedback
        error={teachers.error}
        retry={() => void teachers.refetch()}
      />
      <ApiFeedback error={rooms.error} retry={() => void rooms.refetch()} />
      <AsyncBoundary
        isLoading={programs.isPending || detail.isPending}
        isError={programs.isError || detail.isError}
        error={programs.error ?? detail.error}
        onRetry={() => {
          void programs.refetch();
          void detail.refetch();
        }}
      >
        {classroom && (
          <>
            <Tabs
              value={tab}
              onValueChange={(value) => {
                const next = DETAIL_TAB_KEYS.find((key) => key === value);
                if (next) void setView({ tab: next });
              }}
            >
              <TabsList aria-label="Phần của lớp">
                {DETAIL_TAB_KEYS.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {DETAIL_TABS[key]}
                    {key === "students" && classroom.enrollments && (
                      <Badge variant="neutral" className="ml-1.5 h-5 px-2">
                        {classroom.enrollments.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {tab === "overview" && (
              <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-6">
                  <ClassDetailsForm
                    key={JSON.stringify([
                      classroom.id,
                      classroom.name,
                      classroom.teacherId,
                      classroom.capacity,
                      classroom.monthlyFee,
                      classroom.roomId,
                    ])}
                    classroom={classroom}
                    programs={programs.data ?? []}
                    teachers={teachers.data?.items ?? []}
                    rooms={rooms.data ?? []}
                    initialProgramId=""
                    onChangeTeacher={() => setChangingTeacher(true)}
                  />
                  <ClassSchedules classroom={classroom} />
                </div>
                <div className="min-w-0 space-y-6">
                  {classroom.enrollments && (
                    <RosterSummary
                      classroom={classroom}
                      onViewAll={() => void setView({ tab: "students" })}
                    />
                  )}
                  <ApiFeedback
                    error={sessions.error}
                    retry={() => void sessions.refetch()}
                  />
                  <ApiFeedback
                    error={units.error}
                    retry={() => void units.refetch()}
                  />
                  <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))]">
                    {!sessions.isError && (
                      <UpcomingSessions
                        classroom={classroom}
                        teacherNames={teacherNames}
                        sessions={sessions.data}
                        isPending={sessions.isPending}
                        onViewAll={() => void setView({ tab: "sessions" })}
                      />
                    )}
                    {!units.isError && !sessions.isError && (
                      <CurriculumProgress
                        units={units.data}
                        sessions={sessions.data}
                        isPending={units.isPending || sessions.isPending}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {tab === "students" && (
              <ClassRoster
                roster={classroom.enrollments}
                page={page}
                onPageChange={(value) => void setView({ rosterPage: value })}
              />
            )}
            {tab === "sessions" && (
              <ClassSessionsPanel
                classroom={classroom}
                teacherNames={teacherNames}
                sessions={sessions.data}
                isPending={sessions.isPending}
                isError={sessions.isError}
                error={sessions.error}
                onRetry={() => void sessions.refetch()}
              />
            )}
          </>
        )}
      </AsyncBoundary>
      <Dialog open={changingTeacher} onOpenChange={setChangingTeacher}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đổi giáo viên từ ngày hiệu lực</DialogTitle>
            <DialogDescription>
              Các buổi đang lên lịch từ thời điểm hiệu lực chuyển cho giáo viên
              mới; buổi trước đó giữ giáo viên cũ.
            </DialogDescription>
          </DialogHeader>
          {classroom && changingTeacher && (
            <TeacherAssignmentForm
              classroom={classroom}
              teachers={teachers.data?.items ?? []}
              onDone={() => setChangingTeacher(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming === "active"}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title={
          classroom?.isActive === false
            ? "Kích hoạt lại lớp?"
            : "Ngừng hoạt động lớp?"
        }
        description={
          classroom?.isActive === false
            ? "Lớp hoạt động trở lại; mở đăng ký riêng khi sẵn sàng."
            : "Lớp ngừng hoạt động sẽ không nhận đăng ký và không hiện trong lớp đang mở."
        }
        confirmText={
          classroom?.isActive === false ? "Kích hoạt lớp" : "Ngừng hoạt động"
        }
        variant={classroom?.isActive === false ? "default" : "danger"}
        isLoading={classState.isPending}
        onConfirm={async () => {
          if (!classroom) return;
          try {
            await classState.mutateAsync({
              id: classroom.id,
              body: { isActive: classroom.isActive === false },
            });
          } catch {
            /* Lỗi hiện ở ApiFeedback dưới đầu trang. */
          }
        }}
      />
      <ConfirmDialog
        open={confirming === "delete"}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title="Xóa lớp học?"
        description="Chỉ xóa lớp chưa có ghi danh, đăng ký hoặc buổi học."
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync();
          } catch {
            /* Lỗi hiện ở ApiFeedback dưới đầu trang. */
          }
        }}
      />
    </PageContainer>
  );
}

function ClassDetailsForm({
  classroom,
  programs,
  teachers,
  rooms,
  initialProgramId,
  onChangeTeacher,
}: {
  classroom?: RegistrationClass;
  programs: RegistrationProgram[];
  teachers: AcademicTeacher[];
  rooms: RoomRecord[];
  initialProgramId: string;
  onChangeTeacher?: () => void;
}) {
  const router = useRouter(),
    qc = useQueryClient();
  const form = useForm<RegistrationClassInput>({
    resolver: zodResolver(registrationClassSchema),
    defaultValues: {
      programId: classroom?.programId ?? initialProgramId,
      name: classroom?.name ?? "",
      teacherId: classroom?.teacherId ?? "",
      roomId: classroom?.roomId ?? "",
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
    mutationFn: ({
      programId,
      teacherId,
      roomId,
      ...fields
    }: RegistrationClassInput) =>
      apiRequest<RegistrationClass>(
        classroom ? "classes/" + classroom.id : "classes",
        {
          method: classroom ? "PATCH" : "POST",
          body: classroom
            ? {
                ...fields,
                teacherId: teacherId || null,
                // Send the room only when it changes: BE re-validates the chosen room.
                ...((roomId || null) !== (classroom.roomId ?? null)
                  ? { roomId: roomId || null }
                  : {}),
              }
            : {
                ...fields,
                programId,
                ...(teacherId ? { teacherId } : {}),
                ...(roomId ? { roomId } : {}),
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
  // Inactive rooms stay listed only when the class already uses them.
  const roomChoices = rooms.filter(
    (room) => room.isActive || room.id === classroom?.roomId,
  );
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
        <CardTitle>Thông tin lớp</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
        >
          <div className={cn("grid gap-4", !classroom && "sm:grid-cols-2")}>
            <div className={cn("space-y-2", !classroom && "sm:col-span-2")}>
              <Label htmlFor={classroom ? undefined : "class-program"}>
                Khóa học
              </Label>
              {classroom ? (
                // Lớp đã tạo không đổi khóa được: hiện chữ để tên khóa dài vẫn đọc đủ trong cột hẹp.
                <p className="rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm">
                  {classroom.program.name} · {classroom.program.subject} · Khối{" "}
                  {classroom.program.grade}
                </p>
              ) : (
                <Controller
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <Select
                      disabled={save.isPending}
                      value={field.value || null}
                      items={choices.map((p) => ({
                        value: p.id,
                        label:
                          p.name + " · " + p.subject + " · Khối " + p.grade,
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
              )}
              <FieldError message={form.formState.errors.programId?.message} />
              {!choices.length && (
                <Link
                  href={`${ROUTES.MANAGER.CURRICULUM}?tab=programs`}
                  className="text-sm text-primary underline"
                >
                  Tạo khóa học trước
                </Link>
              )}
            </div>
            <div className={cn("space-y-2", !classroom && "sm:col-span-2")}>
              <Label htmlFor="class-name">Tên lớp</Label>
              <Input id="class-name" {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="class-fee">Học phí / tháng (VND)</Label>
                <Input
                  id="class-fee"
                  type="number"
                  min={0}
                  step={1000}
                  {...form.register("monthlyFee", { valueAsNumber: true })}
                />
                <FieldError
                  message={form.formState.errors.monthlyFee?.message}
                />
              </div>
            </div>
            <div className={cn("space-y-2", !classroom && "sm:col-span-2")}>
              <Label htmlFor="class-room">Phòng học</Label>
              <Controller
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    items={[
                      { value: "none", label: "Chưa chọn phòng" },
                      ...roomChoices.map((room) => ({
                        value: room.id,
                        label: roomLabel(room),
                      })),
                    ]}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger id="class-room">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Chưa chọn phòng</SelectItem>
                      {roomChoices.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {roomLabel(room)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Sức chứa phòng phải từ sĩ số lớp trở lên. Buổi học sinh mới dùng
                phòng của lớp.
              </p>
            </div>
            <div className={cn("space-y-2", !classroom && "sm:col-span-2")}>
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
              {classroom && onChangeTeacher ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Lớp đã có buổi học sắp tới: đổi theo ngày hiệu lực.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onChangeTeacher}
                  >
                    Đổi giáo viên…
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Có thể gán giáo viên sau khi tạo lớp.
                </p>
              )}
            </div>
          </div>
          <ApiFeedback error={save.error} />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={save.isPending}
              isLoading={save.isPending}
            >
              {classroom ? "Lưu thông tin lớp" : "Tạo lớp học"}
            </Button>
          </div>
        </form>
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
      {slots.data &&
        (classroom.scheduleLocked === true ? (
          <LockedSchedule classroom={classroom} slots={slots.data} />
        ) : (
          <ClassSchedulesForm
            key={JSON.stringify([
              slots.data,
              classroom.scheduleLocked,
              classroom.isOpen,
            ])}
            classroom={classroom}
            slots={slots.data}
          />
        ))}
    </AsyncBoundary>
  );
}

function weekdayName(weekday: number) {
  return weekday === 7 ? "Chủ nhật" : `Thứ ${weekday + 1}`;
}

/** Lịch tuần đã khóa: bảng gọn, mở khóa (khi giáo viên đã xác nhận) qua hộp thoại nhập lý do. */
function LockedSchedule({
  classroom,
  slots,
}: {
  classroom: RegistrationClass;
  slots: WeeklySchedule[];
}) {
  const [unlocking, setUnlocking] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Lịch cố định</CardTitle>
          <Badge variant="neutral">Đã khóa</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thứ</TableHead>
                <TableHead>Giờ học</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...slots]
                .sort(
                  (a, b) =>
                    a.weekday - b.weekday ||
                    a.startTime.localeCompare(b.startTime),
                )
                .map((slot) => (
                  <TableRow key={`${slot.weekday}-${slot.startTime}`}>
                    <TableCell>{weekdayName(slot.weekday)}</TableCell>
                    <TableCell className="tabular-nums">
                      {slot.startTime}–{slot.endTime}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          {classroom.scheduleConfirmedAt
            ? `Giáo viên xác nhận lịch lúc ${displayMoment(classroom.scheduleConfirmedAt)}, hoặc lớp đã có ghi danh / buổi học đã sinh. Đổi giờ một buổi thì làm trong Lịch học.`
            : "Lịch tuần đã khóa vì có ghi danh, học viên chuyển vào hoặc buổi học đã sinh. Đổi giờ một buổi thì làm trong Lịch học."}
        </p>
        {classroom.scheduleConfirmedAt && (
          <Button variant="outline" onClick={() => setUnlocking(true)}>
            Mở khóa để sửa…
          </Button>
        )}
      </CardContent>
      <Dialog open={unlocking} onOpenChange={setUnlocking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mở khóa xác nhận lịch</DialogTitle>
            <DialogDescription>
              Giáo viên cần xác nhận lại lịch tuần sau khi sửa.
            </DialogDescription>
          </DialogHeader>
          {unlocking && (
            <ApiForm
              schema={reasonSchema}
              fields={[
                { name: "reason", label: "Lý do mở khóa", type: "textarea" },
              ]}
              submitLabel="Mở khóa xác nhận lịch"
              successMessage={false}
              onSubmit={(value) =>
                registrationApi.unlockSchedule(classroom.id, {
                  confirmed: false,
                  reason: value.reason,
                })
              }
              onSuccess={() => {
                toast.success("Đã mở khóa xác nhận lịch.");
                setUnlocking(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
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
  const busy = save.isPending || edit.isPending || remove.isPending;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch cố định</CardTitle>
        <CardDescription>
          Giờ Việt Nam. Lưu toàn bộ lịch hoặc cập nhật từng khung giờ.
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
          <fieldset disabled={busy} className="space-y-4">
            {fields.fields.map((field, i) => (
              <div
                key={field.id}
                className="grid items-start gap-3 rounded-xl border border-border p-4 sm:grid-cols-3"
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
                          label: weekdayName(n),
                        }))}
                        onValueChange={(v) => day.onChange(Number(v))}
                      >
                        <SelectTrigger id={"schedule-day-" + i}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {weekdayName(n)}
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
                <div className="flex flex-wrap gap-2 sm:col-span-3">
                  {ids[i] && (
                    <Button
                      type="button"
                      size="sm"
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
                    size="sm"
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
            <div className="flex flex-wrap gap-2">
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
            </div>
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

function enrollmentLabel(
  row: NonNullable<RegistrationClass["enrollments"]>["items"][number],
  today: string,
) {
  if (row.status === "ENDED")
    return { label: "Đã kết thúc", variant: "secondary" as const };
  if (row.startDate && row.startDate.slice(0, 10) > today)
    return { label: "Chưa bắt đầu", variant: "info" as const };
  if (row.endDate && row.endDate.slice(0, 10) <= today)
    return { label: "Hết hạn", variant: "warning" as const };
  return { label: "Đang học", variant: "success" as const };
}

/** Năm học sinh đầu của danh sách đang học tại lớp; xem đủ ở tab Học sinh. */
function RosterSummary({
  classroom,
  onViewAll,
}: {
  classroom: RegistrationClass;
  onViewAll: () => void;
}) {
  const roster = classroom.enrollments;
  const today = todayInVietnam();
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            Học sinh đang học · {roster?.total ?? classroom.rosterCount ?? "—"}/
            {classroom.capacity}
          </CardTitle>
          <Button variant="link" size="sm" onClick={onViewAll}>
            Xem tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {roster?.items.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.items.slice(0, 5).map((row) => {
                  const label = enrollmentLabel(row, today);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-normal">
                        <span className="block font-medium">
                          {row.studentProfile.fullName}
                        </span>
                        {row.studentProfile.parentProfile && (
                          <span className="block text-xs text-muted-foreground">
                            PH{" "}
                            {[
                              row.studentProfile.parentProfile.user
                                .displayName ||
                                row.studentProfile.parentProfile.user.email,
                              row.studentProfile.parentProfile.phone,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.startDate
                          ? calendarDateLabel(row.startDate.slice(0, 10))
                          : "—"}{" "}
                        →{" "}
                        {row.endDate
                          ? calendarDateLabel(row.endDate.slice(0, 10))
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={label.variant}>{label.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có học sinh đang học tại lớp.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** "Thứ 3, 20/10" theo giờ Việt Nam. */
function sessionDay(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function sessionTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function sessionStatus(session: ScheduledSession) {
  return session.status === "CANCELLED"
    ? "cancelled"
    : session.status === "COMPLETED"
      ? "completed"
      : "scheduled";
}

/** Danh sách buổi chỉ trả `teacherId`; tên lấy từ danh sách giáo viên đang hoạt động. */
function sessionTeacher(session: ScheduledSession, names: Map<string, string>) {
  return session.teacher?.displayName ?? names.get(session.teacherId) ?? null;
}

function UpcomingSessions({
  classroom,
  teacherNames,
  sessions,
  isPending,
  onViewAll,
}: {
  classroom: RegistrationClass;
  teacherNames: Map<string, string>;
  sessions?: ScheduledSession[];
  isPending: boolean;
  onViewAll: () => void;
}) {
  const now = useCurrentTime();
  const upcoming = (sessions ?? [])
    .filter(
      (session) =>
        session.status === "SCHEDULED" && Date.parse(session.startsAt) > now,
    )
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 3);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Buổi sắp tới</CardTitle>
          <Button variant="link" size="sm" onClick={onViewAll}>
            Xem buổi học
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending && (
          <p className="text-sm text-muted-foreground">Đang tải buổi học…</p>
        )}
        {!isPending && !upcoming.length && (
          <p className="text-sm text-muted-foreground">
            Chưa có buổi sắp tới. Sinh lịch từ giáo trình đã duyệt.
          </p>
        )}
        {upcoming.map((session) => {
          const substitute = isSubstituteSession(session, classroom)
            ? (sessionTeacher(session, teacherNames) ?? "giáo viên khác")
            : null;
          return (
            <div
              key={session.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {sessionDay(session.startsAt)} ·{" "}
                  {sessionTime(session.startsAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.lesson?.title ?? "Chưa gắn bài"}
                  {substitute ? ` · dạy thay: ${substitute}` : ""}
                </p>
              </div>
              <StatusBadge category="session" status="scheduled" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** Giáo trình đang áp dụng của khóa (bản đã duyệt phủ hôm nay) và bản cho kỳ sau. */
function CurriculumProgress({
  units,
  sessions,
  isPending,
}: {
  units?: CurriculumUnit[];
  sessions?: ScheduledSession[];
  isPending: boolean;
}) {
  const today = todayInVietnam();
  const current = (units ?? []).find(
    (unit) =>
      unit.status === "APPROVED" &&
      unit.fromDate.slice(0, 10) <= today &&
      unit.toDate.slice(0, 10) >= today,
  );
  const next = (units ?? [])
    .filter(
      (unit) =>
        unit.status !== "ARCHIVED" && unit.fromDate.slice(0, 10) > today,
    )
    .sort((left, right) => left.fromDate.localeCompare(right.fromDate))[0];
  const lessons = current?._count?.lessons;
  const taught = current
    ? (sessions ?? []).filter(
        (session) =>
          session.status === "COMPLETED" &&
          session.lesson?.unitId === current.id,
      ).length
    : 0;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Giáo trình</CardTitle>
          {current && (
            <Button
              variant="link"
              size="sm"
              render={
                <Link href={ROUTES.MANAGER.CURRICULUM_UNIT(current.id)} />
              }
            >
              Xem
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isPending && (
          <p className="text-muted-foreground">Đang tải giáo trình…</p>
        )}
        {!isPending && !current && (
          <p className="text-muted-foreground">
            Khóa học chưa có giáo trình đã duyệt cho hôm nay.
          </p>
        )}
        {!isPending && current && (
          <div className="space-y-1.5">
            <p className="font-medium">{current.title}</p>
            <p className="text-xs text-muted-foreground">
              Phiên bản {current.version}
              {lessons !== undefined ? ` · ${lessons} bài` : ""} · tới{" "}
              {calendarDateLabel(current.toDate.slice(0, 10))} · đã dạy {taught}{" "}
              bài
            </p>
            {lessons !== undefined && (
              <Progress
                value={
                  lessons > 0
                    ? Math.min(100, Math.round((taught / lessons) * 100))
                    : 0
                }
                aria-label="Tiến độ giáo trình của lớp"
              />
            )}
          </div>
        )}
        {!isPending && (
          <div className="space-y-1">
            <p className="font-medium">
              {next ? `Kỳ sau: ${next.title}` : "Chưa có giáo trình kỳ sau"}
            </p>
            {next && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge
                  category="curriculum"
                  status={curriculumStage(next)}
                />
                {next._count?.lessons !== undefined && (
                  <span>{next._count.lessons} bài</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClassSessionsPanel({
  classroom,
  teacherNames,
  sessions,
  isPending,
  isError,
  error,
  onRetry,
}: {
  classroom: RegistrationClass;
  teacherNames: Map<string, string>;
  sessions?: ScheduledSession[];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const [{ sessionFilter, sessionsPage }, setFilters] = useQueryStates({
    sessionFilter:
      parseAsStringLiteral(SESSION_FILTER_KEYS).withDefault("upcoming"),
    sessionsPage: parseAsInteger.withDefault(1),
  });
  const now = useCurrentTime();
  const rows = (sessions ?? [])
    .filter((session) => {
      if (sessionFilter === "all") return true;
      const isPast = Date.parse(session.endsAt) <= now;
      return sessionFilter === "past" ? isPast : !isPast;
    })
    .sort((left, right) =>
      sessionFilter === "past"
        ? right.startsAt.localeCompare(left.startsAt)
        : left.startsAt.localeCompare(right.startsAt),
    );
  const start = (Math.max(1, sessionsPage) - 1) * SESSIONS_PAGE_SIZE;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={sessionFilter}
            onValueChange={(value) =>
              void setFilters({
                sessionFilter:
                  SESSION_FILTER_KEYS.find((key) => key === value) ?? null,
                sessionsPage: null,
              })
            }
          >
            <TabsList aria-label="Lọc buổi học">
              {SESSION_FILTER_KEYS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {SESSION_FILTERS[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            render={<Link href={ROUTES.MANAGER.CLASS_SESSIONS(classroom.id)} />}
          >
            Giáo trình và sinh lịch
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <AsyncBoundary
          isLoading={isPending}
          isError={isError}
          error={error}
          onRetry={onRetry}
          data={rows}
          emptyProps={{ title: "Chưa có buổi học phù hợp" }}
        >
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Bài</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .slice(start, start + SESSIONS_PAGE_SIZE)
                  .map((session) => {
                    const substitute = isSubstituteSession(session, classroom);
                    return (
                      <TableRow key={session.id}>
                        <TableCell>{sessionDay(session.startsAt)}</TableCell>
                        <TableCell className="tabular-nums">
                          {sessionTime(session.startsAt)}–
                          {sessionTime(session.endsAt)}
                        </TableCell>
                        <TableCell className="max-w-72 whitespace-normal">
                          {session.lesson?.title ?? "Chưa gắn bài"}
                        </TableCell>
                        <TableCell>
                          {sessionTeacher(session, teacherNames) ?? "—"}
                          {substitute && (
                            <Badge variant="warning" className="ml-2">
                              Dạy thay
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            category="session"
                            status={sessionStatus(session)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </AsyncBoundary>
        {sessions && (
          <TablePagination
            totalItems={rows.length}
            pageParamKey="sessionsPage"
            fixedPageSize={SESSIONS_PAGE_SIZE}
          />
        )}
      </CardContent>
    </Card>
  );
}

function roomLabel(room: RoomRecord) {
  return `${room.name} · ${room.capacity} chỗ${room.isActive ? "" : " (ngừng sử dụng)"}`;
}
const teacherAssignmentFormSchema = z.object({
  teacherId: requiredId,
  effectiveAt: localDateTimeSchema,
  reason: reasonSchema.shape.reason,
});
/** SRS §3.1, §5.4: the manager changes the class teacher from an effective time. */
function TeacherAssignmentForm({
  classroom,
  teachers,
  onDone,
}: {
  classroom: RegistrationClass;
  teachers: AcademicTeacher[];
  onDone: () => void;
}) {
  const options = teachers.filter(
    (teacher) => teacher.id !== classroom.teacherId,
  );
  return (
    <div className="space-y-4">
      {classroom.pendingTeacher && classroom.pendingTeacherFrom && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm">
            Phân công chờ:{" "}
            {classroom.pendingTeacher.displayName ??
              classroom.pendingTeacher.email}
            {" · "}Hiệu lực từ {displayMoment(classroom.pendingTeacherFrom)}
          </p>
          <ApiForm
            schema={confirmationSchema.extend({
              reason: reasonSchema.shape.reason,
            })}
            defaults={{ confirmed: false, reason: "" }}
            fields={[
              {
                name: "reason",
                label: "Lý do hủy phân công chờ",
                type: "textarea",
              },
              {
                name: "confirmed",
                label: "Xác nhận giữ giáo viên hiện tại",
                type: "checkbox",
              },
            ]}
            submitLabel="Hủy phân công chờ"
            successMessage={false}
            onSubmit={(value) =>
              registrationApi.assignTeacher(classroom.id, {
                teacherId: classroom.teacherId,
                effectiveAt: new Date().toISOString(),
                reason: value.reason,
              })
            }
            onSuccess={() => {
              toast.success("Đã hủy phân công chờ.");
              onDone();
            }}
          />
        </div>
      )}
      <ApiForm
        key={`${classroom.teacherId}-${classroom.pendingTeacherFrom ?? "none"}`}
        schema={teacherAssignmentFormSchema}
        fields={[
          {
            name: "teacherId",
            label: "Giáo viên mới",
            type: "select",
            options: options.map((teacher) => ({
              value: teacher.id,
              label: teacher.displayName ?? teacher.email,
            })),
          },
          {
            name: "effectiveAt",
            label: "Hiệu lực từ (giờ Việt Nam)",
            type: "datetime-local",
          },
          { name: "reason", label: "Lý do", type: "textarea" },
        ]}
        submitLabel="Đổi giáo viên"
        successMessage={false}
        onSubmit={(value) =>
          registrationApi.assignTeacher(classroom.id, {
            ...value,
            effectiveAt: vietnamDateTime(String(value.effectiveAt)),
          })
        }
        onSuccess={() => {
          toast.success("Đã lưu phân công giáo viên theo ngày hiệu lực.");
          onDone();
        }}
      />
    </div>
  );
}
