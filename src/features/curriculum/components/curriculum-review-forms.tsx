"use client";

import { useId } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { StickyFormFooter } from "@/components/shared/workflows/sticky-form-footer";
import { estimateLessons } from "../workspace-selectors";
import { registrationApi } from "@/features/registration-flow/api";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import {
  addCalendarDays,
  calendarDateLabel,
  todayInVietnam,
} from "@/lib/calendar-date";
import {
  curriculumSubmitSchema,
  curriculumTechnicalReviewSchema,
  curriculumRevisionSchema,
  reviewReasonSchema,
  type CurriculumSubmitInput,
  type CurriculumTechnicalReviewInput,
  type CurriculumRevisionInput,
} from "@/lib/validators/curriculum";
import type { CurriculumUnitDetail } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { useCurriculumMutation } from "../hooks/use-curriculum";
import {
  useCurriculumFormState,
  type CurriculumFormState,
} from "../hooks/use-curriculum-form";

interface ReviewFormProps {
  unit: CurriculumUnitDetail;
  onSaved: () => void;
  onStateChange: (state: CurriculumFormState) => void;
}

export function CurriculumSubmitForm({
  unit,
  onSaved,
  onStateChange,
}: ReviewFormProps) {
  const id = useId();
  const reviewers = useQuery({
    queryKey: ["curriculum", "reviewers", unit.id],
    queryFn: ({ signal }) => curriculumApi.reviewers(unit.id, signal),
    retry: false,
  });
  const form = useForm<CurriculumSubmitInput>({
    resolver: zodResolver(curriculumSubmitSchema),
    defaultValues: { reviewerTeacherId: "" },
  });
  const save = useCurriculumMutation(async (input: CurriculumSubmitInput) => {
    const result = await curriculumApi.submit(unit.id, input);
    onSaved();
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <AsyncBoundary
      isLoading={reviewers.isPending}
      isError={reviewers.isError}
      error={reviewers.error}
      onRetry={() => void reviewers.refetch()}
      data={reviewers.data}
      emptyProps={{
        title: "Chưa có giáo viên phù hợp",
        description:
          "Liên hệ quản lý để phân công giáo viên đúng môn trước khi gửi thẩm định.",
      }}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((input) => save.mutate(input))}
      >
        <p className="text-sm text-muted-foreground">
          Giáo viên thẩm định nội dung chuyên môn. Quản lý xác nhận áp dụng sau
          khi giáo viên đồng ý. Nội dung nháp được khóa khi gửi.
        </p>
        <div className="space-y-2">
          <Label htmlFor={id}>Giáo viên thẩm định</Label>
          <Controller
            name="reviewerTeacherId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                disabled={save.isPending}
                items={reviewers.data?.map((teacher) => ({
                  value: teacher.id,
                  label: teacher.displayName || teacher.email,
                }))}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <SelectTrigger
                  id={id}
                  className="w-full"
                  aria-invalid={!!form.formState.errors.reviewerTeacherId}
                  aria-describedby={id + "-error"}
                >
                  <SelectValue placeholder="Chọn giáo viên đúng môn" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.data?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.displayName || teacher.email} · {teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <div id={id + "-error"}>
            <FieldError
              message={form.formState.errors.reviewerTeacherId?.message}
            />
          </div>
        </div>
        <Button
          type="submit"
          isLoading={save.isPending}
          disabled={save.isPending}
        >
          Gửi thẩm định chuyên môn
        </Button>
        <ApiFeedback error={save.error} />
      </form>
    </AsyncBoundary>
  );
}

