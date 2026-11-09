"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REASON_OTHER_LABEL } from "@/constants/reason-presets";

const OTHER = "__other__";

export interface ReasonSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  presets: readonly string[];
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Ô lý do: chọn một lý do hay gặp, hoặc "Khác…" để gõ tay. Giá trị trả ra luôn là chuỗi lý do
 * (nhãn đã chọn hoặc chữ đã gõ), nên schema `reason` cũ dùng được nguyên vẹn.
 */
export function ReasonSelect({
  id,
  value,
  onChange,
  presets,
  disabled,
  invalid,
  describedBy,
}: ReasonSelectProps) {
  const [isOther, setIsOther] = useState(
    () => !!value && !presets.includes(value),
  );
  const items: Record<string, string> = Object.fromEntries([
    ...presets.map((preset) => [preset, preset]),
    [OTHER, REASON_OTHER_LABEL],
  ]);
  return (
    <div className="space-y-3">
      <Select
        items={items}
        value={isOther ? OTHER : value || null}
        onValueChange={(next) => {
          const picked = String(next ?? "");
          if (picked === OTHER) {
            setIsOther(true);
            onChange("");
            return;
          }
          setIsOther(false);
          onChange(picked);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={invalid && !isOther}
          aria-describedby={isOther ? undefined : describedBy}
        >
          <SelectValue placeholder="Chọn lý do" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset} value={preset}>
              {preset}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>{REASON_OTHER_LABEL}</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0">
          <Label htmlFor={`${id}-other`}>Ghi rõ lý do</Label>
          <Textarea
            id={`${id}-other`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            autoFocus
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
      )}
    </div>
  );
}
