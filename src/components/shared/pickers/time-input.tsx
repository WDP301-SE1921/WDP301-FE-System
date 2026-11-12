"use client";

import { cn } from "cn";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const DEFAULT_MINUTE_STEP = 5;
const DEFAULT_MINUTE = "00";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

const HOUR_OPTIONS = Array.from({ length: HOURS_PER_DAY }, (_, hour) =>
  pad(hour),
);

/** Phút theo bước `step`, kèm phút lẻ đang có để không làm mất giá trị cũ (vd 23:59). */
function minuteOptions(step: number, current: string): string[] {
  const options = Array.from(
    { length: Math.ceil(MINUTES_PER_HOUR / step) },
    (_, index) => pad(index * step),
  );
  if (current && !options.includes(current)) options.push(current);
  return options.sort();
}

export interface TimeInputProps {
  /** Giờ dạng 24 giờ `HH:mm`, chuỗi rỗng khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  /** Gắn vào ô Giờ để `<Label htmlFor>` trỏ tới. */
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  minuteStep?: number;
  className?: string;
}

/**
 * Ô chọn giờ theo định dạng 24 giờ. Thay cho `<input type="time">`, vì trình duyệt vẽ ô đó theo
 * ngôn ngữ của máy (máy tiếng Anh hiện AM/PM) và không ép được 24 giờ. Chọn giờ trước thì phút
 * mặc định là `00`; giá trị trả ra vẫn là `HH:mm` như ô native.
 */
function TimeInput({
  value,
  onChange,
  id,
  disabled,
  invalid,
  minuteStep = DEFAULT_MINUTE_STEP,
  className,
}: TimeInputProps) {
  const match = TIME_PATTERN.exec(value);
  const hour = match?.[1] ?? "";
  const minute = match?.[2] ?? "";
  const minutes = minuteOptions(minuteStep, minute);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={hour || null}
        onValueChange={(next) => {
          if (next) onChange(`${String(next)}:${minute || DEFAULT_MINUTE}`);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-label="Giờ"
          aria-invalid={invalid}
          className="min-w-0 flex-1"
        >
          <SelectValue placeholder="Giờ" />
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden className="font-medium text-muted-foreground">
        :
      </span>
      <Select
        value={minute || null}
        onValueChange={(next) => {
          if (next && hour) onChange(`${hour}:${String(next)}`);
        }}
        disabled={disabled || !hour}
      >
        <SelectTrigger
          aria-label="Phút"
          aria-invalid={invalid}
          className="min-w-0 flex-1"
        >
          <SelectValue placeholder="Phút" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { TimeInput };