export function CurriculumTechnicalReviewForm({
  unit,
  onSaved,
  onStateChange,
}: Omit<ReviewFormProps, "onSaved"> & {
  onSaved: (approved: boolean) => void;
}) {
  const id = useId();
  const form = useForm<CurriculumTechnicalReviewInput>({
    resolver: zodResolver(curriculumTechnicalReviewSchema),
    defaultValues: {
      approved: true,
      note: "",
      expectedRevision: unit.revision,
    },
  });
  const approved = useWatch({ control: form.control, name: "approved" });
  const save = useCurriculumMutation(
    async (input: CurriculumTechnicalReviewInput) => {
      const result = await curriculumApi.technicalReview(unit.id, input);
      onSaved(input.approved);
      return result;
    },
  );
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <fieldset disabled={save.isPending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={id + "-decision"}>Kết quả thẩm định chuyên môn</Label>
          <Controller
            name="approved"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value ? "approve" : "changes"}
                disabled={save.isPending}
                items={{
                  approve: "Đồng ý về chuyên môn",
                  changes: "Yêu cầu chỉnh sửa",
                }}
                onValueChange={(value) => field.onChange(value === "approve")}
              >
                <SelectTrigger id={id + "-decision"} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Đồng ý về chuyên môn</SelectItem>
                  <SelectItem value="changes">Yêu cầu chỉnh sửa</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id + "-note"}>
            {approved
              ? "Nhận xét chuyên môn (tùy chọn)"
              : "Nội dung cần chỉnh sửa"}
          </Label>
          <Textarea
            id={id + "-note"}
            rows={5}
            aria-invalid={!!form.formState.errors.note}
            aria-describedby={id + "-note-error"}
            {...form.register("note")}
          />
          <div id={id + "-note-error"}>
            <FieldError message={form.formState.errors.note?.message} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {approved
            ? "Giáo trình sẽ chuyển đến quản lý để xác nhận áp dụng."
            : "Giáo trình trở về bản nháp để người thiết kế chỉnh sửa và gửi lại."}
        </p>
        <StickyFormFooter>
          <Button
            type="submit"
            isLoading={save.isPending}
            disabled={save.isPending}
          >
            {approved ? "Đồng ý và chuyển quản lý" : "Gửi yêu cầu chỉnh sửa"}
          </Button>
        </StickyFormFooter>
      </fieldset>
      <ApiFeedback error={save.error} />
    </form>
  );
}

