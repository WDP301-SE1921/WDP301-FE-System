"use client";

import { cn } from "cn";

import { Input } from "@/components/ui/input";

import { TimeInput } from "./time-input";

export interface DateTimeInputProps {
  /** Cùng dạng với `<input type="datetime-local">`: `yyyy-MM-ddTHH:mm`, chuỗi rỗng khi chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  /** Gắn vào ô ngày để `<Label htmlFor>` trỏ tới. */
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Giờ điền sẵn khi mới chọn ngày, vd `23:59` cho hạn nộp. */
  defaultTime?: string;
  className?: string;
}

/**
 * Ô chọn ngày và giờ, phần giờ theo định dạng 24 giờ (`TimeInput`). Thay cho
 * `<input type="datetime-local">` vì trình duyệt tiếng Anh hiện ô đó theo AM/PM. Giờ chỉ chọn
 * được sau khi có ngày, để giá trị trả ra luôn đủ cả hai phần.
 */
function DateTimeInput({
  value,
  onChange,
  id,
  disabled,
  invalid,
  defaultTime = "00:00",
  className,
}: DateTimeInputProps) {
  const [date = "", time = ""] = value.split("T");

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <Input
        id={id}
        type="date"
        value={date}
        disabled={disabled}
        aria-invalid={invalid}
        onChange={(event) => {
          const nextDate = event.target.value;
          onChange(
            nextDate ? `${nextDate}T${time.slice(0, 5) || defaultTime}` : "",
          );
        }}
      />
      <TimeInput
        value={time.slice(0, 5)}
        disabled={disabled || !date}
        invalid={invalid}
        onChange={(nextTime) => onChange(`${date}T${nextTime}`)}
      />
    </div>
  );
}

export { DateTimeInput };
