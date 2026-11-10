"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { ChoiceCards } from "@/components/shared/forms/choice-cards";
import { ReasonSelect } from "@/components/shared/forms/reason-select";
import { useLiveCommand } from "@/features/academic/hooks/use-live-api";
import { userFacingMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";

export interface ApiFormField {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "checkbox"
    | "select"
    /** Chọn lý do có sẵn trong `presets`, mục cuối "Khác…" mở ô gõ tay. */
    | "reason"
    /** Radio dạng thẻ, mỗi lựa chọn có thể có dòng mô tả. */
    | "choices";
  options?: { value: string; label: string; description?: ReactNode }[];
  presets?: readonly string[];
  disabled?: boolean;
  description?: string;
  /** Chiếm nửa hàng từ `sm` trở lên (vd. hai ô ngày cạnh nhau). */
  half?: boolean;
}
export type ApiFormValues = Record<string, unknown>;
export function ApiForm({
  schema,
  fields,
  defaults = {},
  liveDefaults,
  submitLabel = "Lưu",
  successMessage = "Đã thực hiện thành công.",
  onSubmit,
  onSuccess,
  disabled = false,
  preview,
  summary,
  confirm,
  submitVariant = "default",
}: {
  schema: z.ZodObject<Record<string, z.ZodType>>;
  fields: ApiFormField[];
  defaults?: Record<string, unknown>;
  /** Giá trị gợi ý đến muộn (vd tải xong mới tính được mã): chỉ điền vào ô người dùng chưa sửa, không dựng lại form. */
  liveDefaults?: Record<string, unknown>;
  submitLabel?: string;
  successMessage?: string | false;
  onSubmit: (value: Record<string, unknown>) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  disabled?: boolean;
  /** Vùng xem trước (bảng so sánh) dựng từ giá trị đang nhập; chỉ hiển thị, không chặn gửi. */
  preview?: (values: ApiFormValues) => ReactNode;
  /** Câu tóm tắt tác động đặt cạnh nút gửi. */
  summary?: (values: ApiFormValues) => ReactNode;
  /** Có thì bấm gửi mở hộp xác nhận trước khi gọi API (thay cho ô tick "Tôi xác nhận…"). */
  confirm?: {
    title: string;
    description?: (values: ApiFormValues) => string;
    confirmText: string;
    danger?: boolean;
  };
  submitVariant?: "default" | "destructive";
}) {
  const id = useId();
  const errorSummary = useRef<HTMLDivElement>(null);
  const action = useLiveCommand();
  const [pending, setPending] = useState<ApiFormValues | null>(null);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const watched = useWatch({ control: form.control }) as ApiFormValues;
  const dirty = form.formState.dirtyFields as Record<string, unknown>;
  const liveKey = JSON.stringify(liveDefaults ?? {});
  useEffect(() => {
    for (const [name, value] of Object.entries(JSON.parse(liveKey) as Record<string, unknown>))
      if (!dirty[name]) form.setValue(name, value);
  }, [liveKey, dirty, form]);
  const run = (value: ApiFormValues) =>
    new Promise<void>((resolve) =>
      action.mutate(() => onSubmit(value), {
        onSuccess,
        onSettled: () => resolve(),
      }),
    );
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(
          (value) => (confirm ? setPending(value) : void run(value)),
          () => setTimeout(() => errorSummary.current?.focus(), 0),
        )(event);
      }}
    >
      {!!Object.keys(form.formState.errors).length && (
        <div
          ref={errorSummary}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl border border-destructive p-4 text-sm text-destructive"
        >
          <p>Kiểm tra các trường sau:</p>
          <ul className="list-inside list-disc">
            {fields
              .filter((field) => form.formState.errors[field.name])
              .map((field) => (
                <li key={field.name}>
                  {field.label}:{" "}
                  {userFacingMessage(
                    form.formState.errors[field.name]?.message,
                    "Vui lòng kiểm tra lại thông tin đã nhập.",
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
      <fieldset
        disabled={disabled || action.isPending}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        {fields.map((input) => {
          const fieldId = `${id}-${input.name}`;
          const message = form.formState.errors[input.name]?.message;
          return (
            <div
              key={input.name}
              className={cn("min-w-0 space-y-2", !input.half && "sm:col-span-2")}
            >
              {input.type !== "checkbox" && input.type !== "choices" && (
                <Label htmlFor={fieldId}>{input.label}</Label>
              )}
              {input.type === "reason" ? (
                <Controller
                  name={input.name}
                  control={form.control}
                  render={({ field }) => (
                    <ReasonSelect
                      id={fieldId}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      presets={input.presets ?? []}
                      disabled={input.disabled || action.isPending || disabled}
                      invalid={!!message}
                      describedBy={message ? `${fieldId}-error` : undefined}
                    />
                  )}
                />
              ) : input.type === "choices" ? (
                <Controller
                  name={input.name}
                  control={form.control}
                  render={({ field }) => (
                    <ChoiceCards
                      legend={input.label}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                      options={input.options ?? []}
                      disabled={input.disabled || action.isPending || disabled}
                      invalid={!!message}
                      describedBy={message ? `${fieldId}-error` : undefined}
                    />
                  )}
                />
              ) : input.type === "select" ? (
                <Controller
                  name={input.name}
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      items={Object.fromEntries(
                        (input.options ?? []).map((option) => [
                          option.value,
                          option.label,
                        ]),
                      )}
                      value={String(field.value ?? "")}
                      onValueChange={(value) =>
                        field.onChange(String(value ?? ""))
                      }
                      disabled={input.disabled || action.isPending || disabled}
                    >
                      <SelectTrigger
                        id={fieldId}
                        className="w-full"
                        aria-invalid={!!message}
                        aria-describedby={
                          message ? `${fieldId}-error` : undefined
                        }
                      >
                        <SelectValue placeholder="Chọn…" />
                      </SelectTrigger>
                      <SelectContent>
                        {input.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : input.type === "checkbox" ? (
                // Ô tick đứng trước câu xác nhận, giống màn điểm danh.
                <div className="flex items-start gap-3">
                  <Controller
                    name={input.name}
                    control={form.control}
                    render={({ field }) => (
                      <Checkbox
                        id={fieldId}
                        className="mt-0.5"
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={input.disabled}
                        aria-invalid={!!message}
                        aria-describedby={
                          message ? `${fieldId}-error` : undefined
                        }
                      />
                    )}
                  />
                  <Label htmlFor={fieldId} className="leading-snug">
                    {input.label}
                  </Label>
                </div>
              ) : input.type === "textarea" ? (
                <Textarea
                  id={fieldId}
                  {...form.register(input.name)}
                  disabled={input.disabled}
                  aria-invalid={!!message}
                  aria-describedby={message ? `${fieldId}-error` : undefined}
                />
              ) : (
                <Input
                  id={fieldId}
                  type={input.type ?? "text"}
                  step={input.type === "number" ? "any" : undefined}
                  {...form.register(input.name)}
                  disabled={input.disabled}
                  aria-invalid={!!message}
                  aria-describedby={message ? `${fieldId}-error` : undefined}
                  autoComplete={
                    input.type === "password" ? "new-password" : undefined
                  }
                />
              )}
              {input.description && (
                <p className="text-sm text-muted-foreground">
                  {input.description}
                </p>
              )}
              {message && (
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {userFacingMessage(
                    message,
                    "Vui lòng kiểm tra lại thông tin đã nhập.",
                  )}
                </p>
              )}
            </div>
          );
        })}
        {preview && <div className="min-w-0 sm:col-span-2">{preview(watched)}</div>}
        <div
          className={cn(
            "sm:col-span-2",
            summary &&
              "flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          {summary && (
            <p className="text-sm text-foreground/80" aria-live="polite">
              {summary(watched)}
            </p>
          )}
          <Button
            type="submit"
            variant={submitVariant}
            className="shrink-0"
          >
            {action.isPending ? "Đang xử lý…" : submitLabel}
          </Button>
        </div>
      </fieldset>
      <ApiFeedback error={action.error} />
      {action.isSuccess && successMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {successMessage}
        </p>
      )}
      {confirm && (
        <ConfirmDialog
          open={!!pending}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={confirm.title}
          description={pending ? confirm.description?.(pending) : undefined}
          confirmText={confirm.confirmText}
          variant={confirm.danger ? "danger" : "default"}
          isLoading={action.isPending}
          onConfirm={async () => {
            if (pending) await run(pending);
          }}
        />
      )}
    </form>
  );
}