export function CurriculumRevisionForm({
  unit,
  onCreated,
  onStateChange,
}: Omit<ReviewFormProps, "onSaved"> & {
  onCreated: (id: string, source?: "csv") => void;
}) {
  const id = useId();
  const program = useQuery({ queryKey: ["curriculum", "program-readiness", unit.programId], queryFn: ({ signal }) => registrationApi.program(unit.programId, signal), retry: false });
  const [source, setSource] = useQueryState(
    "lessonSource",
    parseAsStringLiteral(["copy", "csv", "empty"]).withDefault("copy"),
  );
  const minDate = addCalendarDays(
    [unit.toDate.slice(0, 10), todayInVietnam()].sort().at(-1)!,
    1,
  );
  const form = useForm<CurriculumRevisionInput>({
    resolver: zodResolver(curriculumRevisionSchema),
    defaultValues: { title: unit.title, fromDate: minDate, toDate: "" },
  });
  const save = useCurriculumMutation(async (input: CurriculumRevisionInput) => {
    const result =
      source === "copy"
        ? await curriculumApi.revise(unit.id, input)
        : await curriculumApi.create({ ...input, programId: unit.programId });
    onCreated(result.id, source === "csv" ? "csv" : undefined);
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  const errors = form.formState.errors;
  const fromDate = useWatch({ control: form.control, name: "fromDate" });
  const toDate = useWatch({ control: form.control, name: "toDate" });
  const frequency = program.data?.sessionsPerWeek ?? unit.program?.sessionsPerWeek;
  const estimate = estimateLessons(fromDate, toDate, [], frequency);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => {
        if (input.fromDate < minDate) {
          form.setError("fromDate", {
            message: "Chọn kỳ học bắt đầu sau kỳ hiện tại và sau hôm nay.",
          });
          return;
        }
        save.mutate(input);
      })}
    >
      <p className="text-sm text-muted-foreground">
        Sao chép bài học để chuẩn bị kỳ tiếp theo. Giáo trình đã duyệt và các
        buổi đang sử dụng được giữ nguyên. Kỳ hiện tại kết thúc{" "}
        {calendarDateLabel(unit.toDate.slice(0, 10))}.
      </p>
      <fieldset disabled={save.isPending} className="space-y-4">
        <div className="space-y-2">
          <Label>Bài học lấy từ</Label>
          <Select
            value={source}
            items={{
              copy: "Sao chép kỳ này",
              csv: "Nhập từ CSV",
              empty: "Soạn từ đầu",
            }}
            onValueChange={(value) => void setSource(value as typeof source)}
          >
            <SelectTrigger aria-label="Nguồn bài học kỳ mới">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="copy">
                Sao chép kỳ này ·{" "}
                {
                  unit.lessons.filter((lesson) => lesson.kind === "LESSON")
                    .length
                }{" "}
                bài
              </SelectItem>
              <SelectItem value="csv">Nhập từ CSV</SelectItem>
              <SelectItem value="empty">Soạn từ đầu</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {source === "copy"
              ? "Sao chép bài vào bản nháp mới bằng phiên bản kế tiếp."
              : source === "csv"
                ? "Tạo bản trống rồi mở bước xem trước CSV."
                : "Tạo bản trống và soạn từng bài."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id + "-title"}>Tên giáo trình / học kỳ mới</Label>
          <Input
            id={id + "-title"}
            aria-invalid={!!errors.title}
            aria-describedby={id + "-title-error"}
            {...form.register("title")}
          />
          <div id={id + "-title-error"}>
            <FieldError message={errors.title?.message} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id + "-from"}>Bắt đầu áp dụng</Label>
            <Input
              id={id + "-from"}
              type="date"
              min={minDate}
              aria-invalid={!!errors.fromDate}
              aria-describedby={id + "-from-error"}
              {...form.register("fromDate")}
            />
            <div id={id + "-from-error"}>
              <FieldError message={errors.fromDate?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + "-to"}>Kết thúc áp dụng</Label>
            <Input
              id={id + "-to"}
              type="date"
              min={fromDate || minDate}
              aria-invalid={!!errors.toDate}
              aria-describedby={id + "-to-error"}
              {...form.register("toDate")}
            />
            <div id={id + "-to-error"}>
              <FieldError message={errors.toDate?.message} />
            </div>
          </div>
        </div>
        <section className="space-y-2 rounded-xl bg-muted p-4 text-sm">
          <p className="font-medium">Kiểm tra số bài cần</p>
          <p>
            {estimate
              ? `${estimate.weeks} tuần theo khoảng hiệu lực (làm tròn lên).`
              : "Chọn khoảng hiệu lực để tính số tuần."}
          </p>
          <Label htmlFor={id + "-weekly"}>Số buổi/tuần</Label>
          <Input
            id={id + "-weekly"}
            readOnly
            value={frequency ?? ""}
            placeholder="Chưa cấu hình"
          />
          <p className="text-xs text-muted-foreground">
            {estimate?.max == null ? "Quản lý cần cấu hình số buổi/tuần tại khóa học." : `Dự kiến ${estimate.max} bài theo số tuần làm tròn. Số buổi thực tế được kiểm tra theo lịch lớp khi sinh lịch.`} Bản nguồn có{" "}
            {unit.lessons.filter((lesson) => lesson.kind === "LESSON").length}{" "}
            bài.
          </p>
        </section>
        <ApiFeedback error={program.error} retry={() => void program.refetch()} />
        <Button
          type="submit"
          isLoading={save.isPending}
          disabled={save.isPending}
        >
          Tạo giáo trình cho kỳ tiếp theo
        </Button>
      </fieldset>
      <ApiFeedback error={save.error} />
    </form>
  );
}

export function CurriculumRequestChangesForm({
  unit,
  onSaved,
  onStateChange,
}: ReviewFormProps) {
  const id = useId();
  const form = useForm<{ reason: string }>({
    resolver: zodResolver(reviewReasonSchema),
    defaultValues: { reason: "" },
  });
  const save = useCurriculumMutation(async ({ reason }: { reason: string }) => {
    const result = await curriculumApi.requestChanges(unit.id, reason);
    onSaved();
    return result;
  });
  useCurriculumFormState(form.formState.isDirty, save.isPending, onStateChange);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit((input) => save.mutate(input))}
    >
      <div className="space-y-2">
        <Label htmlFor={id}>Nội dung cần sửa</Label>
        <Textarea
          id={id}
          rows={5}
          disabled={save.isPending}
          aria-invalid={!!form.formState.errors.reason}
          aria-describedby={id + "-error"}
          {...form.register("reason")}
        />
        <div id={id + "-error"}>
          <FieldError message={form.formState.errors.reason?.message} />
        </div>
      </div>
      <Button
        type="submit"
        disabled={save.isPending}
        isLoading={save.isPending}
      >
        Gửi yêu cầu chỉnh sửa
      </Button>
      <ApiFeedback error={save.error} />
    </form>
  );
}
