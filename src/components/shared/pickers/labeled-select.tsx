"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LabeledSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Shared filter/form control; labels remain usable with a keyboard and long content. */
export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: LabeledSelectProps) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={Object.fromEntries(
          options.map((option) => [option.value, option.label]),
        )}
        value={value}
        onValueChange={(next) => onChange(String(next ?? ""))}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full min-w-0 [&_[data-slot=select-value]]:truncate"
        >
          <SelectValue placeholder="Chọn…" />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="wrap-break-word"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
