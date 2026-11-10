"use client";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import type { AssignmentEditorInput } from "@/lib/validators/web-workflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RubricEditor({
  form,
  index,
}: {
  form: UseFormReturn<AssignmentEditorInput>;
  index: number;
}) {
  const name = `questions.${index}.criteria` as const;
  const rows = useFieldArray({
    control: form.control,
    name,
    keyName: "fieldKey",
  });
  const question = useWatch({
    control: form.control,
    name: `questions.${index}`,
  });
  const total = (question.criteria ?? []).reduce(
    (sum, c) => sum + (Number.isFinite(c.maxScore) ? c.maxScore : 0),
    0,
  );
  const errors = form.formState.errors.questions?.[index]?.criteria;
  return (
    <section
      className="space-y-3 rounded-2xl border border-border p-4"
      aria-label={`Rubric câu ${index + 1}`}
    >
      <p className="font-semibold">Rubric câu {index + 1}</p>
      <p className="text-sm text-muted-foreground">
        Đã phân bổ {Math.round(total * 100) / 100}/{question.maxScore} điểm. Mục
        tiêu khóa học gắn theo cả câu hỏi.
      </p>
      {rows.fields.map((row, i) => (
        <div key={row.fieldKey} className="space-y-2 rounded-xl bg-muted p-3">
          <Label htmlFor={`criterion-${index}-${i}`}>
            Tên tiêu chí {i + 1}
          </Label>
          <Input
            id={`criterion-${index}-${i}`}
            {...form.register(`${name}.${i}.title`)}
            placeholder="Ví dụ: Lập luận đúng"
          />
          <Label htmlFor={`criterion-desc-${index}-${i}`}>
            Hướng dẫn chấm và điểm một phần
          </Label>
          <Textarea
            id={`criterion-desc-${index}-${i}`}
            {...form.register(`${name}.${i}.description`)}
            placeholder="Điều kiện đạt điểm; cách cho điểm khi đúng một phần"
          />
          <Label htmlFor={`criterion-max-${index}-${i}`}>Điểm tối đa</Label>
          <Input
            id={`criterion-max-${index}-${i}`}
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            {...form.register(`${name}.${i}.maxScore`, { valueAsNumber: true })}
          />
          {errors?.[i] && (
            <p role="alert" className="text-sm text-destructive">
              {errors[i]?.title?.message ??
                errors[i]?.description?.message ??
                errors[i]?.maxScore?.message ??
                "Kiểm tra tiêu chí."}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => rows.remove(i)}
          >
            Xóa tiêu chí {i + 1}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={rows.fields.length >= 30}
        onClick={() =>
          rows.append({
            id: crypto.randomUUID(),
            title: "",
            description: "",
            maxScore: Math.max(
              0.01,
              Math.round((question.maxScore - total) * 100) / 100,
            ),
          })
        }
      >
        Thêm tiêu chí
      </Button>
      {rows.fields.length > 0 &&
        Math.abs(total - question.maxScore) >= 0.005 && (
          <p role="status" className="text-sm text-destructive">
            Tổng tiêu chí phải bằng điểm câu trước khi giao bài. Bạn vẫn có thể
            lưu nháp.
          </p>
        )}
      {!rows.fields.length && (
        <>
          <Label htmlFor={`legacy-rubric-${index}`}>
            Barem dạng văn bản (bài cũ)
          </Label>
          <Textarea
            id={`legacy-rubric-${index}`}
            {...form.register(`questions.${index}.rubric`)}
          />
          <p className="text-xs text-muted-foreground">
            Thêm tiêu chí để chấm và lưu điểm chi tiết. Barem cũ được giữ để
            tham khảo.
          </p>
        </>
      )}
    </section>
  );
}
