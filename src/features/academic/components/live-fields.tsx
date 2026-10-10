"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useId } from "react";
export function LiveSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={Object.fromEntries(
          options.map((option) => [option.value, option.label]),
        )}
        value={value}
        onValueChange={(next) => onChange(String(next ?? ""))}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Chọn…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function displayMoment(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
export const STATUS_TEXT: Record<string, string> = {
  ACTIVE: "Đang học",
  ENDED: "Đã kết thúc",
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã công bố",
  CLOSED: "Đã đóng",
  APPROVED: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Hoàn tất",
  BOOKED: "Đã xếp",
  MISSED: "Không đi học bù",
  SUPERSEDED: "Đã có phiên bản mới",
  UNMARKED: "Chưa điểm danh",
  PRESENT: "Có mặt",
  ABSENT: "Vắng",
  EXCUSED: "Nghỉ được phép",
  QUEUED: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  SUCCEEDED: "Đã có đề xuất",
  FAILED: "Thất bại",
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  DECLINED: "Không tiếp nhận",
};
