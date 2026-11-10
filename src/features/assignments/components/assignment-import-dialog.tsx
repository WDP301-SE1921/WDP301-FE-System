"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { academicApi } from "@/features/academic/api";
import type { AssignmentImportPreview } from "@/types/academic-workflows";
import {
  assignmentImportFileSchema,
  ASSIGNMENT_FILE_ACCEPT,
} from "@/lib/validators/assignment-import";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CsvDownloadButton } from "@/components/shared/actions/csv-download-button";
import { assignmentCsvTemplate } from "../csv-export";

interface AssignmentImportDialogProps {
  classId: string;
  open: boolean;
  currentQuestionCount: number;
  onOpenChange: (open: boolean) => void;
  onApply: (preview: AssignmentImportPreview, replace: boolean) => void;
}

export function AssignmentImportDialog({
  classId,
  open,
  currentQuestionCount,
  onOpenChange,
  onApply,
}: AssignmentImportDialogProps) {
  const [replacing, setReplacing] = useState(false);
  const form = useForm<z.infer<typeof assignmentImportFileSchema>>({
    resolver: zodResolver(assignmentImportFileSchema),
  });
  const preview = useMutation({
    mutationFn: (file: File) => academicApi.importAssignment(classId, file),
    retry: false,
  });
  const apply = (replace: boolean) => {
    if (!preview.data) return;
    onApply(preview.data, replace);
    preview.reset();
    form.reset();
    setReplacing(false);
    onOpenChange(false);
  };
  const close = (next: boolean) => {
    if (preview.isPending) return;
    if (!next) {
      preview.reset();
      form.reset();
    }
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        size="full"
        className="max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Nhập câu hỏi từ file</DialogTitle>
          <DialogDescription>
            CSV theo mẫu, Word DOCX, PDF hoặc ảnh JPG/PNG, tối đa 5 MiB. Với
            CSV, lưu từ Excel dạng &quot;CSV UTF-8 (Comma delimited)&quot;. Nội
            dung chỉ được đưa vào bản nháp sau khi bạn xem lại.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Word và PDF được trích xuất bằng AI. Kiểm tra lại đề, đáp án, tiêu
            chí chấm và điểm. PDF scan và ảnh cần cấu hình AI đọc ảnh; đối chiếu
            tệp gốc nếu có vùng không đọc rõ.
          </div>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((value) =>
              preview.mutate(value.file[0]),
            )}
          >
            <Label htmlFor="assignment-file">File bài tập / đề kiểm tra</Label>
            <Input
              id="assignment-file"
              type="file"
              accept={ASSIGNMENT_FILE_ACCEPT}
              disabled={preview.isPending}
              aria-invalid={!!form.formState.errors.file}
              aria-describedby="assignment-file-error"
              {...form.register("file", { onChange: () => preview.reset() })}
            />
            <div id="assignment-file-error">
              <FieldError message={form.formState.errors.file?.message} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={preview.isPending}
                isLoading={preview.isPending}
              >
                Đọc file và xem trước
              </Button>
              <CsvDownloadButton
                label="Tải file mẫu"
                createCsv={assignmentCsvTemplate}
                filename="bai-tap-mau"
                disabled={preview.isPending}
              />
            </div>
          </form>
          <ApiFeedback error={preview.error} />
          {preview.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Đang đọc file. Quá trình này có thể mất khoảng một phút.
            </p>
          )}
          {preview.data && (
            <section className="space-y-4" aria-label="Xem trước câu hỏi">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{preview.data.fileName}</h3>
                <Badge variant="secondary">
                  {preview.data.questions.length} câu hỏi
                </Badge>
              </div>
              {preview.data.warnings.length > 0 && (
                <Alert>
                  <AlertTitle>Nội dung cần kiểm tra lại</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc space-y-1">
                      {preview.data.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <ol className="space-y-3">
                {preview.data.questions.map((question, index) => (
                  <li
                    key={index}
                    className="space-y-2 rounded-xl border border-border p-4"
                  >
                    <p className="text-sm font-medium">
                      Câu {index + 1} ·{" "}
                      {question.kind === "ESSAY" ? "Tự luận" : "Trắc nghiệm"} ·{" "}
                      {question.maxScore} điểm
                    </p>
                    <p className="whitespace-pre-wrap wrap-anywhere text-sm">
                      {question.prompt}
                    </p>
                    {question.choices && (
                      <ul className="list-inside list-disc text-sm">
                        {question.choices.map((choice, i) => (
                          <li key={i}>{choice}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {question.kind === "ESSAY"
                        ? `Tiêu chí chấm: ${question.rubric || "Cần bổ sung trong bản nháp"}`
                        : `Đáp án: ${question.correctAnswer || "Cần bổ sung trong bản nháp"}`}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-muted-foreground">
                Sau khi nhập, bạn có thể sửa từng câu trước khi lưu nháp. Lưu
                nháp và giao bài là hai thao tác riêng.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => apply(false)}
                  disabled={
                    currentQuestionCount + preview.data.questions.length > 100
                  }
                >
                  Thêm vào bản nháp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplacing(true)}
                >
                  Thay các câu hỏi hiện có
                </Button>
                {currentQuestionCount + preview.data.questions.length > 100 && (
                  <p role="alert" className="text-sm text-destructive">
                    Tối đa 100 câu. Chọn thay các câu hỏi hiện có hoặc giảm số
                    câu trong file.
                  </p>
                )}
              </div>
            </section>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => close(false)}
            disabled={preview.isPending}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
      <ConfirmDialog
        open={replacing}
        onOpenChange={setReplacing}
        title="Thay các câu hỏi hiện có?"
        description="Các câu hỏi trong form sẽ được thay bằng nội dung từ file. Thao tác này chưa lưu lên hệ thống."
        confirmText="Thay câu hỏi"
        onConfirm={() => apply(true)}
      />
    </Dialog>
  );
}
