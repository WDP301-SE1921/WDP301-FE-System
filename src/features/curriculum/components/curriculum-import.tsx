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
import { importIsDirty } from "../import-state";
import { ApiError } from "@/lib/api/client";
import { csvRowErrorLines } from "@/lib/api/csv-error-message";
import { CsvDownloadButton } from "@/components/shared/actions/csv-download-button";
import { curriculumCsv, curriculumCsvTemplate } from "../csv-export";
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
    importIsDirty({
      formDirty: form.formState.isDirty,
      imported,
      hasPreview: !!preview.data,
      hasPendingAttempt: !!attempt,
    }),
    preview.isPending || commit.isPending,
    onStateChange,
  );
  const failure = restored.error ?? preview.error ?? commit.error;
  const failureRows =
    failure instanceof ApiError && failure.code === "CSV_INVALID"
      ? csvRowErrorLines(failure.details)
      : [];
  const ready =
    !!preview.data &&
    !preview.data.summary.invalidRows &&
    preview.data.expectedRevision === unit.revision &&
    Date.parse(preview.data.expiresAt) > now;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập bài từ file</CardTitle>
      </CardHeader>
      <CardContent className="grid items-start gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start gap-2">
            <CsvDownloadButton
              label="Tải file mẫu"
              createCsv={curriculumCsvTemplate}
              filename="giao-trinh-mau"
              disabled={locked}
            />
            <CsvDownloadButton
              label="Xuất bài ra file"
              createCsv={() => curriculumCsv(unit.lessons)}
              filename={unit.title}
              disabled={
                locked ||
                !unit.lessons.some((lesson) => lesson.kind === "LESSON")
              }
            />
          </div>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            <li>Tải file mẫu hoặc xuất bài hiện có.</li>
            <li>Mở bằng Excel, mỗi dòng một bài, không xóa dòng đầu.</li>
            <li>
              Lưu dạng &quot;CSV UTF-8 (Comma delimited)&quot; rồi chọn file ở
              đây.
            </li>
          </ol>
          <details className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Chi tiết kỹ thuật
            </summary>
            <div className="mt-2 space-y-2">
              <p>
                Các cột nội dung: kind, sequence, title, content, monthKey. Cột
                kind ghi LESSON; để trống monthKey. Cột csvVersion có thể để
                trống (hiểu là 1); giữ nguyên cột này trong file tải từ hệ thống
                để nhập lại đúng ký tự đặc biệt. File CSV cũ vẫn được hỗ trợ.
              </p>
              <p>
                Chỉ nhận CSV UTF-8, dấu phẩy hoặc dấu chấm phẩy; chưa hỗ trợ
                XLSX. Tối đa 5 MiB và 1.000 dòng; giới hạn lưu nội dung là 1
                MiB. CSV chỉ nhập bài học, giáo viên tạo bài kiểm tra riêng theo
                buổi học.
              </p>
            </div>
          </details>
          <form
            className="space-y-3"
            noValidate
            onSubmit={form.handleSubmit((input) => preview.mutate(input))}
          >
            <Label htmlFor="curriculum-csv">
              Chọn file CSV đã lưu từ Excel
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
              Kiểm tra file
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Thêm vào nội dung hiện có giữ nguyên bài cũ. Thay toàn bộ sẽ thay
            các bài trong bản nháp và gỡ mục tiêu đã gắn cho các bài đó; bạn cần
            gắn lại sau khi nhập. Luôn có hộp xác nhận.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          {!preview.data && !attempt && (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              Chọn file rồi bấm Kiểm tra file để xem từng dòng trước khi nhập.
            </p>
          )}
          <ApiFeedback error={failure} />
          {!!failureRows.length && (
            <ul className="max-h-64 list-inside list-disc space-y-1 overflow-auto rounded-xl bg-muted p-3 text-sm">
              {failureRows.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
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
                  Nháp đã thay đổi hoặc kết quả kiểm tra hết hạn. Bấm Kiểm tra file lại.
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
            <p role="status">Đã nhập {commit.data.createdCount} bài học.</p>
          )}
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Thay toàn bộ nội dung?"
            description="Các bài học trong bản nháp sẽ được thay bằng danh sách vừa xem trước. Mục tiêu đã gắn cho các bài này sẽ bị gỡ, bạn cần gắn lại sau khi nhập."
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
