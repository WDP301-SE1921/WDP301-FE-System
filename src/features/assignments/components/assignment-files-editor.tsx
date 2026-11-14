"use client";
import { useRef, useState } from "react";
import { academicApi } from "@/features/academic/api";
import { apiErrorMessage } from "@/lib/api/client";
import type { AssignmentAttachment } from "@/types/academic-workflows";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LabeledSelect as LiveSelect } from "@/components/shared/pickers/labeled-select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmissionFile } from "@/features/grading/components/submission-file";

export function AssignmentFilesEditor({
  value,
  onChange,
  onBusy,
  questionCount,
}: {
  questionCount: number;
  value: AssignmentAttachment[];
  onChange: (files: AssignmentAttachment[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    if (lock.current) return;
    if (value.length + files.length > 5) {
      setError("Tối đa 5 tệp cho mỗi bài.");
      return;
    }
    if (
      files.some(
        (f) =>
          !f.size ||
          f.size > 10 * 1024 * 1024 ||
          !/\.(pdf|jpe?g|png)$/i.test(f.name),
      )
    ) {
      setError("Chọn PDF, JPG hoặc PNG, mỗi tệp lớn hơn 0 và tối đa 10 MB.");
      return;
    }
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    const next = [...value];
    try {
      for (const f of files) {
        const saved = await academicApi.uploadFile(f);
        next.push({ fileId: saved.id, teacherOnly: true, file: saved });
        onChange([...next]);
      }
    } catch (e) {
      setError(
        `${apiErrorMessage(e)} Các tệp đã tải thành công được giữ lại; chọn lại tệp lỗi để thử lại.`,
      );
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <section
      className="space-y-3 rounded-2xl border border-border p-4"
      aria-label="Tệp đề bài và đáp án"
    >
      <Label htmlFor="assignment-files">Thêm file / ảnh</Label>
      <Input
        id="assignment-files"
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        disabled={busy || value.length >= 5}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void upload(files);
        }}
      />
      <p className="text-xs text-muted-foreground">
        PDF, JPG, PNG · tối đa 5 tệp, 10 MB/tệp. Tệp mới mặc định chỉ giáo viên
        xem; đổi quyền cho tệp đề muốn giao học sinh.
      </p>
      {busy && <p role="status">Đang tải tệp…</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {value.map((f, i) => (
        <div key={f.fileId} className="space-y-2 rounded-xl bg-muted p-3">
          <p className="break-words text-sm font-medium">
            {f.file?.name ?? `Tệp ${i + 1}`}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              className="rounded-xl"
              checked={f.teacherOnly}
              disabled={busy}
              onCheckedChange={(checked) =>
                onChange(
                  value.map((row) =>
                    row.fileId === f.fileId
                      ? { ...row, teacherOnly: checked }
                      : row,
                  ),
                )
              }
            />
            Chỉ giáo viên xem (đáp án/hướng dẫn chấm)
          </label>
          <LiveSelect
            label="Gắn với"
            value={
              f.questionPosition == null ? "all" : String(f.questionPosition)
            }
            disabled={busy}
            options={[
              { value: "all", label: "Toàn bài" },
              ...Array.from({ length: questionCount }, (_, q) => ({
                value: String(q),
                label: `Câu ${q + 1}`,
              })),
            ]}
            onChange={(next) =>
              onChange(
                value.map((row) =>
                  row.fileId === f.fileId
                    ? {
                        ...row,
                        questionPosition: next === "all" ? null : Number(next),
                      }
                    : row,
                ),
              )
            }
          />
          <SubmissionFile id={f.fileId} index={i} />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              onChange(value.filter((row) => row.fileId !== f.fileId))
            }
          >
            Bỏ tệp khỏi bài
          </Button>
        </div>
      ))}
    </section>
  );
}
