"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { registrationSchema, type RegistrationInput } from "../schemas";
import {
  rememberRegistration,
  getDraftAttempt,
  clearDraftAttempt,
} from "../storage";
import { ApiFeedback, FieldError } from "./api-feedback";
import { RegistrationReceipt } from "./registration-receipt";
import { RegistrationClassPicker } from "./registration-class-picker";
import { ParentEmailSearch } from "./parent-email-search";
import { RegistrationBillPanel } from "@/features/billing/components/registration-bill-panel";
import type { AuthUser } from "@/types/auth";
import {
  clearRegistrationProgress,
  readRegistrationProgress,
  saveRegistrationProgress,
} from "../progress";

const STEPS = [
  { id: "parent", label: "Phụ huynh", description: "Tìm và chọn tài khoản" },
  { id: "child", label: "Hồ sơ con", description: "Chọn con đã có hồ sơ" },
  {
    id: "class",
    label: "Lớp & kỳ học",
    description: "Chọn lớp đúng khối và kỳ học",
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
  classId: "",
  startDate: "",
  packageMonths: 3,
  hasReceivedPayment: false,
  receiptNumber: "",
};

export function RegistrationWizard() {
  const user = useCurrentUser();
  // Storage is read only after auth hydrates; another operator gets a separate form.
  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Đăng ký học cho con" />
        <p role="status">Đang tải tiến trình đăng ký…</p>
      </PageContainer>
    );
  }
  return <RegistrationWizardForm key={user.id} user={user} />;
}

function RegistrationWizardForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const busy = useRef(false);
  const suppressProgress = useRef(false);
  const warnedStorage = useRef(false);
  const [initial] = useState(() => {
    const saved = readRegistrationProgress(user.id);
    const linkedOrder = new URLSearchParams(window.location.search).get(
      "registrationId",
    );
    // Viewing another bill must not replace an unfinished registration.
    const ownsProgress =
      !saved || !linkedOrder || linkedOrder === saved.registrationId;
    return { saved: ownsProgress ? saved : null, ownsProgress };
  });
  const [ownsProgress, setOwnsProgress] = useState(initial.ownsProgress);
  const [selectedParentEmail, setSelectedParentEmail] = useState(
    initial.saved?.parentEmail ?? "",
  );
  const [params, setParams] = useQueryStates({
    step: parseAsInteger.withDefault(initial.saved?.step ?? 0),
    registrationId: parseAsString.withDefault(
      initial.saved?.registrationId ?? "",
    ),
    email: parseAsString.withDefault(initial.saved?.email ?? ""),
    studentId: parseAsString,
    classId: parseAsString,
  });
  const {
    step: requestedStep,
    email: emailParam,
    studentId: studentIdParam,
    classId: classIdParam,
  } = params;
  const registrationId = params.registrationId || null;
  const setStep = (step: number) => setParams({ step });
  const setRegistrationId = (id: string | null) =>
    setParams({ registrationId: id ?? "" });
  const setEmailParam = (email: string) => setParams({ email });
  const requestedClass = useQuery({
    queryKey: ["registration-class", classIdParam],
    queryFn: () => registrationApi.class(classIdParam!),
    enabled: !!classIdParam,
    retry: false,
  });
  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: initial.saved
      ? {
          ...initial.saved.values,
          packageMonths: initial.saved.values.packageMonths ?? Number.NaN,
        }
      : EMPTY,
  });
  const values = useWatch({ control: form.control }) as RegistrationInput;
  const lookup = useMutation({
    mutationFn: (email: string) => registrationApi.lookup(email),
    retry: false,
  });
  const restoredParent = useQuery({
    queryKey: ["registration-parent", selectedParentEmail],
    queryFn: ({ signal }) =>
      registrationApi.lookup(selectedParentEmail, signal),
    enabled: !!selectedParentEmail,
    retry: false,
    staleTime: 0,
  });
  const parent = selectedParentEmail ? restoredParent.data : undefined;
  const parentReady = parent?.status === "ACTIVE" && !!parent.emailVerifiedAt;
  const students =
    parent?.parentProfile?.students.filter(
      (child) => child.status === "ACTIVE",
    ) ?? [];
  const child = students.find((entry) => entry.id === values.targetStudentId);
  const classes = useQuery({
    queryKey: [
      "registration-classes",
      child?.id,
      values.startDate,
      values.packageMonths,
    ],
    queryFn: () =>
      registrationApi.classes({
        studentId: child!.id,
        ...(/^\d{4}-\d{2}-\d{2}$/.test(values.startDate) &&
        values.packageMonths >= 1 &&
        values.packageMonths <= 12 &&
        Number.isInteger(values.packageMonths)
          ? {
              startDate: values.startDate,
              packageMonths: String(values.packageMonths),
            }
          : {}),
      }),
    enabled: !!child,
    retry: false,
  });
  const selectedClass = classes.data?.find(
    (item) => item.id === values.classId,
  );
  // Lớp vừa chọn nhưng không đăng ký được (vd. con đã học lớp này trong kỳ): không đưa vào tóm tắt / học phí.
  const summaryClass =
    selectedClass?.isEligible === false ? undefined : selectedClass;
  const gradeClasses =
    classes.data?.filter((item) => item.program.grade === child?.grade) ?? [];
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
    mutationFn: (input: RegistrationInput) => {
      if (!user) throw new Error("Vui lòng đăng nhập trước khi đăng ký.");
      const key = getDraftAttempt(user.id, {
        targetStudentId: input.targetStudentId,
        classId: input.classId,
        startDate: input.startDate,
        packageMonths: input.packageMonths,
      });
      return registrationApi.draft(input, key);
    },
    retry: false,
  });
  const cancel = useMutation({
    mutationFn: registrationApi.cancel,
    retry: false,
  });
  const isBusy = lookup.isPending || draft.isPending || cancel.isPending;
  useEffect(() => {
    function persist(input = form.getValues()) {
      if (!ownsProgress) return;
      const empty =
        !emailParam &&
        !selectedParentEmail &&
        !registrationId &&
        !input.targetStudentId;
      if (
        suppressProgress.current ||
        empty ||
        order.data?.status === "COMPLETED" ||
        order.data?.status === "CANCELLED"
      ) {
        clearRegistrationProgress(user.id);
        return;
      }
      const saved = saveRegistrationProgress(user.id, {
        version: 1,
        step: Math.min(4, Math.max(0, requestedStep)),
        email: emailParam,
        parentEmail: selectedParentEmail,
        registrationId,
        values: {
          ...input,
          packageMonths: Number.isFinite(input.packageMonths)
            ? input.packageMonths
            : null,
        },
      });
      if (!saved && !warnedStorage.current) {
        warnedStorage.current = true;
        toast.warning(
          "Trình duyệt không cho lưu tiến trình. Dữ liệu vẫn được giữ khi chuyển mục, nhưng có thể mất khi tải lại trang.",
        );
      }
    }
    persist();
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => persist(values),
    });
    return () => {
      persist();
      unsubscribe();
    };
  }, [
    form,
    ownsProgress,
    user.id,
    emailParam,
    selectedParentEmail,
    registrationId,
    requestedStep,
    order.data?.status,
  ]);

  function selectStudent(student: { id: string; grade: number }) {
    if (student.id === form.getValues("targetStudentId")) return;
    const classroom = requestedClass.data;
    const preselect =
      classroom?.program.grade === student.grade &&
      classroom.isOpen &&
      classroom.weeklySchedules.length > 0;
    form.reset({
      ...EMPTY,
      targetStudentId: student.id,
      ...(preselect
        ? {
            classId: classroom.id,
            startDate: nextStudyDate(classroom.weeklySchedules),
          }
        : {}),
    });
    draft.reset();
  }
  let step = Math.min(2, Math.max(0, requestedStep));
  if (!parentReady && (!selectedParentEmail || restoredParent.isSuccess))
    step = 0;
  else if (parentReady && step > 1 && !child) step = 1;
  if (registrationId) step = order.data?.status === "COMPLETED" ? 4 : 3;
  const currentOrder = order.data;
  const quote =
    currentOrder?.quotedAmount ??
    Number(summaryClass?.monthlyFee ?? 0) * (values.packageMonths || 0);
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
    lookup.reset();
    try {
      await setEmailParam(input.email);
      const result = await lookup.mutateAsync(input.email);
      suppressProgress.current = false;
      queryClient.setQueryData(["registration-parent", result.email], result);
      if (result.email !== selectedParentEmail) form.reset(EMPTY);
      setSelectedParentEmail(result.email);
      const preselected = result.parentProfile?.students.find(
        (item) => item.id === studentIdParam && item.status === "ACTIVE",
      );
      if (preselected) selectStudent(preselected);
      if (
        result.status === "ACTIVE" &&
        result.emailVerifiedAt &&
        result.parentProfile?.students.some(
          (student) => student.status === "ACTIVE",
        )
      )
        await setStep(1);
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
          "classId",
          "startDate",
          "packageMonths",
        ]))
      )
        return;
      if (
        !selectedClass?.isOpen ||
        !selectedClass.weeklySchedules.length ||
        selectedClass.isEligible === false ||
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
        clearDraftAttempt(user.id);
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
    suppressProgress.current = true;
    clearRegistrationProgress(user.id);
    clearDraftAttempt(user.id);
    await setParams({
      step: 0,
      registrationId: "",
      email: "",
      studentId: null,
      classId: null,
    });
    setSelectedParentEmail("");
    form.reset(EMPTY);
    lookup.reset();
    draft.reset();
    cancel.reset();
    setOwnsProgress(true);
  }
  async function cancelRegistration() {
    if (busy.current || isBusy) return;
    busy.current = true;
    try {
      if (registrationId && currentOrder?.status !== "CANCELLED") {
        const result = await cancel.mutateAsync(registrationId);
        queryClient.setQueryData(["registration", registrationId], result);
      }
      await startNew();
      toast.success("Đã hủy đăng ký và xóa tiến trình đã lưu.");
    } catch {
      // Retain all selections until the server confirms cancellation.
    } finally {
      busy.current = false;
    }
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
      <ApiFeedback
        error={requestedClass.error}
        retry={() => void requestedClass.refetch()}
      />
      <ApiFeedback error={cancel.error} />
      <WizardLayout
        steps={STEPS}
        currentStep={step}
        onStepClick={(index) => {
          if (!registrationId && index <= step && !isBusy) void setStep(index);
        }}
        summaryPanel={
          step >= 3 ? undefined : (
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
                      summaryClass?.name ??
                      (selectedClass
                        ? "Chưa chọn được (lớp không phù hợp)"
                        : "Chưa chọn"),
                  ],
                  [
                    "Lịch tuần",
                    scheduleText(
                      currentOrder?.class.weeklySchedules ??
                        summaryClass?.weeklySchedules ??
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
                Lưu và tiếp tục sau
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  disabled={isBusy || (!!registrationId && !currentOrder)}
                  onClick={cancelRegistration}
                >
                  Hủy đăng ký
                </Button>
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
                {step < 3 && (
                  <Button
                    onClick={next}
                    isLoading={draft.isPending}
                    disabled={
                      isBusy ||
                      !user ||
                      (!!selectedParentEmail && !parent) ||
                      (step === 0 && (!parentReady || !students.length)) ||
                      (step === 2 && classes.isFetching)
                    }
                  >
                    {step === 2 ? "Lập bản nháp" : "Tiếp tục"}
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedParentEmail && !parent && !registrationId && (
          <Card>
            <CardContent className="space-y-3 py-6">
              {restoredParent.isPending && (
                <p role="status">Đang khôi phục thông tin đăng ký…</p>
              )}
              <ApiFeedback
                error={restoredParent.error}
                retry={() => void restoredParent.refetch()}
              />
              {restoredParent.isError && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedParentEmail("");
                    void setStep(0);
                  }}
                >
                  Chọn lại phụ huynh
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {step === 0 && (!selectedParentEmail || parent || registrationId) && (
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
                  suppressProgress.current = false;
                  void setEmailParam(email);
                  setSelectedParentEmail("");
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
        {step === 1 && parent && (
          <Card>
            <CardHeader>
              <CardTitle>Chọn hồ sơ con</CardTitle>
              <CardDescription>
                {parent?.email} · Khối học lấy từ hồ sơ con do phụ huynh tạo.
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
                    disabled={!!classIdParam && requestedClass.isPending}
                    onChange={() => {
                      selectStudent(student);
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
        {step === 2 && parent && (
          <Card>
            <CardHeader>
              <CardTitle>Chọn lớp và kỳ học</CardTitle>
              <CardDescription>
                {child?.fullName} · Khối {child?.grade} · Chọn lớp phụ huynh
                muốn đăng ký. Học phí tính theo số tháng dương lịch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ApiFeedback
                error={classes.error}
                retry={() => void classes.refetch()}
              />
              {classes.isPending && (
                <p className="text-sm text-muted-foreground">
                  Đang tải lớp học…
                </p>
              )}
              {classes.isSuccess && gradeClasses.length > 0 && (
                <RegistrationClassPicker
                  key={child?.id}
                  classes={gradeClasses}
                  selectedClassId={values.classId}
                  onSelect={(item) => {
                    form.setValue("classId", item.id);
                    form.setValue(
                      "startDate",
                      values.startDate &&
                        item.weeklySchedules.some(
                          (slot) =>
                            slot.weekday === isoWeekday(values.startDate),
                        )
                        ? values.startDate
                        : nextStudyDate(item.weeklySchedules),
                    );
                    form.clearErrors();
                    draft.reset();
                  }}
                />
              )}
              {classes.isSuccess && !gradeClasses.length && (
                <p className="text-sm text-muted-foreground">
                  Chưa có lớp cho khối {child?.grade}. Quản lý cần tạo lớp và
                  lịch học trước.
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
                  <Label htmlFor="registration-months">
                    Đóng học phí (tháng)
                  </Label>
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
        {step === 3 && registrationId && (
          <div className="space-y-4">
            <ApiFeedback
              error={order.error}
              retry={() => void order.refetch()}
            />
            <RegistrationBillPanel
              key={registrationId}
              registrationId={registrationId}
              paymentDraft={{
                receiptNumber: values.receiptNumber,
                hasReceivedPayment: values.hasReceivedPayment,
              }}
              onPaymentDraftChange={(input) => {
                form.setValue("receiptNumber", input.receiptNumber);
                form.setValue("hasReceivedPayment", input.hasReceivedPayment);
              }}
              onPaid={async () => {
                await setStep(4);
              }}
            />
            {order.data?.status === "CANCELLED" && (
              <Button onClick={startNew}>Tạo đăng ký mới</Button>
            )}
          </div>
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
