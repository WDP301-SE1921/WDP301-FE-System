"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { WizardLayout } from "@/components/shared/workflows/wizard-layout";
import { toast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/hooks/use-current-role";
import { registrationApi } from "../api";
import {
  addCalendarMonths,
  dateOnly,
  displayDate,
  isoWeekday,
  money,
  nextStudyDate,
  scheduleText,
  todayInVietnam,
} from "../calendar";
import {
  registrationSchema,
  type RegistrationInput,
} from "../schemas";
import {
  getPaymentAttempt,
  readPaymentAttempt,
  rememberRegistration,
} from "../storage";
import { ApiFeedback, FieldError, SELECT_CLASS } from "./api-feedback";
import { RegistrationReceipt } from "./registration-receipt";
import { ParentEmailSearch } from "./parent-email-search";

const STEPS = [
  { id: "parent", label: "Phụ huynh", description: "Tìm và chọn tài khoản" },
  { id: "child", label: "Hồ sơ con", description: "Chọn con đã có hồ sơ" },
  {
    id: "class",
    label: "Lớp & kỳ học",
    description: "Môn, lớp, ngày và gói tháng",
  },
  {
    id: "payment",
    label: "Thu học phí",
    description: "Xác nhận đã thu đủ tiền",
  },
  { id: "done", label: "Hoàn tất", description: "Xem và in biên lai" },
];
const EMPTY: RegistrationInput = {
  targetStudentId: "",
  subject: "",
  classId: "",
  startDate: "",
  packageMonths: 3,
  hasReceivedPayment: false,
  receiptNumber: "",
};

export function RegistrationWizard() {
  const router = useRouter();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const busy = useRef(false);
  const [requestedStep, setStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(0),
  );
  const [registrationId, setRegistrationId] = useQueryState(
    "registrationId",
    parseAsString,
  );
  const [emailParam, setEmailParam] = useQueryState("email", parseAsString.withDefault(""));
  const [studentIdParam] = useQueryState("studentId", parseAsString);
  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: EMPTY,
  });
  const values = useWatch({ control: form.control }) as RegistrationInput;
  const lookup = useMutation({
    mutationFn: (email: string) => registrationApi.lookup(email),
    retry: false,
  });
  const parent = lookup.data;
  const parentReady = parent?.status === "ACTIVE" && !!parent.emailVerifiedAt;
  const students =
    parent?.parentProfile?.students.filter(
      (child) => child.status === "ACTIVE",
    ) ?? [];
  const child = students.find((entry) => entry.id === values.targetStudentId);
  const programs = useQuery({
    queryKey: ["registration-programs"],
    queryFn: registrationApi.programs,
    enabled: !!child,
    retry: false,
  });
  const subjects = [
    ...new Set(
      programs.data
        ?.filter((program) => program.grade === child?.grade)
        .map((program) => program.subject) ?? [],
    ),
  ];
  const classes = useQuery({
    queryKey: ["registration-classes", child?.id, values.subject],
    queryFn: () =>
      registrationApi.classes({
        studentId: child!.id,
        subject: values.subject,
      }),
    enabled: !!child && !!values.subject,
    retry: false,
  });
  const selectedClass = classes.data?.find(
    (item) => item.id === values.classId,
  );
  const order = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: () => registrationApi.get(registrationId!),
    enabled: !!registrationId,
    retry: false,
    staleTime: 0,
  });
  const receipt = useQuery({
    queryKey: ["registration-receipt", registrationId],
    queryFn: () => registrationApi.receipt(registrationId!),
    enabled: !!registrationId && order.data?.status === "COMPLETED",
    retry: false,
  });
  const draft = useMutation({
    mutationFn: registrationApi.draft,
    retry: false,
  });
  const cancel = useMutation({
    mutationFn: registrationApi.cancel,
    retry: false,
  });
  const confirm = useMutation({
    mutationFn: async () => {
      if (!user || !registrationId)
        throw new Error(
          "Vui lòng đăng nhập và mở bản nháp trước khi thu tiền.",
        );
      const attempt = getPaymentAttempt(
        user.id,
        registrationId,
        form.getValues("receiptNumber"),
      );
      return registrationApi.confirm(registrationId, attempt.key, attempt.body);
    },
    retry: false,
  });
  const attempt =
    user && registrationId ? readPaymentAttempt(user.id, registrationId) : null;
  const isBusy =
    lookup.isPending ||
    draft.isPending ||
    cancel.isPending ||
    confirm.isPending;
  let step = Math.min(2, Math.max(0, requestedStep));
  if (!parentReady) step = 0;
  else if (step > 1 && !child) step = 1;
  if (registrationId) step = order.data?.status === "COMPLETED" ? 4 : 3;
  const currentOrder = order.data;
  const quote =
    currentOrder?.quotedAmount ??
    Number(selectedClass?.monthlyFee ?? 0) * (values.packageMonths || 0);
  const startDate = currentOrder
    ? dateOnly(currentOrder.startDate)
    : values.startDate;
  const endDate = currentOrder
    ? dateOnly(currentOrder.endDate)
    : values.startDate &&
        values.packageMonths >= 1 &&
        values.packageMonths <= 12
      ? addCalendarMonths(values.startDate, values.packageMonths)
      : "";

  async function handleLookup(input: { email: string }) {
    if (busy.current) return;
    busy.current = true;
    form.reset(EMPTY);
    lookup.reset();
    try {
      await setEmailParam(input.email);
      const result = await lookup.mutateAsync(input.email);
      const preselected = result.parentProfile?.students.find(
        (item) => item.id === studentIdParam && item.status === "ACTIVE",
      );
      if (preselected) form.setValue("targetStudentId", preselected.id);
    } catch {
      /* Inline API feedback. */
    } finally {
      busy.current = false;
    }
  }
  async function next() {
    if (busy.current || isBusy) return;
    // Acquire before async form validation so two clicks cannot both create a draft.
    busy.current = true;
    try {
      await advance();
    } finally {
      busy.current = false;
    }
  }
  async function advance() {
    if (step === 0) {
      if (parentReady && students.length) await setStep(1);
      return;
    }
    if (step === 1) {
      if ((await form.trigger("targetStudentId")) && child) await setStep(2);
      return;
    }
    if (step === 2) {
      if (
        !(await form.trigger([
          "targetStudentId",
          "subject",
          "classId",
          "startDate",
          "packageMonths",
        ]))
      )
        return;
      if (
        !selectedClass?.isOpen ||
        !selectedClass.weeklySchedules.length ||
        selectedClass.program.grade !== child?.grade
      ) {
        form.setError("classId", {
          message: "Chọn lớp mở đăng ký, có lịch và cùng khối của con.",
        });
        return;
      }
      if (
        values.startDate < todayInVietnam() ||
        !selectedClass.weeklySchedules.some(
          (slot) => slot.weekday === isoWeekday(values.startDate),
        )
      ) {
        form.setError("startDate", {
          message: "Ngày bắt đầu phải từ hôm nay và đúng thứ học của lớp.",
        });
        return;
      }
      if (!user) return;
      try {
        const result = await draft.mutateAsync(form.getValues());
        queryClient.setQueryData(["registration", result.id], result);
        await setRegistrationId(result.id);
        try {
          rememberRegistration(user.id, result.id);
        } catch {
          toast.warning(
            "Không thể lưu lịch sử trên thiết bị. Giữ lại mã đăng ký để tiếp tục.",
          );
        }
        await setStep(3);
        toast.success("Đã lưu bản nháp. Chỉ xác nhận sau khi thu đủ học phí.");
      } catch {
        /* Draft POST is never automatically retried. */
      }
      return;
    }
    if (step === 3 && currentOrder?.status === "DRAFT") {
      if (!(await form.trigger("receiptNumber")) || !values.hasReceivedPayment)
        return;
      try {
        const result = await confirm.mutateAsync();
        queryClient.setQueryData(
          ["registration-receipt", registrationId],
          result,
        );
        queryClient.setQueryData(["registration", registrationId], {
          ...currentOrder,
          status: "COMPLETED",
        });
        await queryClient.invalidateQueries({
          queryKey: ["registration-classes"],
        });
        await setStep(4);
        toast.success("Đã xác nhận học phí và ghi danh cho con.");
      } catch {
        /* Keep the stored key and body for manual retry. */
      }
    }
  }
  async function editDraft() {
    if (!registrationId || !currentOrder || busy.current) return;
    busy.current = true;
    try {
      const result = await cancel.mutateAsync(registrationId);
      queryClient.setQueryData(["registration", registrationId], result);
      await setRegistrationId(null);
      form.setValue("hasReceivedPayment", false);
      form.setValue("receiptNumber", "");
      confirm.reset();
      draft.reset();
      cancel.reset();
      await setStep(child ? 2 : 0);
      toast.success("Đã hủy bản nháp. Bạn có thể chọn lại lớp và kỳ học.");
    } catch {
      /* Keep the old draft while cancellation has not succeeded. */
    } finally {
      busy.current = false;
    }
  }
  async function startNew() {
    form.reset(EMPTY);
    lookup.reset();
    draft.reset();
    confirm.reset();
    cancel.reset();
    await setRegistrationId(null);
    await setStep(0);
  }
  const parentWarning =
    parent &&
    (!parentReady
      ? parent.status !== "ACTIVE"
        ? "Tài khoản phụ huynh đã bị khóa."
        : "Phụ huynh cần xác minh email trên ứng dụng trước khi tiếp tục."
      : !students.length
        ? "Phụ huynh chưa có hồ sơ con đang hoạt động. Hướng dẫn tạo hồ sơ con trên ứng dụng rồi tra cứu lại."
        : null);

  return (
    <PageContainer>
      <PageHeader
        title="Đăng ký học cho con"
        description="Phụ huynh chuẩn bị tài khoản và hồ sơ con trên ứng dụng. Nhân viên đăng ký học tại quầy."
      />
      <WizardLayout
        steps={STEPS}
        currentStep={step}
        onStepClick={(index) => {
          if (!registrationId && index <= step && !isBusy) void setStep(index);
        }}
        summaryPanel={
          step === 4 ? undefined : (
            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin đăng ký</h3>
              <dl className="space-y-3 text-sm">
                {[
                  [
                    "Phụ huynh",
                    currentOrder?.parentEmail ?? parent?.email ?? "Chưa chọn",
                  ],
                  [
                    "Học sinh",
                    currentOrder?.studentFullName ??
                      child?.fullName ??
                      "Chưa chọn",
                  ],
                  [
                    "Khối",
                    String(currentOrder?.studentGrade ?? child?.grade ?? "—"),
                  ],
                  [
                    "Lớp",
                    currentOrder?.class.name ??
                      selectedClass?.name ??
                      "Chưa chọn",
                  ],
                  [
                    "Lịch tuần",
                    scheduleText(
                      currentOrder?.class.weeklySchedules ??
                        selectedClass?.weeklySchedules ??
                        [],
                    ) || "—",
                  ],
                  [
                    "Kỳ học",
                    startDate && endDate
                      ? `${displayDate(startDate)} → trước ${displayDate(endDate)}`
                      : "Chưa chọn",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {currentOrder
                    ? "Học phí đã chốt trong bản nháp"
                    : "Học phí dự kiến"}
                </p>
                <p className="text-xl font-semibold text-primary">
                  {money(quote)}
                </p>
              </div>
              {currentOrder && (
                <p className="text-xs text-muted-foreground break-all">
                  Mã đăng ký: {currentOrder.id}
                </p>
              )}
            </div>
          )
        }
        footer={
          step === 4 ? undefined : (
            <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() => router.push(ROUTES.STAFF.PAYMENTS)}
              >
                {registrationId ? "Lưu và tiếp tục sau" : "Đóng"}
              </Button>
              <div className="flex flex-wrap gap-2">
                {step > 0 && step < 3 && (
                  <Button
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => setStep(step - 1)}
                  >
                    Quay lại
                  </Button>
                )}
                {step === 3 && currentOrder?.status === "DRAFT" && (
                  <Button
                    variant="outline"
                    isLoading={cancel.isPending}
                    disabled={isBusy}
                    onClick={editDraft}
                  >
                    Hủy nháp / chọn lại
                  </Button>
                )}
                <Button
                  onClick={next}
                  isLoading={draft.isPending || confirm.isPending}
                  disabled={
                    isBusy ||
                    !user ||
                    (step === 0 && (!parentReady || !students.length)) ||
                    (step === 3 &&
                      (currentOrder?.status !== "DRAFT" ||
                        !values.hasReceivedPayment))
                  }
                >
                  {step === 2
                    ? "Lập bản nháp"
                    : step === 3
                      ? attempt
                        ? "Thử lại xác nhận thu tiền"
                        : "Xác nhận đã thu đủ tiền"
                      : "Tiếp tục"}
                </Button>
              </div>
            </div>
          )
        }
      >
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tra cứu phụ huynh</CardTitle>
              <CardDescription>
                Tìm tài khoản theo email và chọn đúng phụ huynh. Nếu chưa có tài
                khoản hoặc hồ sơ con, phụ huynh tự tạo trên ứng dụng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ParentEmailSearch
                value={emailParam}
                disabled={lookup.isPending}
                onChange={(email) => {
                  void setEmailParam(email);
                  lookup.reset();
                  form.reset(EMPTY);
                }}
                onSelect={(email) => void handleLookup({ email })}
              />
              <ApiFeedback error={lookup.error} />
              {parent && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <p className="font-medium">
                    {parent.displayName || parent.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parent.email} ·{" "}
                    {parent.parentProfile?.phone || "Chưa có số điện thoại"}
                  </p>
                  <Badge variant={parentReady ? "success" : "warning"}>
                    {parentReady
                      ? "Đã xác minh email"
                      : "Chưa đủ điều kiện đăng ký"}
                  </Badge>
                  <p className="text-sm">
                    {students.length} hồ sơ con đang hoạt động
                  </p>
                </div>
              )}
              {parentWarning && (
                <p role="alert" className="rounded-xl bg-muted p-4 text-sm">
                  {parentWarning}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Chọn hồ sơ con</CardTitle>
              <CardDescription>
                Khối học lấy từ hồ sơ con do phụ huynh tạo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {students.map((student) => (
                <label
                  key={student.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${values.targetStudentId === student.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="child"
                    value={student.id}
                    checked={values.targetStudentId === student.id}
                    onChange={() => {
                      form.reset({ ...EMPTY, targetStudentId: student.id });
                      draft.reset();
                    }}
                  />
                  <span>
                    <span className="block font-medium">
                      {student.fullName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Khối {student.grade}
                      {student.dateOfBirth
                        ? ` · Sinh ${displayDate(student.dateOfBirth)}`
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
              <FieldError
                message={form.formState.errors.targetStudentId?.message}
              />
            </CardContent>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Chọn lớp và kỳ học</CardTitle>
              <CardDescription>
                Khối {child?.grade} · Học phí tính theo số tháng dương lịch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ApiFeedback
                error={programs.error}
                retry={() => void programs.refetch()}
              />
              <div className="space-y-2">
                <Label htmlFor="registration-subject">Môn học</Label>
                <select
                  id="registration-subject"
                  className={SELECT_CLASS}
                  value={values.subject}
                  disabled={programs.isPending}
                  onChange={(event) => {
                    form.setValue("subject", event.target.value);
                    form.setValue("classId", "");
                    form.setValue("startDate", "");
                    form.clearErrors();
                    draft.reset();
                  }}
                >
                  <option value="">
                    {programs.isPending ? "Đang tải môn học…" : "Chọn môn học"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
                <FieldError message={form.formState.errors.subject?.message} />
              </div>
              {programs.isSuccess && !subjects.length && (
                <p className="text-sm text-muted-foreground">
                  Chưa có chương trình cho khối này. Quản lý cần tạo chương
                  trình và lớp trước.
                </p>
              )}
              <ApiFeedback
                error={classes.error}
                retry={() => void classes.refetch()}
              />
              {values.subject && classes.isPending && (
                <p className="text-sm text-muted-foreground">
                  Đang tải lớp học…
                </p>
              )}
              {classes.data
                ?.filter((item) => item.program.grade === child?.grade)
                .map((item) => {
                  const eligible =
                    item.isOpen && item.weeklySchedules.length > 0;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 ${values.classId === item.id ? "border-primary bg-primary/5" : "border-border"} ${eligible ? "cursor-pointer" : "opacity-60"}`}
                    >
                      <input
                        className="mt-1"
                        type="radio"
                        name="class"
                        checked={values.classId === item.id}
                        disabled={!eligible}
                        onChange={() => {
                          form.setValue("classId", item.id);
                          form.setValue(
                            "startDate",
                            nextStudyDate(item.weeklySchedules),
                          );
                          form.clearErrors();
                          draft.reset();
                        }}
                      />
                      <span className="flex-1 space-y-1">
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {scheduleText(item.weeklySchedules) ||
                            "Chưa có lịch tuần"}
                        </span>
                        <span className="block text-sm">
                          {money(item.monthlyFee)}/tháng · Sức chứa{" "}
                          {item.capacity} học sinh
                        </span>
                      </span>
                      <Badge variant={eligible ? "success" : "secondary"}>
                        {eligible ? "Mở đăng ký" : "Chưa mở"}
                      </Badge>
                    </label>
                  );
                })}
              {classes.isSuccess && !classes.data.length && (
                <p className="text-sm text-muted-foreground">
                  Chưa có lớp cho môn và khối đã chọn.
                </p>
              )}
              <FieldError message={form.formState.errors.classId?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registration-start">Ngày bắt đầu</Label>
                  <Input
                    id="registration-start"
                    type="date"
                    min={todayInVietnam()}
                    {...form.register("startDate")}
                  />
                  <FieldError
                    message={form.formState.errors.startDate?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-months">Gói học (tháng)</Label>
                  <Input
                    id="registration-months"
                    type="number"
                    min={1}
                    max={12}
                    {...form.register("packageMonths", { valueAsNumber: true })}
                  />
                  <FieldError
                    message={form.formState.errors.packageMonths?.message}
                  />
                </div>
              </div>
              <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Bản nháp chưa giữ chỗ. Sĩ số và trùng lịch được kiểm tra khi lập
                nháp và xác nhận thu tiền.
              </p>
              <ApiFeedback error={draft.error} />
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Xác nhận thu học phí offline</CardTitle>
              <CardDescription>
                Số tiền được chốt bởi máy chủ trong bản nháp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.isPending && <p>Đang tải bản nháp…</p>}
              <ApiFeedback
                error={order.error}
                retry={() => void order.refetch()}
              />
              {currentOrder?.status === "DRAFT" && (
                <>
                  <p className="text-2xl font-semibold text-primary">
                    {money(currentOrder.quotedAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gói {currentOrder.packageMonths} tháng · Hết kỳ trước ngày{" "}
                    {displayDate(currentOrder.endDate)}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="registration-receipt-number">
                      Số biên lai (không bắt buộc)
                    </Label>
                    <Input
                      id="registration-receipt-number"
                      placeholder="Để trống để tự sinh số biên lai"
                      disabled={!!attempt || isBusy}
                      value={
                        attempt
                          ? (attempt.body.receiptNumber ?? "")
                          : values.receiptNumber
                      }
                      onChange={(event) =>
                        form.setValue("receiptNumber", event.target.value)
                      }
                    />
                    <FieldError
                      message={form.formState.errors.receiptNumber?.message}
                    />
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-muted p-4">
                    <Controller
                      control={form.control}
                      name="hasReceivedPayment"
                      render={({ field }) => (
                        <Checkbox
                          id="registration-received"
                          checked={field.value}
                          disabled={isBusy}
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
                        />
                      )}
                    />
                    <Label
                      htmlFor="registration-received"
                      className="leading-relaxed"
                    >
                      Tôi đã nhận đủ {money(currentOrder.quotedAmount)} học phí
                      offline cho đăng ký này.
                    </Label>
                  </div>
                  {attempt && (
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu xác nhận đã được lưu. Khi thử lại, hệ thống giữ
                      nguyên số biên lai và khóa giao dịch.
                    </p>
                  )}
                </>
              )}
              {currentOrder &&
                currentOrder.status !== "DRAFT" &&
                currentOrder.status !== "COMPLETED" && (
                  <div className="space-y-3">
                    <p>
                      Đăng ký ở trạng thái {currentOrder.status}, không thể xác
                      nhận thu tiền.
                    </p>
                    <Button variant="outline" onClick={startNew}>
                      Tạo đăng ký mới
                    </Button>
                  </div>
                )}
              <ApiFeedback error={confirm.error} />
              <ApiFeedback error={cancel.error} />
              {currentOrder && (
                <Button
                  variant="ghost"
                  disabled={isBusy}
                  onClick={() => void order.refetch()}
                >
                  Kiểm tra lại trạng thái đăng ký
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-xl font-semibold">Đăng ký học thành công</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Hồ sơ con đã được ghi danh. Phụ huynh có thể xem lớp và lịch học
                trên ứng dụng.
              </p>
            </div>
            {receipt.isPending && <p>Đang tải biên lai…</p>}
            <ApiFeedback
              error={receipt.error}
              retry={() => void receipt.refetch()}
            />
            {receipt.data && <RegistrationReceipt receipt={receipt.data} />}
            <div className="flex gap-3 print:hidden">
              <Button onClick={startNew}>Đăng ký lớp khác</Button>
              <Button
                variant="outline"
                onClick={() => router.push(ROUTES.STAFF.PAYMENTS)}
              >
                Tra cứu biên lai
              </Button>
            </div>
          </div>
        )}
      </WizardLayout>
    </PageContainer>
  );
}
