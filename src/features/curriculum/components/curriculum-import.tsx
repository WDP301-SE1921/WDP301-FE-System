"use client";
import { useState } from "react";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import {
  curriculumImportFileSchema as fileSchema,
  type CurriculumImportFileInput,
} from "@/lib/validators/curriculum";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import {
  importCommitSchema,
  type ImportCommitInput,
} from "@/lib/validators/curriculum";
import type { CurriculumUnitDetail } from "@/types/curriculum";
import { curriculumApi } from "../api";
import { importCommitFromPreview } from "../import-contract";
import { curriculumImportDiagnosticText } from "../presentation";
import {
  readAcademicAttempt,
  saveAcademicAttempt,
  clearAcademicAttempt,
  uncertainAcademicFailure,
  type AcademicAttempt,
} from "../operation-storage";
import {
  useCurriculumFormState,
  type CurriculumFormState,
} from "../hooks/use-curriculum-form";
export function CurriculumImport({
  unit,
  userId,
  onStateChange,
}: {
  unit: CurriculumUnitDetail;
  userId: string;
  onStateChange?: (state: CurriculumFormState) => void;
}) {
  const now = useCurrentTime();
  const client = useQueryClient(),
    target = "import:" + unit.id;
  const [restored] = useState(() => {
    try {
      return {
        attempt: readAcademicAttempt(userId, target, importCommitSchema),
        error: null,
      };
    } catch (error) {
      return { attempt: null, error };
    }
  });
  const [attempt, setAttempt] =
    useState<AcademicAttempt<ImportCommitInput> | null>(restored.attempt);
  const [confirm, setConfirm] = useState(false);
  // Đổi key để làm trống ô chọn tệp sau khi nhập xong; RHF không xóa được FileList trong DOM.
  const [fileKey, setFileKey] = useState(0);
  // Đã nhập xong tệp đang chọn: không còn gì chưa lưu cho tới khi chọn tệp khác.
  const [imported, setImported] = useState(false);
  const form = useForm<CurriculumImportFileInput>({
    resolver: zodResolver(fileSchema),
    defaultValues: { mode: "APPEND" },
  });
  const preview = useMutation({
    mutationFn: (input: CurriculumImportFileInput) =>
      curriculumApi.importPreview(unit.id, input.file[0], input.mode),
    retry: false,
  });
  const commit = useMutation({
    mutationFn: async () => {
      const operation =
        attempt ??
        saveAcademicAttempt(
          userId,
          target,
          importCommitSchema,
          importCommitFromPreview(preview.data!, form.getValues("mode")),
        );
      setAttempt(operation);
      return curriculumApi.importCommit(unit.id, operation.body, operation.key);
    },
    retry: false,
    onSuccess: () => {
      clearAcademicAttempt(userId, target);
      setAttempt(null);
      preview.reset();
      form.reset({ mode: "APPEND" });
      setFileKey((key) => key + 1);
      setImported(true);
      void client.invalidateQueries({ queryKey: ["curriculum"] });
    },
    onError: (error) => {
      if (!uncertainAcademicFailure(error)) {
        clearAcademicAttempt(userId, target);
        setAttempt(null);
        preview.reset();
      }
    },
  });
  const locked =
    !!attempt || preview.isPending || commit.isPending || !!restored.error;
  useCurriculumFormState(
    (form.formState.isDirty && !imported) || !!preview.data || !!attempt,
    preview.isPending || commit.isPending,
    onStateChange,
  );
  const ready =
    !!preview.data &&
    !preview.data.summary.invalidRows &&
    preview.data.expectedRevision === unit.revision &&
    Date.parse(preview.data.expiresAt) > now;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập bài học từ CSV</CardTitle>
      </CardHeader>
      <CardContent className="grid items-start gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Button
            type="button"
            variant="outline"
            render={<a href="/templates/giao-trinh-mau.csv" download />}
          >
            Tải CSV mẫu
          </Button>
          <p className="text-xs text-muted-foreground">
            Đúng 5 cột: kind, sequence, title, content, monthKey. kind là
            LESSON; monthKey để trống. Nội dung có dấu phẩy hoặc xuống dòng phải
            đặt trong dấu ngoặc kép. Chỉ nhận CSV UTF-8; chưa hỗ trợ XLSX,
            chương và tài liệu.
          </p>
          <form
            className="space-y-3"
            noValidate
            onSubmit={form.handleSubmit((input) => preview.mutate(input))}
          >
            <Label htmlFor="curriculum-csv">
              File CSV UTF-8 (tối đa 5 MiB, 1.000 dòng)
            </Label>
            <Input
              key={fileKey}
              id="curriculum-csv"
              type="file"
              accept=".csv,text/csv"
              disabled={locked}
              aria-invalid={!!form.formState.errors.file}
              aria-describedby="curriculum-csv-help"
              {...form.register("file", {
                onChange: () => {
                  preview.reset();
                  setImported(false);
                },
              })}
            />
            <div id="curriculum-csv-help">
              <FieldError message={form.formState.errors.file?.message} />
              <p className="text-xs text-muted-foreground">
                CSV chỉ nhập bài học. Giáo viên tạo bài kiểm tra riêng theo buổi
                học.
              </p>
            </div>
            <Controller
              control={form.control}
              name="mode"
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={locked}
                  items={[
                    { value: "APPEND", label: "Thêm vào nội dung hiện có" },
                    { value: "REPLACE", label: "Thay toàn bộ bài học" },
                  ]}
                  onValueChange={(v) => {
                    field.onChange(v);
                    preview.reset();
                  }}
                >
                  <SelectTrigger aria-label="Chế độ nhập CSV">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPEND">
                      Thêm vào nội dung hiện có
                    </SelectItem>
                    <SelectItem value="REPLACE">
                      Thay toàn bộ bài học
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={locked}
              isLoading={preview.isPending}
            >
              Xem trước CSV
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Thêm vào nội dung hiện có giữ nguyên bài cũ. Thay toàn bộ chỉ thay
            bài trong bản nháp và luôn yêu cầu xác nhận.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          {!preview.data && !attempt && (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Chọn file và bấm Xem trước để kiểm tra từng dòng trước khi nhập.
            </p>
          )}
          <ApiFeedback
            error={restored.error ?? preview.error ?? commit.error}
          />
          {attempt && (
            <p role="status" className="rounded-xl bg-muted p-3">
              Có thao tác nhập cần xác nhận lại. Thử lại giữ nguyên nội dung đã
              gửi.
            </p>
          )}
          {preview.data && (
            <>
              <p>
                {preview.data.summary.validRows} dòng hợp lệ ·{" "}
                {preview.data.summary.invalidRows} dòng lỗi
              </p>
              {!ready && !preview.data.summary.invalidRows && (
                <p role="status">
                  Nháp đã thay đổi hoặc bản xem trước hết hạn. Xem trước lại.
                </p>
              )}
              <div className="max-h-96 overflow-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dòng</TableHead>
                      <TableHead>STT</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Kết quả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.data.rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>{row.sequence ?? "—"}</TableCell>
                        <TableCell className="max-w-80 whitespace-normal">
                          <p className="font-medium">{row.title}</p>
                          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                            {row.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.kind === "LESSON"
                              ? "Bài " + row.sequence
                              : "Loại nội dung không được hỗ trợ"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-72 whitespace-normal">
                          {row.errors.length
                            ? row.errors.map((e) => (
                                <p className="text-destructive" key={e.code}>
                                  {curriculumImportDiagnosticText(e)}
                                </p>
                              ))
                            : "Hợp lệ"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {(preview.data || attempt) && (
            <Button
              disabled={
                commit.isPending || !!restored.error || (!attempt && !ready)
              }
              isLoading={commit.isPending}
              onClick={() => {
                if (!attempt && form.getValues("mode") === "REPLACE")
                  setConfirm(true);
                else commit.mutate();
              }}
            >
              {attempt ? "Thử lại nhập nội dung" : "Nhập vào bản nháp"}
            </Button>
          )}
          {commit.isSuccess && (
            <p role="status">Đã nhập {commit.data.createdCount} nội dung.</p>
          )}
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Thay toàn bộ nội dung?"
            description="Các bài học trong bản nháp sẽ được thay bằng danh sách vừa xem trước."
            variant="danger"
            isLoading={commit.isPending}
            onConfirm={async () => {
              try {
                await commit.mutateAsync();
              } catch {
                /* feedback remains visible */
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
