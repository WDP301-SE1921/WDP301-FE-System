"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calendarDateLabel } from "@/lib/calendar-date";
import type { CurriculumUnit } from "@/types/curriculum";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt áp dụng",
  ARCHIVED: "Đã lưu trữ",
};

export function unitStatusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

function versionLabel(unit: CurriculumUnit) {
  return `Bản ${unit.version} · ${calendarDateLabel(unit.fromDate.slice(0, 10))} – ${calendarDateLabel(unit.toDate.slice(0, 10))} · ${unitStatusLabel(unit.status)}`;
}

/** Chọn bản giáo trình của khóa để xem; chỉ hiện khi khóa có nhiều hơn một bản. */
export function UnitVersionSelect({
  units,
  value,
  onChange,
}: {
  units: CurriculumUnit[];
  value: string;
  onChange: (unitId: string) => void;
}) {
  if (units.length < 2) return null;
  const sorted = [...units].sort((a, b) => b.version - a.version);
  return (
    <div className="max-w-xl space-y-2">
      <Label htmlFor="content-setup-unit">Bản giáo trình</Label>
      <Select
        value={value || null}
        items={sorted.map((unit) => ({
          value: unit.id,
          label: versionLabel(unit),
        }))}
        onValueChange={(next) => onChange(String(next ?? ""))}
      >
        <SelectTrigger id="content-setup-unit">
          <SelectValue placeholder="Chọn bản giáo trình" />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {versionLabel(unit)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
