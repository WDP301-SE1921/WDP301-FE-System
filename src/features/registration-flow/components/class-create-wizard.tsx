"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import { TimeInput } from "@/components/shared/pickers/time-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { userFacingMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";
import type { RegistrationProgram } from "@/types/backend";
import { curriculumApi } from "@/features/curriculum/api";
import { outcomeApi } from "@/features/outcomes/api";
import { todayInVietnam } from "@/lib/calendar-date";
import { registrationApi } from "../api";
import { useClassStateMutation } from "../class-state";
import {
  defaultEndTime,
  findConflicts,
  rankTeachers,
  suggestClassName,
} from "../class-create-plan";
import { nextScheduleRange } from "../program-setup";
import {
  classWizardSchema,
  schedulesSchema,
  type ClassWizardInput,
} from "../schemas";
import { ApiFeedback, FieldError } from "./api-feedback";
import { MoneyInput } from "./money-input";
import { NumberStepper } from "./number-stepper";
import {
  WizardCurriculumSummary,
  WizardSessionsStep,
} from "./class-wizard-schedule";

/** Id thẻ "Lịch cố định" ở trang lớp (`class-editor.tsx`), dùng làm neo `#`. */
const WEEKLY_SCHEDULE_HASH = "class-weekly-schedule";
const STEPS = [
  "Thông tin",
  "Lịch mỗi tuần",
  "Giáo viên & phòng",
  "Giáo trình & mục tiêu",
  "Lịch học",
] as const;
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
/** Thứ gợi ý cho các dòng lịch mới: cách đều trong tuần (T2, T4, T6, T3…). */
const DEFAULT_WEEKDAYS = [1, 3, 5, 2, 4, 6, 7];
const DEFAULT_START = "18:00";
const NONE = "";

type Step = 1 | 2 | 3 | 4 | 5 | "done";
interface RowErrors {
  startTime?: { message?: string };
  endTime?: { message?: string };
}

function defaultRows(count: number): ClassWizardInput["schedules"] {
  return Array.from({ length: count }, (_, index) => ({
    weekday: DEFAULT_WEEKDAYS[index % DEFAULT_WEEKDAYS.length],
    startTime: DEFAULT_START,
    endTime: defaultEndTime(DEFAULT_START),
  }));
}

const dayName = (weekday: number) =>
  weekday === 7 ? "Chủ nhật" : `Thứ ${weekday + 1}`;

/**
 * Tạo lớp trong 5 bước: thông tin, lịch tuần, giáo viên và phòng (bấm "Tạo lớp" ở đây), giáo trình
 * và mục tiêu của khóa, rồi lịch học tự xem trước cả kỳ và tạo bằng một nút. Lớp luôn được tạo ở
 * trạng thái đóng đăng ký (`isOpen: false`), lịch tuần lưu ngay sau đó; màn cuối cho mở đăng ký luôn.
 */
export function ClassCreateWizard() {
  const router = useRouter();
  const client = useQueryClient();
  const [initialProgramId] = useQueryState(
    "programId",
    parseAsString.withDefault(""),
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
  const rooms = useQuery({
    queryKey: ["registration-rooms"],
    queryFn: ({ signal }) => registrationApi.rooms(signal),
    retry: false,
  });
  // Mọi lớp (đọc hết trang): tính "đang dạy", trùng giờ và gợi ý tên lớp.
  const classes = useQuery({
    queryKey: ["registration-classes", "wizard"],
    queryFn: () => registrationApi.classes(),
    retry: false,
  });

  const [step, setStep] = useState<Step>(1);
  const [generated, setGenerated] = useState<number | null>(null);
  const [nameEdited, setNameEdited] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(
    null,
  );
  // Lớp đã tạo trong lần bấm này: bấm lại chỉ thử lưu lịch, không tạo lớp thứ hai.
  const createdRef = useRef<{ id: string; name: string } | null>(null);
  const rowsFor = useRef("");

  const form = useForm<ClassWizardInput>({
    resolver: zodResolver(classWizardSchema),
    defaultValues: {
      programId: initialProgramId,
      name: "",
      capacity: 20,
      monthlyFee: Number.NaN,
      teacherId: NONE,
      roomId: NONE,
      schedules: [],
    },
  });
  const rows = useFieldArray({ control: form.control, name: "schedules" });
  const [programId, capacity, teacherId, roomId, schedules] = useWatch({
    control: form.control,
    name: ["programId", "capacity", "teacherId", "roomId", "schedules"],
  });

  const programChoices = (programs.data ?? []).filter(
    (program) => program.isActive !== false,
  );
  const program = programChoices.find((item) => item.id === programId);
  // Giáo trình và mục tiêu đi theo khóa: bước 4 cho xem, bước 5 tạo lịch theo giáo trình đã duyệt.
  const units = useQuery({
    queryKey: ["curriculum", "units", programId],
    queryFn: ({ signal }) => curriculumApi.units(programId, signal),
    enabled: !!programId,
    retry: false,
  });
  const sets = useQuery({
    queryKey: ["outcome-sets", programId],
    queryFn: ({ signal }) => outcomeApi.sets(programId, signal),
    enabled: !!programId,
    retry: false,
  });
  const scheduleRange = units.data
    ? nextScheduleRange(units.data, todayInVietnam())
    : null;
  const perWeek = program?.sessionsPerWeek ?? null;
  const allClasses = classes.data ?? [];

  // Tên gợi ý theo khóa; ngừng tự điền khi người dùng sửa tay.
  useEffect(() => {
    if (nameEdited || !program || !classes.data) return;
    const siblings = classes.data
      .filter((classroom) => classroom.programId === program.id)
      .map((classroom) => classroom.name);
    form.setValue("name", suggestClassName(program.name, siblings), {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [program, classes.data, nameEdited, form]);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["registration-classes"] });
    void client.invalidateQueries({ queryKey: ["registration-class"] });
    void client.invalidateQueries({ queryKey: ["academic-program"] });
    void client.invalidateQueries({ queryKey: ["registration-programs"] });
  };
  const createClass = useMutation({
    mutationFn: async (values: ClassWizardInput) => {
      let target = createdRef.current;
      if (!target) {
        const classroom = await registrationApi.createClass({
          programId: values.programId,
          name: values.name,
          capacity: values.capacity,
          monthlyFee: values.monthlyFee,
          ...(values.teacherId ? { teacherId: values.teacherId } : {}),
          ...(values.roomId ? { roomId: values.roomId } : {}),
        });
        target = { id: classroom.id, name: classroom.name };
        createdRef.current = target;
        setCreated(target);
      }
      const classId = target.id;
      try {
        await registrationApi.saveSchedules(classId, {
          schedules: values.schedules,
        });
      } catch (error) {
        // Lớp đã có: đưa người dùng tới thẻ "Lịch cố định" để lưu lại.
        const message = userFacingMessage(error);
        toast.error(
          `Đã tạo lớp nhưng chưa lưu được lịch: ${message} Lớp chưa mở đăng ký.`,
        );
        router.replace(
          `${ROUTES.MANAGER.CLASS_DETAIL(classId)}#${WEEKLY_SCHEDULE_HASH}`,
        );
        return null;
      } finally {
        refresh();
      }
      return target;
    },
    retry: false,
    onSuccess: (target) => {
      if (target) setStep(4);
    },
  });

  const goStep2 = async () => {
    const ok = await form.trigger([
      "programId",
      "name",
      "capacity",
      "monthlyFee",
    ]);
    if (!ok || !program) return;
    // Phòng đã chọn mà nhỏ hơn sĩ số mới thì bỏ chọn, để khỏi gửi phòng không hợp lệ.
    const room = (rooms.data ?? []).find(
      (item) => item.id === form.getValues("roomId"),
    );
    if (room && room.capacity < form.getValues("capacity"))
      form.setValue("roomId", NONE);
    const key = `${program.id}:${perWeek}`;
    if (perWeek && rowsFor.current !== key) {
      rows.replace(defaultRows(perWeek));
      rowsFor.current = key;
    }
    setStep(2);
  };

  const goStep3 = () => {
    const current = form.getValues("schedules");
    form.clearErrors("schedules");
    const parsed = schedulesSchema.safeParse({ schedules: current });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [, index, field] = issue.path;
        if (typeof index === "number" && typeof field === "string")
          form.setError(
            `schedules.${index}.${field}` as `schedules.${number}.startTime`,
            {
              message: issue.message,
            },
          );
      }
      return;
    }
    if (!perWeek || current.length !== perWeek) {
      form.setError("schedules", {
        message: `Khóa cần đúng ${perWeek ?? "?"} buổi mỗi tuần.`,
      });
      return;
    }
    setStep(3);
  };

  const ranked = rankTeachers(
    teachers.data?.items ?? [],
    allClasses,
    program ?? null,
  );
  const activeRooms = (rooms.data ?? []).filter((room) => room.isActive);
  const conflicts = classes.data
    ? findConflicts(schedules ?? [], allClasses, {
        teacherId: teacherId || undefined,
        roomId: roomId || undefined,
      })
    : [];

  const reset = () => {
    createdRef.current = null;
    rowsFor.current = "";
    setCreated(null);
    setGenerated(null);
    setNameEdited(false);
    createClass.reset();
    form.reset({
      programId: form.getValues("programId"),
      name: "",
      capacity: 20,
      monthlyFee: Number.NaN,
      teacherId: NONE,
      roomId: NONE,
      schedules: [],
    });
    setStep(1);
  };

  if (step === "done" && created)
    return (
      <WizardDone
        created={created}
        generated={generated}
        onAnother={reset}
        onOpenView={() => router.push(ROUTES.MANAGER.CLASS_DETAIL(created.id))}
      />
    );

  return (
    <AsyncBoundary
      isLoading={programs.isPending}
      isError={programs.isError}
      error={programs.error}
      onRetry={() => void programs.refetch()}
    >
      <Card>
        <CardHeader className="space-y-3">
          <ol
            className="flex flex-wrap items-center gap-2 text-sm"
            aria-label="Các bước"
          >
            {STEPS.map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const passed = typeof step === "number" && number < step;
              return (
                <li
                  key={label}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-1.5",
                    active
                      ? "border-primary bg-primary/5 font-medium"
                      : passed
                        ? "border-border"
                        : "border-border text-muted-foreground",
                  )}
                >
                  <span className="tabular-nums">{number}</span>
                  {label}
                </li>
              );
            })}
          </ol>
          <CardTitle>
            {step === 1 && "Thông tin lớp"}
            {step === 2 && "Lịch học mỗi tuần"}
            {step === 3 && "Giáo viên và phòng học"}
            {step === 4 &&
              `Đã tạo lớp ${created?.name ?? ""}. Giáo trình và mục tiêu của lớp`}
            {step === 5 && "Lịch học của lớp"}
          </CardTitle>
          {step === 2 && perWeek && (
            <CardDescription>
              Mỗi tuần học {perWeek} buổi. Giờ Việt Nam.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => createClass.mutate(values))}
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wizard-program">Khóa học</Label>
                  <Controller
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <Select
                        value={field.value || null}
                        items={programChoices.map((item) => ({
                          value: item.id,
                          label: programLabel(item),
                        }))}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="wizard-program">
                          <SelectValue placeholder="Chọn khóa học" />
                        </SelectTrigger>
                        <SelectContent>
                          {programChoices.map((item) => (
                            <SelectItem value={item.id} key={item.id}>
                              {programLabel(item)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError
                    message={form.formState.errors.programId?.message}
                  />
                  {!programChoices.length && (
                    <Link
                      href={`${ROUTES.MANAGER.CURRICULUM}?tab=programs`}
                      className="text-sm text-primary underline"
                    >
                      Tạo khóa học trước
                    </Link>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-name">Tên lớp</Label>
                  <Input
                    id="wizard-name"
                    {...form.register("name", {
                      onChange: () => setNameEdited(true),
                    })}
                  />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p
                      id="wizard-capacity-label"
                      className="text-sm font-medium"
                    >
                      Sĩ số tối đa
                    </p>
                    <Controller
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <NumberStepper
                          labelId="wizard-capacity-label"
                          value={field.value}
                          onChange={field.onChange}
                          min={1}
                          max={1000}
                          startValue={20}
                          format={(value) => `${value} học sinh`}
                          emptyText="Chưa đặt"
                          decreaseLabel="Giảm sĩ số"
                          increaseLabel="Tăng sĩ số"
                        />
                      )}
                    />
                    <FieldError
                      message={form.formState.errors.capacity?.message}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-fee">Học phí / tháng (VND)</Label>
                    <Controller
                      control={form.control}
                      name="monthlyFee"
                      render={({ field, fieldState }) => (
                        <MoneyInput
                          id="wizard-fee"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          inputRef={field.ref}
                          invalid={!!fieldState.error}
                          errorId="wizard-fee-error"
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nhập 0 nếu lớp không thu học phí.
                    </p>
                    <div id="wizard-fee-error">
                      <FieldError
                        message={form.formState.errors.monthlyFee?.message}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <ScheduleStep
                program={program}
                perWeek={perWeek}
                form={form}
                fieldCount={rows.fields.length}
                errors={{
                  message: form.formState.errors.schedules?.message,
                  rows:
                    (form.formState.errors.schedules as
                      RowErrors[] | undefined) ?? [],
                }}
              />
            )}

            {step === 3 && (
              <div className="space-y-5">
                <ApiFeedback
                  error={teachers.error}
                  retry={() => void teachers.refetch()}
                />
                <ApiFeedback
                  error={rooms.error}
                  retry={() => void rooms.refetch()}
                />
                {classes.isError && (
                  <Alert variant="warning">
                    <AlertTitle>Chưa kiểm tra được trùng giờ</AlertTitle>
                    <AlertDescription>
                      Không tải được danh sách lớp nên chưa biết giáo viên đang
                      dạy lớp nào.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void classes.refetch()}
                      >
                        Thử lại
                      </button>
                    </AlertDescription>
                  </Alert>
                )}
                <Controller
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <ChoiceCards
                      legend="Giáo viên phụ trách"
                      value={field.value}
                      onChange={field.onChange}
                      columns={2}
                      options={[
                        {
                          value: NONE,
                          label: "Chưa chọn giáo viên",
                          description:
                            "Gán sau ở trang lớp. Chưa có giáo viên thì chưa tạo được lịch học.",
                        },
                        ...ranked.map(({ teacher, teaching, sameSubject }) => ({
                          value: teacher.id,
                          label: teacher.displayName || teacher.email,
                          description: teaching.length
                            ? `${sameSubject ? "Cùng môn · " : ""}Đang dạy: ${teaching
                                .map((item) => item.name)
                                .join(", ")}`
                            : "Chưa dạy lớp nào",
                        })),
                      ]}
                    />
                  )}
                />
                {!ranked.length && !teachers.isPending && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có giáo viên nào. Bạn có thể tạo lớp trước và gán sau.
                  </p>
                )}
                <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                  <p>
                    Chưa có giáo viên cần chọn? Mở trang Nhân sự ở tab mới, tạo
                    xong quay lại đây rồi bấm Tải lại danh sách.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      render={
                        <a
                          href={ROUTES.MANAGER.PEOPLE}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      Tạo tài khoản giáo viên
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={teachers.isFetching}
                      onClick={() => void teachers.refetch()}
                    >
                      Tải lại danh sách
                    </Button>
                  </div>
                </div>
                <Controller
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <ChoiceCards
                      legend="Phòng học"
                      value={field.value}
                      onChange={field.onChange}
                      columns={2}
                      options={[
                        {
                          value: NONE,
                          label: "Chưa chọn phòng",
                          description: "Chọn phòng sau ở trang lớp.",
                        },
                        ...activeRooms.map((room) => {
                          const tooSmall = room.capacity < capacity;
                          return {
                            value: room.id,
                            label: `${room.name} · chứa ${room.capacity} người`,
                            disabled: tooSmall,
                            description: tooSmall
                              ? `Phòng chỉ chứa ${room.capacity}, lớp ${capacity}.`
                              : undefined,
                          };
                        }),
                      ]}
                    />
                  )}
                />
                {!activeRooms.length && !rooms.isPending && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có phòng học nào đang dùng. Bạn có thể tạo lớp trước và
                    chọn phòng sau.
                  </p>
                )}
                {conflicts.length > 0 && (
                  <Alert variant="warning">
                    <AlertTitle>Có thể bị trùng giờ</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5">
                        {conflicts.map((conflict, index) => (
                          <li key={index}>
                            {conflict.kind === "teacher"
                              ? "Giáo viên"
                              : "Phòng"}{" "}
                            đã có lớp {conflict.className} vào{" "}
                            {dayName(conflict.weekday)} {conflict.startTime}–
                            {conflict.endTime}.
                          </li>
                        ))}
                      </ul>
                      Bạn vẫn tạo lớp được; hệ thống sẽ kiểm tra lại khi lưu.
                    </AlertDescription>
                  </Alert>
                )}
                <ApiFeedback error={createClass.error} />
              </div>
            )}

            {step === 4 && created && (
              <div className="space-y-5">
                <ApiFeedback
                  error={units.error}
                  retry={() => void units.refetch()}
                />
                <ApiFeedback
                  error={sets.error}
                  retry={() => void sets.refetch()}
                />
                {units.isPending || sets.isPending ? (
                  <p role="status" className="text-sm">
                    Đang tải giáo trình và mục tiêu của khóa…
                  </p>
                ) : (
                  units.data && (
                    <WizardCurriculumSummary
                      units={units.data}
                      sets={sets.data ?? []}
                      range={scheduleRange}
                    />
                  )
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    disabled={!units.data}
                    onClick={() => setStep(5)}
                  >
                    Tiếp: lịch học
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && created && (
              <WizardSessionsStep
                classId={created.id}
                hasTeacher={!!teacherId}
                range={scheduleRange}
                onBack={() => setStep(4)}
                onFinish={(count) => {
                  setGenerated(count);
                  setStep("done");
                }}
              />
            )}

            {typeof step === "number" && step <= 3 && (
              <div className="flex flex-wrap justify-between gap-2">
                {step === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    render={<Link href={ROUTES.MANAGER.CLASSES} />}
                  >
                    Danh sách lớp
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={createClass.isPending}
                    onClick={() => setStep(step === 3 ? 2 : 1)}
                  >
                    Quay lại
                  </Button>
                )}
                {step === 1 && (
                  <Button type="button" onClick={() => void goStep2()}>
                    Tiếp: lịch mỗi tuần
                  </Button>
                )}
                {step === 2 && (
                  <Button type="button" disabled={!perWeek} onClick={goStep3}>
                    Tiếp: giáo viên và phòng
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    type="submit"
                    disabled={createClass.isPending}
                    isLoading={createClass.isPending}
                  >
                    Tạo lớp
                  </Button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </AsyncBoundary>
  );
}

function programLabel(program: RegistrationProgram) {
  return `${program.name} · ${program.subject} · Khối ${program.grade}`;
}

function ScheduleStep({
  program,
  perWeek,
  form,
  fieldCount,
  errors,
}: {
  program: RegistrationProgram | undefined;
  perWeek: number | null;
  form: ReturnType<typeof useForm<ClassWizardInput>>;
  fieldCount: number;
  errors: { message?: string; rows: (RowErrors | undefined)[] };
}) {
  if (!program) return null;
  if (!perWeek)
    return (
      <Alert variant="warning">
        <AlertTitle>
          Khóa này chưa có số buổi mỗi tuần, chưa xếp lịch được.
        </AlertTitle>
        <AlertDescription>
          <Link
            className="underline"
            href={`${ROUTES.MANAGER.CURRICULUM}?tab=programs&editProgram=${encodeURIComponent(program.id)}&returnTo=${encodeURIComponent(ROUTES.MANAGER.CLASS_NEW + "?programId=" + program.id)}`}
          >
            Sửa khóa học để đặt số buổi mỗi tuần
          </Link>
        </AlertDescription>
      </Alert>
    );
  return (
    <div className="space-y-4">
      {Array.from({ length: fieldCount }, (_, index) => (
        <ScheduleRow
          key={index}
          index={index}
          form={form}
          errors={errors.rows[index]}
        />
      ))}
      <FieldError message={errors.message} />
    </div>
  );
}

function ScheduleRow({
  index,
  form,
  errors,
}: {
  index: number;
  form: ReturnType<typeof useForm<ClassWizardInput>>;
  errors: RowErrors | undefined;
}) {
  const { control, setValue } = form;
  const slot = useWatch({ control, name: `schedules.${index}` });
  if (!slot) return null;
  const setStart = (value: string) => {
    setValue(`schedules.${index}.startTime`, value, { shouldDirty: true });
    const end = defaultEndTime(value);
    if (end) setValue(`schedules.${index}.endTime`, end, { shouldDirty: true });
    form.clearErrors(`schedules.${index}`);
  };
  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-medium">Buổi {index + 1}</legend>
      <div
        role="group"
        aria-label={`Thứ học của buổi ${index + 1}`}
        className="flex flex-wrap gap-2"
      >
        {DAY_LABELS.map((label, dayIndex) => {
          const weekday = dayIndex + 1;
          return (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={slot.weekday === weekday ? "default" : "outline"}
              aria-pressed={slot.weekday === weekday}
              aria-label={dayName(weekday)}
              onClick={() => {
                setValue(`schedules.${index}.weekday`, weekday, {
                  shouldDirty: true,
                });
                form.clearErrors(`schedules.${index}`);
              }}
            >
              {label}
            </Button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`wizard-start-${index}`}>Giờ bắt đầu</Label>
          <TimeInput
            id={`wizard-start-${index}`}
            value={slot.startTime}
            invalid={!!errors?.startTime}
            onChange={setStart}
          />
          <FieldError message={errors?.startTime?.message} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`wizard-end-${index}`}>Giờ kết thúc</Label>
          <TimeInput
            id={`wizard-end-${index}`}
            value={slot.endTime}
            invalid={!!errors?.endTime}
            onChange={(value) =>
              setValue(`schedules.${index}.endTime`, value, {
                shouldDirty: true,
              })
            }
          />
          <FieldError message={errors?.endTime?.message} />
        </div>
      </div>
    </fieldset>
  );
}

function WizardDone({
  created,
  generated,
  onAnother,
  onOpenView,
}: {
  created: { id: string; name: string };
  /** Số buổi đã tạo ở bước 5; null khi để tạo lịch sau. */
  generated: number | null;
  onAnother: () => void;
  onOpenView: () => void;
}) {
  const state = useClassStateMutation();
  const opened = state.isSuccess;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {opened
            ? `Đã tạo lớp ${created.name}, đang mở đăng ký.`
            : `Đã tạo lớp ${created.name}, đang đóng đăng ký.`}
        </CardTitle>
        <CardDescription>
          {opened
            ? "Nhân viên đã ghi danh được học sinh vào lớp này."
            : "Mở đăng ký khi lớp đã sẵn sàng nhận học sinh."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {generated ? (
          <p role="status" className="text-sm">
            Đã tạo {generated} buổi học theo giáo trình. Học sinh được ghi danh
            sẽ thấy lịch trên ứng dụng của phụ huynh.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Lớp chưa có buổi học nào. Bấm “Tạo lịch học” để xếp buổi theo giáo
            trình đã duyệt; phụ huynh chỉ thấy buổi học trên ứng dụng sau khi
            lịch được tạo.
          </p>
        )}
        <ApiFeedback error={state.error} />
        {state.isError && (
          <p className="text-sm text-muted-foreground">
            Mở “Xem lớp” để xem lớp còn thiếu gì (giáo viên, lịch học) rồi mở
            đăng ký ở đó.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!opened && (
            <Button
              isLoading={state.isPending}
              onClick={() =>
                state.mutate(
                  { id: created.id, body: { isOpen: true } },
                  { onSuccess: () => toast.success("Đã mở đăng ký.") },
                )
              }
            >
              Mở đăng ký ngay
            </Button>
          )}
          {!generated && (
            <Button
              variant="outline"
              render={<Link href={ROUTES.MANAGER.CLASS_SESSIONS(created.id)} />}
            >
              Tạo lịch học
            </Button>
          )}
          <Button variant="outline" onClick={onOpenView}>
            Xem lớp
          </Button>
          <Button variant="outline" onClick={onAnother}>
            Tạo lớp khác
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
