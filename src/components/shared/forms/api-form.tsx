"use client";
import { useId, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { useLiveCommand } from "@/features/academic/hooks/use-live-api";

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
    | "select";
  options?: { value: string; label: string }[];
  disabled?: boolean;
  description?: string;
}
export function ApiForm({
  schema,
  fields,
  defaults = {},
  submitLabel = "Lưu",
  successMessage = "Đã thực hiện thành công.",
  onSubmit,
  onSuccess,
  disabled = false,
}: {
  schema: z.ZodObject<Record<string, z.ZodType>>;
  fields: ApiFormField[];
  defaults?: Record<string, unknown>;
  submitLabel?: string;
  successMessage?: string | false;
  onSubmit: (value: Record<string, unknown>) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const errorSummary = useRef<HTMLDivElement>(null);
  const action = useLiveCommand();
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(
          (value) => action.mutate(() => onSubmit(value), { onSuccess }),
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
                  {String(form.formState.errors[field.name]?.message)}
                </li>
              ))}
          </ul>
        </div>
      )}
      <fieldset disabled={disabled || action.isPending} className="space-y-4">
        {fields.map((input) => {
          const fieldId = `${id}-${input.name}`;
          const message = form.formState.errors[input.name]?.message;
          return (
            <div key={input.name} className="space-y-2">
              <Label htmlFor={fieldId}>{input.label}</Label>
              {input.type === "select" ? (
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
                <Controller
                  name={input.name}
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id={fieldId}
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
                  {String(message)}
                </p>
              )}
            </div>
          );
        })}
        <Button type="submit">
          {action.isPending ? "Đang xử lý…" : submitLabel}
        </Button>
      </fieldset>
      <ApiFeedback error={action.error} />
      {action.isSuccess && successMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {successMessage}
        </p>
      )}
    </form>
  );
}
