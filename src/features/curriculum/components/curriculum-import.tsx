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
    form.formState.isDirty || !!preview.data || !!attempt,
    preview.isPending || commit.isPending,
    onStateChange,
  );
  const ready =
    !!preview.data &&
    !preview.data.summary.invalidRows &&
    preview.data.expectedRevision === unit.revision &&
    Date.parse(preview.data.expiresAt) > now;
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          "\uFEFFkind,sequence,title,content,monthKey\nLESSON,1,Bài học 1,Nội dung bài 1,\nLESSON,2,Bài học 2,Nội dung bài 2,\n",
        ],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "giao-trinh-mau.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập bài học từ CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button type="button" variant="outline" onClick={download}>
          Tải CSV mẫu
        </Button>
        <form
          className="space-y-3"
          noValidate
          onSubmit={form.handleSubmit((input) => preview.mutate(input))}
        >
          <Label htmlFor="curriculum-csv">
            File CSV UTF-8 (tối đa 5 MiB, 1.000 dòng)
          </Label>
          <Input
            id="curriculum-csv"
            type="file"
            accept=".csv,text/csv"
            disabled={locked}
            aria-invalid={!!form.formState.errors.file}
            aria-describedby="curriculum-csv-help"
            {...form.register("file", { onChange: () => preview.reset() })}
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
                  <SelectItem value="REPLACE">Thay toàn bộ bài học</SelectItem>
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
        <ApiFeedback error={restored.error ?? preview.error ?? commit.error} />
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
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.data.rows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
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
                      <TableCell>
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
      </CardContent>
    </Card>
  );
}
