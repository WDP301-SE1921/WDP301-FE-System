import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import type { RegistrationClass } from "@/types/backend";
import { money, scheduleText } from "../calendar";

const WEEKDAYS = {
  all: "Tất cả ngày học",
  "1": "Thứ 2",
  "2": "Thứ 3",
  "3": "Thứ 4",
  "4": "Thứ 5",
  "5": "Thứ 6",
  "6": "Thứ 7",
  "7": "Chủ nhật",
};
const AVAILABILITY = {
  all: "Tất cả trạng thái",
  eligible: "Có thể đăng ký",
  unavailable: "Không thể đăng ký",
};
const FILTERS = {
  classSearch: parseAsString.withDefault(""),
  classSubject: parseAsString.withDefault(""),
  classWeekday: parseAsStringLiteral([
    "all",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
  ]).withDefault("all"),
  classAvailability: parseAsStringLiteral([
    "all",
    "eligible",
    "unavailable",
  ]).withDefault("all"),
};

interface RegistrationClassPickerProps {
  classes: RegistrationClass[];
  selectedClassId: string;
  onSelect: (classroom: RegistrationClass) => void;
}

function canRegister(classroom: RegistrationClass) {
  return (
    classroom.isOpen &&
    classroom.weeklySchedules.length > 0 &&
    classroom.isEligible !== false
  );
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function RegistrationClassPicker({
  classes,
  selectedClassId,
  onSelect,
}: RegistrationClassPickerProps) {
  const [filters, setFilters] = useQueryStates(FILTERS);
  const subjects = [
    ...new Set(classes.map((item) => item.program.subject)),
  ].sort((a, b) => a.localeCompare(b, "vi"));
  const subjectItems = {
    "": "Tất cả môn học",
    ...Object.fromEntries(subjects.map((subject) => [subject, subject])),
  };
  const search = normalizeSearch(filters.classSearch);
  const rows = classes.filter((item) => {
    const eligible = canRegister(item);
    return (
      normalizeSearch(
        `${item.name} ${item.program.name} ${item.program.subject}`,
      ).includes(search) &&
      (!filters.classSubject ||
        item.program.subject === filters.classSubject) &&
      (filters.classWeekday === "all" ||
        item.weeklySchedules.some(
          (slot) => slot.weekday === Number(filters.classWeekday),
        )) &&
      (filters.classAvailability === "all" ||
        (filters.classAvailability === "eligible" ? eligible : !eligible))
    );
  });
  const hasFilters =
    !!filters.classSearch ||
    !!filters.classSubject ||
    filters.classWeekday !== "all" ||
    filters.classAvailability !== "all";
  const hiddenSelection = classes.find(
    (item) =>
      item.id === selectedClassId && !rows.some((row) => row.id === item.id),
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="registration-class-search">Tìm lớp học</Label>
        <Input
          id="registration-class-search"
          type="search"
          placeholder="Tìm theo tên lớp hoặc môn học…"
          value={filters.classSearch}
          onChange={(event) =>
            void setFilters({ classSearch: event.target.value })
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="registration-class-subject">Môn học</Label>
          <Select
            items={subjectItems}
            value={filters.classSubject}
            onValueChange={(value) =>
              void setFilters({ classSubject: String(value ?? "") })
            }
          >
            <SelectTrigger id="registration-class-subject">
              <SelectValue className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(subjectItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="registration-class-weekday">Ngày học</Label>
          <Select
            items={WEEKDAYS}
            value={filters.classWeekday}
            onValueChange={(value) =>
              void setFilters({
                classWeekday:
                  FILTERS.classWeekday.parse(String(value)) ?? "all",
              })
            }
          >
            <SelectTrigger id="registration-class-weekday">
              <SelectValue className="truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{WEEKDAYS.all}</SelectItem>
              {Object.entries(WEEKDAYS)
                .filter(([value]) => value !== "all")
                .map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="registration-class-availability">Trạng thái</Label>
          <Select
            items={AVAILABILITY}
            value={filters.classAvailability}
            onValueChange={(value) =>
              void setFilters({
                classAvailability:
                  FILTERS.classAvailability.parse(String(value)) ?? "all",
              })
            }
          >
            <SelectTrigger id="registration-class-availability">
              <SelectValue className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AVAILABILITY).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <p
          id="registration-class-count"
          role="status"
          className="text-sm text-muted-foreground"
        >
          Hiển thị {rows.length}/{classes.length} lớp học
        </p>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void setFilters(null)}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
      {hiddenSelection && (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          Lớp đã chọn: {hiddenSelection.name}. Lớp này đang ẩn bởi bộ lọc.
        </p>
      )}
      <div
        key={`${filters.classSearch}-${filters.classSubject}-${filters.classWeekday}-${filters.classAvailability}`}
        role="radiogroup"
        aria-label="Danh sách lớp học"
        aria-describedby="registration-class-count"
        tabIndex={0}
        className="max-h-[min(28rem,55dvh)] space-y-3 overflow-y-auto overscroll-contain rounded-xl p-1 focus-visible:outline-ring"
      >
        {rows.map((item) => {
          const eligible = canRegister(item);
          return (
            <label
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border p-4 ${selectedClassId === item.id && item.isEligible !== false ? "border-primary bg-primary/5" : "border-border"} ${eligible ? "cursor-pointer" : "opacity-60"}`}
            >
              <input
                className="mt-1"
                type="radio"
                name="class"
                value={item.id}
                checked={selectedClassId === item.id}
                disabled={
                  !eligible && item.ineligibleReason !== "INVALID_START_DATE"
                }
                onChange={() => onSelect(item)}
              />
              <span className="min-w-0 flex-1 space-y-1 break-words">
                <span className="block font-medium">{item.name}</span>
                <span className="block text-sm">
                  {item.program.subject} · Khối {item.program.grade}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {scheduleText(item.weeklySchedules) || "Chưa có lịch tuần"}
                </span>
                <span className="block text-sm">
                  {money(item.monthlyFee)}/tháng · Sức chứa {item.capacity} học
                  sinh
                </span>
                {item.availableSeats !== undefined && (
                  <span className="block text-sm">
                    Còn {item.availableSeats} chỗ trong kỳ đã chọn
                  </span>
                )}
                {item.isEligible === false && (
                  <span className="block text-sm text-destructive">
                    {
                      new ApiError(
                        item.ineligibleReason ?? "CLASS_UNAVAILABLE",
                        item.ineligibleMessage ||
                          "Lớp không phù hợp với học sinh hoặc kỳ học này.",
                        409,
                      ).message
                    }
                  </span>
                )}
              </span>
              <Badge
                className="shrink-0"
                variant={eligible ? "success" : "secondary"}
              >
                {eligible
                  ? "Mở đăng ký"
                  : item.isEligible === false
                    ? "Không phù hợp"
                    : "Chưa mở"}
              </Badge>
            </label>
          );
        })}
        {classes.length > 0 && !rows.length && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Không có lớp phù hợp với bộ lọc. Thử thay đổi hoặc xóa bộ lọc.
          </p>
        )}
      </div>
    </div>
  );
}
