"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/**
 * Nhóm radio dạng thẻ: thay cho dropdown khi người làm cần thấy thông tin của từng lựa chọn
 * (ghi danh, lớp mới, giáo viên) trước khi chọn. Dùng radio gốc nên bàn phím và trình đọc
 * màn hình hoạt động như một radio group bình thường.
 */
export function ChoiceCards({
  value,
  onChange,
  options,
  legend,
  name,
  columns = 2,
  disabled,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ChoiceOption[];
  legend: ReactNode;
  name?: string;
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const autoName = useId();
  return (
    <fieldset
      className="min-w-0 space-y-2"
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    >
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition-colors duration-150",
                "hover:border-foreground/25 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                checked && "border-primary bg-primary/5 hover:border-primary",
                option.disabled &&
                  "cursor-not-allowed bg-muted/50 text-muted-foreground hover:border-border",
              )}
            >
              <input
                type="radio"
                className="peer sr-only"
                name={name ?? autoName}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded-full border-2 border-input transition-[border-width,border-color] duration-150",
                  checked && "border-[5px] border-primary",
                )}
              />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-medium">{option.label}</span>
                {option.description && (
                  <span className="block text-sm wrap-anywhere text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
