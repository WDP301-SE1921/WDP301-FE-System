"use client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NumberStepperProps {
  /** id của nhãn bên ngoài, đặt tên cho cả nhóm nút. */
  labelId: string;
  value: number | undefined;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** Giá trị đầu tiên khi đang trống ("Chưa đặt") và người dùng bấm −/+. */
  startValue: number;
  format: (value: number) => string;
  emptyText: string;
  decreaseLabel: string;
  increaseLabel: string;
  describedBy?: string;
  disabled?: boolean;
}

/** Chọn số bằng nút −/+ thay cho ô gõ số, để không gõ nhầm và luôn trong giới hạn. */
export function NumberStepper({
  labelId,
  value,
  onChange,
  min,
  max,
  startValue,
  format,
  emptyText,
  decreaseLabel,
  increaseLabel,
  describedBy,
  disabled,
}: NumberStepperProps) {
  const step = (delta: number) =>
    onChange(
      value == null ? startValue : Math.min(max, Math.max(min, value + delta)),
    );
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className="flex items-center gap-3"
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        leftIcon={<Minus />}
        aria-label={decreaseLabel}
        disabled={disabled || (value != null && value <= min)}
        onClick={() => step(-1)}
      />
      <output
        aria-live="polite"
        className="min-w-28 text-center text-sm font-medium tabular-nums"
      >
        {value == null ? emptyText : format(value)}
      </output>
      <Button
        type="button"
        size="icon"
        variant="outline"
        leftIcon={<Plus />}
        aria-label={increaseLabel}
        disabled={disabled || (value != null && value >= max)}
        onClick={() => step(1)}
      />
    </div>
  );
}
