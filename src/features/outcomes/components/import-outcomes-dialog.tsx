"use client";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { userFacingMessage } from "@/lib/api/error-message";
import type { OutcomeSet } from "@/types/outcomes";
import { uncertainAcademicFailure } from "@/features/curriculum/operation-storage";
import { outcomeApi, type OutcomeImportRow } from "../api";

const MAX_BYTES = 5 * 1024 * 1024;

/** Lý do từng mã lỗi dòng của BE, viết cho nhân viên không rành kỹ thuật. */
const ROW_ERROR_TEXT: Record<string, string> = {
  TITLE_REQUIRED: "Thiếu tên mục tiêu.",
  VALUE_TOO_SHORT: "Mã quá ngắn (ít nhất 2 ký tự).",
  VALUE_TOO_LONG: "Nội dung quá dài. Hãy viết ngắn lại.",
  DUPLICATE_CODE_IN_FILE: "Mã bị trùng với một dòng khác trong file.",
  CODE_EXISTS: "Mã này đã có trong bộ mục tiêu.",
  REQUIRED_INVALID: "Cột “Bắt buộc” chỉ ghi Có hoặc Không.",
};
const rowReasons = (row: OutcomeImportRow) =>
  row.errors.map((error) => ({
    key: `${error.field}-${error.code}`,
    text: ROW_ERROR_TEXT[error.code] ?? "Dòng này chưa hợp lệ.",
  }));

/** Nhập mục tiêu từ Excel/CSV: chọn file, xem từng dòng, rồi mới thêm vào bộ nháp. */
export function ImportOutcomesDialog({
  set,
  programId,
  onClose,
}: {
  set: OutcomeSet;
  programId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  // Một khóa cho mỗi bản xem trước; thử lại sau lỗi chưa rõ kết quả dùng lại đúng khóa này.
  const attempt = useRef<{ previewId: string; key: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const preview = useMutation({
    mutationFn: (file: File) => outcomeApi.importPreview(set.id, file),
    retry: false,
  });
  const commit = useMutation({
    mutationFn: (previewId: string) => {
      if (attempt.current?.previewId !== previewId)
        attempt.current = { previewId, key: crypto.randomUUID() };
      return outcomeApi.importCommit(set.id, previewId, attempt.current.key);
    },
    retry: false,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["web-api"] }),
        client.invalidateQueries({ queryKey: ["outcome-sets", programId] }),
      ]);
      toast.success(`Đã thêm ${result.createdCount} mục tiêu.`);
      onClose();
    },
    onError: (error) => {
      if (!uncertainAcademicFailure(error)) {
        attempt.current = null;
        preview.reset();
        setFileKey((key) => key + 1);
      }
    },
  });
  const data = preview.data;
  const busy = preview.isPending || commit.isPending;
  const failure = preview.error ?? commit.error;
  const chooseAnother = () => {
    preview.reset();
    commit.reset();
    setFileError(null);
    setFileKey((key) => key + 1);
  };
  const onFile = (file: File | undefined) => {
    commit.reset();
    setFileError(null);
    attempt.current = null;
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name))
      return setFileError("Chỉ nhận file .xlsx hoặc .csv.");
    if (file.size > MAX_BYTES)
      return setFileError("File lớn hơn 5 MB. Chọn file nhỏ hơn.");
    preview.mutate(file);
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nhập mục tiêu từ Excel</DialogTitle>
        <DialogDescription>
          Điền mục tiêu vào file mẫu, chọn file ở đây và xem lại từng dòng trước
          khi thêm vào bộ “{set.level}”.
        </DialogDescription>
      </DialogHeader>
      {!data ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Chưa có file?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 align-baseline"
              onClick={() =>
                void outcomeApi
                  .downloadTemplate()
                  .catch((error) => toast.error(userFacingMessage(error)))
              }
            >
              Tải file mẫu
            </Button>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="outcome-import-file">
              Chọn file Excel hoặc CSV
            </Label>
            <Input
              key={fileKey}
              id="outcome-import-file"
              type="file"
              accept=".xlsx,.csv"
              aria-describedby="outcome-import-help"
              aria-invalid={!!(fileError || failure)}
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Xóa ô chọn để chọn lại đúng file đã sửa vẫn kích hoạt kiểm tra mới.
                event.target.value = "";
                onFile(file);
              }}
            />
            <p
              id="outcome-import-help"
              className="text-xs text-muted-foreground"
            >
              File .xlsx hoặc .csv, tối đa 5 MB và 200 dòng.
            </p>
          </div>
          {preview.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Đang kiểm tra file…
            </p>
          )}
          {(fileError || failure) && (
            <Alert variant="destructive">
              <AlertDescription>
                {fileError ?? userFacingMessage(failure)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {data.summary.validRows} dòng hợp lệ, {data.summary.invalidRows}{" "}
            dòng lỗi
          </p>
          {data.summary.invalidRows > 0 && (
            <p className="text-sm text-muted-foreground">
              Sửa các dòng đỏ trong file rồi chọn lại file. Chưa có mục tiêu nào
              được thêm.
            </p>
          )}
          <div className="max-h-80 overflow-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dòng</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên mục tiêu</TableHead>
                  <TableHead>Bắt buộc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => {
                  const reasons = rowReasons(row);
                  return (
                    <TableRow
                      key={row.rowNumber}
                      className={reasons.length ? "bg-destructive/10" : ""}
                    >
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.code || "—"}</TableCell>
                      <TableCell className="max-w-72 whitespace-normal">
                        <p className="font-medium">{row.title || "—"}</p>
                        {reasons.map((reason) => (
                          <p
                            key={reason.key}
                            className="text-xs text-destructive"
                          >
                            {reason.text}
                          </p>
                        ))}
                      </TableCell>
                      <TableCell>{row.required ? "Có" : "Không"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {failure && (
            <Alert variant="destructive">
              <AlertDescription>{userFacingMessage(failure)}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={chooseAnother}
            >
              Chọn file khác
            </Button>
            <Button
              type="button"
              disabled={
                busy ||
                data.summary.invalidRows > 0 ||
                data.summary.validRows === 0
              }
              isLoading={commit.isPending}
              onClick={() => commit.mutate(data.previewId)}
            >
              Thêm {data.summary.validRows} mục tiêu
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
