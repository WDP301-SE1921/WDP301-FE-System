"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { OutcomeSet } from "@/types/outcomes";

const STATUS_TEXT: Record<OutcomeSet["status"], string> = {
  DRAFT: "Bản nháp",
  TECHNICALLY_APPROVED: "Chờ Quản lý duyệt áp dụng",
  APPROVED: "Đã duyệt áp dụng",
};

/**
 * Chọn nhiều mục tiêu khóa học, chia theo bộ. Dùng chung cho form bài học (curriculum) và hộp
 * "Gắn mục tiêu cho bài" (outcomes). Bộ bị khóa hiện dấu chọn nhưng không đổi được.
 */
export function OutcomePicker({
  sets,
  value,
  onChange,
  isLocked,
  idPrefix = "outcome-pick",
}: {
  sets: OutcomeSet[];
  value: string[];
  onChange: (value: string[]) => void;
  isLocked?: (set: OutcomeSet) => boolean;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-4">
      {sets.map((set) => {
        const locked = !!isLocked?.(set);
        return (
          <fieldset
            key={set.id}
            className="space-y-2"
            disabled={locked}
            aria-describedby={locked ? `${idPrefix}-locked-${set.id}` : undefined}
          >
            <legend className="text-sm font-medium">
              {set.level} · bản {set.version} ({STATUS_TEXT[set.status]})
            </legend>
            {locked && (
              <p
                id={`${idPrefix}-locked-${set.id}`}
                className="text-xs text-muted-foreground"
              >
                Bài học này đã duyệt nên không đổi được mục tiêu của bộ đã duyệt. Muốn đổi, tạo bản giáo trình mới.
              </p>
            )}
            {set.outcomes.map((outcome) => {
              const id = `${idPrefix}-${outcome.id}`;
              return (
                <div key={outcome.id} className="flex items-start gap-3">
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    disabled={locked}
                    checked={value.includes(outcome.id)}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked
                          ? [...value, outcome.id]
                          : value.filter((item) => item !== outcome.id),
                      )
                    }
                  />
                  <Label htmlFor={id} className="leading-snug font-normal">
                    <span className="font-medium">{outcome.code}</span> · {outcome.title}
                  </Label>
                </div>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}
